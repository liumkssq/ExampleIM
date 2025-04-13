# API服务模块说明文档

## 概述

`api.js` 模块提供了一个封装完整的API服务类，用于处理与ExampleIM后端各个服务的HTTP通信。该模块实现了用户认证、社交关系管理以及即时通讯功能的API调用。

## 功能特点

- **多服务集成**：统一管理用户服务、社交服务和消息服务的API调用
- **认证管理**：自动处理JWT令牌的存储、使用和刷新
- **请求封装**：标准化的错误处理和响应解析
- **本地存储**：保存认证状态，支持会话恢复
- **WebSocket支持**：提供获取WebSocket连接URL的方法

## 类结构

### `ApiService` 类

#### 属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `config` | Object | 包含基础URL、端口配置和认证令牌 |
| `endpoints` | Object | 包含所有API端点的路径配置 |

#### 配置项

```javascript
{
  baseUrl: 'http://localhost',  // API服务基础URL
  userPort: 8000,               // 用户服务端口
  socialPort: 8010,             // 社交服务端口
  imPort: 8020,                 // 消息服务端口
  wsPort: 8030,                 // WebSocket服务端口
  token: null                   // JWT认证令牌
}
```

## 主要方法

### 配置与认证管理

| 方法 | 描述 |
|------|------|
| `updateConfig(config)` | 更新API服务配置 |
| `setToken(token)` | 设置并存储认证令牌 |
| `clearToken()` | 清除认证令牌 |
| `loadToken()` | 从本地存储加载认证令牌 |
| `isLoggedIn()` | 检查用户是否已登录 |

### 内部工具方法

| 方法 | 描述 |
|------|------|
| `_buildUrl(service, endpoint)` | 根据服务类型和端点构建完整URL |
| `_request(method, service, endpoint, data, useToken)` | 发送HTTP请求的通用方法 |

### 用户API

| 方法 | 描述 |
|------|------|
| `login(username, password)` | 用户登录，成功后自动存储令牌 |
| `register(username, password, nickname)` | 用户注册 |
| `getUserInfo(userId)` | 获取用户信息，不提供userId则获取当前用户 |
| `updateUserInfo(userInfo)` | 更新用户信息 |

### 社交API

| 方法 | 描述 |
|------|------|
| `getFriendList()` | 获取好友列表 |
| `addFriend(userId)` | 添加好友 |
| `acceptFriendRequest(requestId)` | 接受好友请求 |
| `rejectFriendRequest(requestId)` | 拒绝好友请求 |
| `deleteFriend(userId)` | 删除好友 |
| `getGroupList()` | 获取群组列表 |
| `createGroup(name, description)` | 创建群组 |
| `joinGroup(groupId)` | 加入群组 |
| `leaveGroup(groupId)` | 离开群组 |
| `getGroupMembers(groupId)` | 获取群组成员 |

### 消息API

| 方法 | 描述 |
|------|------|
| `getSessions()` | 获取会话列表 |
| `getMessages(sessionId, lastMessageId, limit)` | 获取会话消息，支持分页 |
| `sendMessage(sessionId, content, type)` | 发送消息 |
| `getWebSocketUrl()` | 获取WebSocket连接URL，包含认证信息 |

## 使用示例

### 初始化

```javascript
import api from './utils/api.js';

// 可选：更新配置
api.updateConfig({
  baseUrl: 'http://example-server.com'
});

// 加载保存的认证状态
api.loadToken();
```

### 用户认证

```javascript
// 登录
try {
  const userData = await api.login('username', 'password');
  console.log('登录成功', userData);
} catch (error) {
  console.error('登录失败', error);
}

// 检查登录状态
if (api.isLoggedIn()) {
  console.log('用户已登录');
}
```

### 获取数据

```javascript
// 获取会话列表
try {
  const sessions = await api.getSessions();
  console.log('会话列表', sessions);
} catch (error) {
  console.error('获取会话失败', error);
}

// 获取会话消息
try {
  const messages = await api.getMessages(sessionId, null, 20);
  console.log('消息列表', messages);
} catch (error) {
  console.error('获取消息失败', error);
}
```

### WebSocket连接

```javascript
import WebSocketClient from './utils/websocket-client.js';

// 获取WebSocket URL并创建连接
const wsUrl = api.getWebSocketUrl();
const wsClient = new WebSocketClient(wsUrl);
wsClient.connect();
```

## 注意事项

1. 在使用API前确保已调用`loadToken()`恢复会话状态
2. 所有API调用都返回Promise，应使用`async/await`或Promise链处理
3. 错误处理应当捕获并妥善处理异常情况
4. `getWebSocketUrl()`方法自动处理认证令牌的附加，无需手动添加