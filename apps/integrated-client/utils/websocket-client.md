# WebSocket客户端模块说明文档

## 概述

`websocket-client.js` 模块提供了一个WebSocket客户端类，用于处理与ExampleIM后端WebSocket服务的连接、消息收发和状态管理。该模块实现了自动重连、心跳检测和消息处理等功能。

## 功能特点

- **自动重连**：在连接断开时尝试自动重新连接
- **心跳机制**：定期发送ping消息保持连接活跃
- **状态管理**：提供连接状态变化通知
- **消息处理**：支持注册多个消息处理器
- **错误处理**：完整的错误捕获和状态恢复

## 类结构

### `WebSocketClient` 类

#### 属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `url` | String | WebSocket连接URL |
| `ws` | WebSocket | WebSocket实例 |
| `connected` | Boolean | 连接状态标志 |
| `reconnectAttempts` | Number | 重连尝试次数 |
| `maxReconnectAttempts` | Number | 最大重连尝试次数 |
| `reconnectTimeout` | Number | 重连延迟时间(毫秒) |
| `pingInterval` | Number | 心跳消息间隔(毫秒) |
| `pingTimer` | Timer | 心跳定时器 |
| `reconnectTimer` | Timer | 重连定时器 |
| `messageHandlers` | Array | 消息处理器列表 |
| `stateChangeHandlers` | Array | 状态变更处理器列表 |

## 状态常量

```javascript
STATES: {
  CONNECTING: 'connecting',
  CONNECTED: 'connected', 
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
}
```

## 主要方法

### 连接管理

| 方法 | 描述 |
|------|------|
| `connect()` | 初始化WebSocket连接 |
| `disconnect()` | 主动断开连接并清理资源 |
| `reconnect()` | 尝试重新连接 |
| `startPing()` | 启动心跳机制 |
| `stopPing()` | 停止心跳机制 |
| `clearTimers()` | 清除所有定时器 |

### 消息处理

| 方法 | 描述 |
|------|------|
| `send(data)` | 发送消息到服务器 |
| `ping()` | 发送心跳消息 |
| `registerMessageHandler(handler)` | 注册消息处理函数 |
| `registerStateChangeHandler(handler)` | 注册状态变化处理函数 |
| `triggerStateChange(state, data)` | 触发状态变化事件 |

### 事件处理

| 方法 | 描述 |
|------|------|
| `_onOpen(event)` | 连接建立时的处理函数 |
| `_onMessage(event)` | 接收消息时的处理函数 |
| `_onError(error)` | 发生错误时的处理函数 |
| `_onClose(event)` | 连接关闭时的处理函数 |

## 使用示例

### 初始化与连接

```javascript
import WebSocketClient from './utils/websocket-client.js';
import api from './utils/api.js';

// 创建WebSocket客户端实例
const wsUrl = api.getWebSocketUrl();
const wsClient = new WebSocketClient(wsUrl);

// 监听状态变化
wsClient.registerStateChangeHandler((state, data) => {
  console.log(`WebSocket状态: ${state}`, data);
  
  if (state === wsClient.STATES.CONNECTED) {
    console.log('WebSocket连接已建立');
  } else if (state === wsClient.STATES.ERROR) {
    console.error('WebSocket错误:', data);
  }
});

// 注册消息处理器
wsClient.registerMessageHandler((message) => {
  console.log('收到消息:', message);
  
  // 根据消息类型处理
  switch (message.type) {
    case 'chat':
      displayChatMessage(message);
      break;
    case 'notification':
      showNotification(message);
      break;
    // 其他消息类型...
  }
});

// 建立连接
wsClient.connect();
```

### 发送消息

```javascript
// 发送文本消息
const textMessage = {
  type: 'chat',
  sessionId: 'session123',
  content: '你好!',
  timestamp: Date.now()
};

wsClient.send(textMessage);

// 发送图片消息
const imageMessage = {
  type: 'image',
  sessionId: 'session123',
  content: 'image_url.jpg',
  timestamp: Date.now()
};

wsClient.send(imageMessage);
```

### 断开连接

```javascript
// 用户登出时断开WebSocket连接
function logout() {
  wsClient.disconnect();
  api.clearToken();
  // 其他登出逻辑...
}
```

## 消息格式

客户端发送的消息格式示例:

```javascript
{
  type: 'chat',           // 消息类型
  sessionId: 'string',    // 会话ID
  content: 'string',      // 消息内容
  timestamp: 1234567890   // 时间戳
}
```

服务器发送的消息格式示例:

```javascript
{
  id: '12345',            // 消息ID
  type: 'chat',           // 消息类型
  sessionId: 'string',    // 会话ID
  senderId: 'string',     // 发送者ID
  content: 'string',      // 消息内容
  timestamp: 1234567890   // 时间戳
}
```

## 注意事项

1. WebSocket URL应当包含有效的认证信息，推荐使用`api.getWebSocketUrl()`获取
2. 建议在应用初始化时建立WebSocket连接，页面关闭前断开连接
3. 消息处理器应当注意消息类型，避免处理不相关的消息
4. 自动重连最多尝试5次，每次间隔递增
5. 心跳消息每30秒发送一次，保持连接活跃
6. 在网络环境变化时可能需要手动重连