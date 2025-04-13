# websocket-client.js 文件说明

## 文件概述

`websocket-client.js` 文件实现了ExampleIM的WebSocket客户端，负责与服务器建立WebSocket连接、处理消息的收发以及连接状态管理。该文件基于服务端的WebSocket实现，提供了完整的即时通讯客户端功能。

## 主要结构和组件

### FrameType 常量

```javascript
const FrameType = {
    DATA: 0,     // 数据帧
    PING: 1,     // 心跳Ping
    ACK: 2,      // 确认帧
    NO_ACK: 3,   // 无需确认帧
    ERROR: 9     // 错误帧
};
```

定义了WebSocket消息的类型常量，与服务端保持一致。

### ImWebSocketClient 类

WebSocket客户端的主要实现类，提供了连接管理、消息收发、事件处理等功能。

## 主要功能

### 连接管理

```javascript
connect(useHeader = true) {
    // WebSocket连接建立逻辑
    // ...
}
```

负责建立WebSocket连接，支持两种认证方式：
1. URL参数方式：通过URL查询参数传递Token
2. 自动重连功能：当连接断开时，会自动尝试重新连接

### 消息收发

```javascript
sendMessage(method, data) {
    // 发送消息的通用方法
    // ...
}

sendChatMessage(conversationId, recvId, chatType, content, msgType = 'text') {
    // 发送聊天消息的便捷方法
    // ...
}

sendPushMessage(conversationId, recvId, chatType, content, msgType = 'text') {
    // 发送推送消息的便捷方法
    // ...
}
```

提供了多种消息发送方法，支持不同类型的应用消息。

### 事件处理

```javascript
on(event, handler) {
    // 添加事件处理函数
    // ...
}

off(event, handler) {
    // 移除事件处理函数
    // ...
}
```

提供了事件订阅机制，支持的事件包括：
- `user.online`：用户上线
- `conversation.chat`：会话消息
- `push`：推送消息
- `error`：错误消息
- `connect`：连接成功
- `disconnect`：连接断开

### 内部消息处理

```javascript
_handleMessage(message) {
    // 根据frameType处理不同类型的消息
    // ...
}
```

处理接收到的WebSocket消息，根据消息类型进行相应处理。

## 使用方式

```javascript
// 创建WebSocket客户端实例
const client = new ImWebSocketClient('ws://localhost:10090/ws', 'jwt_token', 'user_123');

// 添加事件监听
client.on('conversation.chat', (data) => {
    console.log('收到聊天消息', data);
});

// 连接到服务器
client.connect().then(() => {
    // 发送消息
    client.sendChatMessage('conv_1', 'user_456', 1, '你好！');
});
```

## 注意事项

1. WebSocket连接不支持在请求头中添加自定义字段，因此Token认证通过URL参数传递
2. 客户端会自动处理心跳和重连逻辑，确保长连接稳定性
3. 消息ID自动递增，保证每条消息的唯一性