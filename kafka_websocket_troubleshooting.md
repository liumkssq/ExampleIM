# Kafka数据清理与WebSocket并发问题解决方案

## 问题描述

系统遇到了两个主要问题：

1. **Kafka消息堆积**：大量消息堆积在Kafka队列中，导致消费时出现并发处理问题。

2. **WebSocket并发写入错误**：
   ```
   panic: concurrent write to websocket connection
   ```
   多个goroutine尝试同时写入同一个WebSocket连接，导致系统崩溃。

## 1. Kafka数据清理方法（Docker环境）

### 方法1：在Kafka容器内执行命令

```bash
# 进入Kafka容器
docker exec -it kafka bash

# 删除主题
/opt/bitnami/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic msgChatTransfer

# 如果需要，创建新主题
/opt/bitnami/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic msgChatTransfer --partitions 1 --replication-factor 1
```

### 方法2：重置消费者组偏移量

```bash
# 进入Kafka容器
docker exec -it kafka bash

# 查看消费者组
/opt/bitnami/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list

# 找到您的消费者组后，重置偏移量到最新位置
/opt/bitnami/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group your-consumer-group --topic msgChatTransfer --reset-offsets --to-latest --execute
```

### 方法3：删除Kafka数据卷并重启

如果不关心历史数据，最简单的方法是删除数据卷：

```bash
# 停止Kafka容器
docker-compose stop kafka

# 删除Kafka数据卷
docker volume rm exampleim_kafka_data

# 重启容器（会自动创建新卷）
docker-compose up -d kafka
```

## 2. 修复WebSocket并发写入问题

### 方案1：添加互斥锁保护写入操作

```go
// 在client.go中添加互斥锁
type client struct {
    // 现有字段
    conn *websocket.Conn
    send chan []byte
    mu   sync.Mutex // 添加互斥锁
}

// 修改Send方法
func (c *client) Send(msg []byte) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
        // 错误处理
    }
}
```

### 方案2：使用消息缓冲通道

改为使用client的send通道，实现异步处理：

```go
// 在client.go中添加或修改以下方法
func (c *client) Start() {
    go c.writePump()
}

func (c *client) writePump() {
    defer func() {
        c.conn.Close()
    }()
    
    for {
        select {
        case message, ok := <-c.send:
            if !ok {
                // 通道已关闭，需要关闭连接
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }
            
            c.mu.Lock()
            w, err := c.conn.NextWriter(websocket.TextMessage)
            if err != nil {
                c.mu.Unlock()
                return
            }
            w.Write(message)
            
            // 尝试读取更多待发送消息，进行批量发送
            n := len(c.send)
            for i := 0; i < n; i++ {
                w.Write([]byte("\n"))
                w.Write(<-c.send)
            }
            
            if err := w.Close(); err != nil {
                c.mu.Unlock()
                return
            }
            c.mu.Unlock()
        }
    }
}

// 修改消息消费代码 (msgChatTrasnfer.go)
func (l *MsgChatTransfer) Consume(key, val string) error {
    // ... 现有代码 ...
    
    // 不直接发送
    // client.Send([]byte(resp))
    
    // 改为放入通道
    select {
    case client.send <- []byte(resp):
        // 成功放入通道
    default:
        // 通道已满，可以选择丢弃或记录日志
        l.Logger.Errorf("client send channel full, message dropped")
    }
    
    return nil
}
```

## 3. 系统架构优化建议

### 消息处理优化

1. **批量处理**：不要逐条处理消息，考虑批量消费和发送
   ```go
   // 批量消费Kafka消息
   messages := consumer.Poll(100)
   batch := make([]string, 0, len(messages))
   for _, msg := range messages {
       batch = append(batch, string(msg.Value))
   }
   // 批量处理
   processBatch(batch)
   ```

2. **限流措施**：添加令牌桶或漏桶限流器
   ```go
   limiter := rate.NewLimiter(rate.Limit(100), 10) // 100 msgs/s, burst 10
   if limiter.Allow() {
       // 处理消息
   } else {
       // 延迟处理或丢弃
   }
   ```

