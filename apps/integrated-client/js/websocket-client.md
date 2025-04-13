# WebSocket客户端模块说明文档

## 模块概述

`websocket-client.js` 是ExampleIM应用的WebSocket通信核心组件，负责与后端服务器建立实时通信连接，处理消息的发送和接收，以及连接状态管理。该模块采用单例模式设计，确保整个应用中只有一个WebSocket连接实例。

## 主要功能

1. **WebSocket连接管理**
   - 建立与服务器的WebSocket连接
   - 自动重连机制（最多尝试5次）
   - 连接状态监控和错误处理

2. **消息收发**
   - 支持JSON格式消息的发送
   - 提供便捷的文本消息发送方法
   - 消息接收和解析

3. **事件系统**
   - 事件监听注册和移除
   - 支持的事件类型：
     - `connect`: 连接建立时触发
     - `disconnect`: 连接断开时触发
     - `message`: 收到消息时触发
     - `error`: 发生错误时触发

## 类结构

### WebSocketClient 类

#### 属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| socket | WebSocket | WebSocket连接实例 |
| reconnectAttempts | Number | 当前重连尝试次数 |
| maxReconnectAttempts | Number | 最大重连尝试次数 |
| reconnectTimeout | Number | 重连等待时间（毫秒） |
| listeners | Object | 事件监听器集合 |
| isConnecting | Boolean | 是否正在连接中 |
| shouldReconnect | Boolean | 是否应该尝试重连 |

#### 方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| connect() | 无 | 无 | 建立WebSocket连接 |
| disconnect(suppressEvents) | suppressEvents: Boolean | 无 | 断开WebSocket连接 |
| send(messageData) | messageData: Object/String | Boolean | 发送消息到服务器 |
| sendTextMessage(targetId, content, isGroup) | targetId: String, content: String, isGroup: Boolean | Boolean | 发送文本消息 |
| on(event, callback) | event: String, callback: Function | this | 注册事件监听 |
| off(event, callback) | event: String, callback: Function | this | 移除事件监听 |
| isConnected() | 无 | Boolean | 检查连接状态 |

#### 私有方法

| 方法名 | 说明 |
|--------|------|
| _handleOpen(event) | 处理连接打开事件 |
| _handleMessage(event) | 处理接收消息事件 |
| _handleClose(event) | 处理连接关闭事件 |
| _handleError(event) | 处理错误事件 |
| _triggerEvent(eventName, data) | 触发指定事件 |

## 使用示例

```javascript
// 导入WebSocket客户端
import wsClient from './websocket-client.js';

// 注册事件监听
wsClient.on('connect', () => {
  console.log('已连接到聊天服务器');
});

wsClient.on('message', (message) => {
  console.log('收到新消息:', message);
  // 处理接收到的消息
});

wsClient.on('disconnect', (event) => {
  console.log('连接已断开:', event.reason);
});

wsClient.on('error', (error) => {
  console.error('WebSocket错误:', error);
});

// 建立连接
wsClient.connect();

// 发送消息
wsClient.sendTextMessage('user123', '你好！', false); // 发送给用户
wsClient.sendTextMessage('group456', '大家好！', true); // 发送给群组

// 断开连接
wsClient.disconnect();
```

## 依赖关系

模块依赖于 `api.js` 中的API客户端以获取WebSocket服务器URL和用户认证信息。采用ES模块系统进行导入导出。

## 错误处理

模块内部实现了完整的错误处理机制，包括：
1. 连接错误自动重试
2. 消息解析错误处理
3. 事件回调执行错误捕获
4. 未连接状态下的发送操作验证

## 安全考虑

1. 使用API客户端提供的带认证信息的WebSocket URL
2. 在连接前验证用户登录状态
3. 对发送的消息内容进行序列化处理