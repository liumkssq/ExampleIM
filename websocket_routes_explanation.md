# ExampleIM WebSocket路由详细解析

## 路由处理机制概述

ExampleIM系统定义了三种主要的WebSocket消息路由，每种路由有不同的处理逻辑和数据流：

1. `user.online` - 用户上线通知
2. `conversation.chat` - 聊天消息发送
3. `push` - 直接消息推送

## 各路由详细解析

### 1. user.online - 用户上线

**代码实现：**
```go
func OnLine(svc *svc.ServiceContext) websocketx.HandlerFunc {
    return func(srv *websocketx.Server, conn *websocketx.Conn, msg *websocketx.Message) {
        uids := srv.GetUsers()
        u := srv.GetUsers(conn)
        err := srv.Send(websocketx.NewMessage(u[0], uids), conn)
        srv.Info("err ", err)
    }
}
```

**处理流程：**
1. 客户端发送上线消息
2. 服务端获取所有在线用户ID列表 (`srv.GetUsers()`)
3. 获取当前连接用户的ID (`srv.GetUsers(conn)`)
4. 服务端将所有在线用户列表发送回客户端
5. 记录操作结果

**用途：**
- 通知服务器用户已上线
- 获取当前所有在线用户列表
- 实现用户在线状态管理

### 2. conversation.chat - 聊天消息

**代码实现：**
```go
func Chat(svc *svc.ServiceContext) websocket.HandlerFunc {
    return func(srv *websocket.Server, conn *websocket.Conn, msg *websocket.Message) {
        var data ws.Chat
        if err := mapstructure.Decode(msg.Data, &data); err != nil {
            srv.Send(websocket.NewErrMessage(err), conn)
            return
        }
        
        switch data.ChatType {
        case constants.SingleChatType:
            // 处理单聊逻辑
            logic.NewConversation(context.Background(), srv, svc).SingleChat(&data, conn.Uid)
            
            // 推送到消息队列
            err := svc.MsgChatTransferClient.Push(&mq.MsgChatTransfer{
                ConversationId: data.ConversationId,
                ChatType:       data.ChatType,
                SendId:         conn.Uid,
                RecvId:         data.RecvId,
                SendTime:       time.Now().UnixNano(),
                MType:          data.Msg.MType,
                Content:        data.Msg.Content,
            })
            if err != nil {
                srv.Send(websocket.NewErrMessage(err), conn)
                return
            }
        }
    }
}
```

**处理流程：**
1. 客户端发送聊天消息
2. 服务端解析消息内容
3. 根据消息类型（单聊/群聊）执行不同逻辑
4. 调用业务逻辑处理（SingleChat），可能包括消息存储
5. 将消息推送到Kafka消息队列
6. 由其他服务负责后续处理和投递

**用途：**
- 处理用户发送的聊天消息
- 存储消息记录
- 通过消息队列实现可靠的消息分发
- 支持消息的持久化和异步处理

### 3. push - 直接推送

**代码实现：**
```go
func Push(svc *svc.ServiceContext) websocket.HandlerFunc {
    return func(srv *websocket.Server, conn *websocket.Conn, msg *websocket.Message) {
        var data ws.Push
        if err := mapstructure.Decode(msg.Data, &data); err != nil {
            srv.Send(websocket.NewErrMessage(err), conn)
            return
        }
        rconn := srv.GetConn(data.RecvId)
        if rconn == nil {
            fmt.Printf("recvId %v is offline\n", data.RecvId)
            // todo: 目标离线
            return
        }
        srv.Infof("push msg %v", data)
        srv.Send(websocket.NewMessage(data.SendId, &ws.Chat{
            ConversationId: data.ConversationId,
            ChatType:       data.ChatType,
            SendTime:       data.SendTime,
            Msg: ws.Msg{
                MType:   data.MType,
                Content: data.Content,
            },
        }), rconn)
    }
}
```

**处理流程：**
1. 客户端发送推送消息请求
2. 服务端解析消息内容
3. 查找接收方的WebSocket连接
4. 如果接收方在线，直接推送消息
5. 如果接收方离线，当前只是记录日志，不做处理

**用途：**
- 实现点对点的直接消息推送
- 适用于需要立即送达的消息
- 不经过消息队列，减少延迟

## 路由差异对比

| 特性 | user.online | conversation.chat | push |
|-----|------------|-------------------|------|
| 主要功能 | 状态管理 | 消息存储与分发 | 直接推送 |
| 消息流向 | 服务器→客户端 | 客户端→消息队列→接收方 | 客户端→接收方 |
| 离线处理 | 不适用 | 通过消息队列处理 | 当前不处理 |
| 持久化 | 不持久化 | 持久化到数据库 | 不持久化 |
| 应用场景 | 用户上线通知 | 常规聊天消息 | 实时通知 |

## 离线消息处理建议

当前系统中`push.Push`方法对于离线用户没有处理逻辑，只是打印日志。以下是几种可能的改进方案：

### 1. 存储离线消息

```go
if rconn == nil {
    // 记录离线消息到数据库
    offlineMsg := &models.OfflineMessage{
        RecipientId:    data.RecvId,
        SenderId:       data.SendId,
        ConversationId: data.ConversationId,
        ChatType:       data.ChatType,
        MType:          data.MType,
        Content:        data.Content,
        SendTime:       data.SendTime,
        Status:         "unread",
    }
    
    err := svc.OfflineMessageModel.Insert(context.Background(), offlineMsg)
    if err != nil {
        srv.Errorf("Failed to store offline message: %v", err)
    }
    return
}
```

### 2. 使用消息队列

```go
if rconn == nil {
    // 将消息发送到离线消息队列
    err := svc.OfflineMsgQueue.Push(&mq.OfflineMessage{
        RecvId:         data.RecvId,
        SendId:         data.SendId,
        ConversationId: data.ConversationId,
        ChatType:       data.ChatType,
        MType:          data.MType,
        Content:        data.Content,
        SendTime:       data.SendTime,
    })
    if err != nil {
        srv.Errorf("Failed to queue offline message: %v", err)
    }
    return
}
```

### 3. 实时推送通知

如果用户有其他设备在线或有推送通知通道：

```go
if rconn == nil {
    // 尝试发送推送通知
    err := svc.PushNotificationService.SendPush(data.RecvId, &notification.PushData{
        Title:   "新消息",
        Body:    "您有一条来自" + data.SendId + "的新消息",
        Data:    data,
        Channel: "chat",
    })
    if err != nil {
        srv.Errorf("Failed to send push notification: %v", err)
    }
    return
}
```

### 4. 完整的离线消息处理流程

理想的离线消息处理应该结合上述方法：

1. 消息持久化到数据库
2. 向消息队列发送离线消息事件
3. 尝试发送推送通知
4. 当用户上线时查询并发送未读消息
5. 实现消息已读确认机制
6. 提供消息过期清理策略

## 消息处理流程总结

1. **在线消息处理**：
   - 用户A发送消息
   - 系统查找用户B的连接
   - 如果用户B在线，直接推送消息

2. **离线消息处理**：
   - 用户A发送消息
   - 系统查找用户B的连接
   - 用户B不在线，存储消息
   - 用户B上线后，系统推送未读消息

这种设计确保了消息的可靠送达，同时保持了在线消息的实时性。