3. **消息去重**：基于唯一标识符去重，避免重复处理
   ```go
   // 使用Redis实现简单去重
   exists, err := redisClient.SetNX(ctx, "msg:"+msgId, 1, time.Hour).Result()
   if err != nil || !exists {
       // 消息已存在，跳过处理
       return nil
   }
   // 处理新消息
   ```

### WebSocket连接管理

1. **心跳检测**：定期发送心跳，检测连接状态
   ```go
   go func() {
       ticker := time.NewTicker(30 * time.Second)
       defer ticker.Stop()
       for {
           select {
           case <-ticker.C:
               if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                   // 连接可能已断开，关闭
                   conn.Close()
                   return
               }
           }
       }
   }()
   ```

2. **连接池管理**：管理WebSocket连接数量，防止资源耗尽
   ```go
   // 简单连接计数
   var (
       connMu    sync.Mutex
       connCount int
       maxConns  = 1000
   )
   
   func handleConnection(conn *websocket.Conn) {
       connMu.Lock()
       if connCount >= maxConns {
           connMu.Unlock()
           conn.Close()
           return
       }
       connCount++
       connMu.Unlock()
       
       // 处理连接...
       
       connMu.Lock()
       connCount--
       connMu.Unlock()
   }
   ```

3. **断路器模式**：在连接异常时自动断开并恢复
   ```go
   // 使用hystrix库实现断路器
   config := hystrix.CommandConfig{
       Timeout:               1000,
       MaxConcurrentRequests: 100,
       ErrorPercentThreshold: 25,
   }
   hystrix.ConfigureCommand("websocket-write", config)
   
   err := hystrix.Do("websocket-write", func() error {
       return client.conn.WriteMessage(websocket.TextMessage, message)
   }, nil)
   ```

## 4. 监控与可观测性设置

利用docker-compose.yml中已有的工具链进行监控：

### Kafka监控

添加Kafka Exporter到docker-compose.yml：
```yaml
kafka-exporter:
  image: danielqsj/kafka-exporter
  command: 
    - '--kafka.server=kafka:9092'
  ports:
    - "9308:9308"
  networks:
    - easy-chat
```

### 追踪WebSocket连接

1. 在Jaeger中追踪WebSocket消息流：访问 http://localhost:16686

2. 添加结构化日志，便于在Kibana中分析：
   ```go
   logx.WithFields(logx.Field{
       {Key: "client_id", Value: clientID},
       {Key: "msg_id", Value: msgID},
       {Key: "conversation_id", Value: conversationID},
   }).Info("websocket message sent")
   ```

3. 设置Prometheus指标，在Grafana中展示：
   ```go
   var (
       wsConnections = promauto.NewGauge(prometheus.GaugeOpts{
           Name: "websocket_active_connections",
           Help: "The current number of active websocket connections",
       })
       
       wsMsgSent = promauto.NewCounter(prometheus.CounterOpts{
           Name: "websocket_messages_sent_total",
           Help: "The total number of messages sent through websocket",
       })
   )
   ```

## 5. 服务启动最佳实践

优化服务启动顺序，确保系统稳定：

```bash
# 基础设施层
docker-compose up -d etcd mysql redis mongo kafka

# 等待基础设施就绪
sleep 15

# 监控层
docker-compose up -d elasticsearch logstash kibana prometheus grafana jaeger zipkin

# 应用层服务
# 先启动RPC服务，再启动API服务，最后启动WebSocket服务和消费者
```

## 结论

通过以上方法，可以有效解决Kafka数据堆积和WebSocket并发写入问题。关键是：

1. 清理Kafka数据，避免消息堆积
2. 修复WebSocket并发写入问题，确保连接稳定
3. 优化系统架构，提高消息处理效率
4. 建立完善的监控系统，及时发现问题

这些措施将显著提高系统的稳定性和可靠性，特别是在高并发场景下。