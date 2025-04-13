# api-client.js 文件说明

## 文件概述

`api-client.js` 是ExampleIM客户端的核心API工具，将用户认证和即时通讯功能整合到一个统一的客户端中。这个文件实现了`UnifiedApiClient`类，提供了完整的API访问能力，包括用户认证、会话管理和消息交互等功能。

## 主要结构

### DEFAULT_CONFIG 常量

```javascript
const DEFAULT_CONFIG = {
    API_BASE_URL: 'http://localhost:8888',
    WS_URL: 'ws://localhost:10090/ws',
    CHAT_TYPE: { SINGLE: 1, GROUP: 2 },
    MSG_TYPE: { TEXT: 1, IMAGE: 2, VIDEO: 3, FILE: 4 },
    ENDPOINTS: {
        LOGIN: '/v1/user/login',
        REGISTER: '/v1/user/register',
        USER_INFO: '/v1/user/user',
        // ... 更多端点
    }
};
```

定义了API配置的默认值，包括服务器地址、消息类型和API端点等。

### UnifiedApiClient 类

这是文件的核心类，提供了完整的API客户端功能。

## 主要功能

### 用户认证

```javascript
async login(mobile, password) {
    // 实现用户登录
}

async loginWithToken(token) {
    // 使用已有令牌登录
}

async register(mobile, password, nickname, sex, avatar) {
    // 用户注册
}
```

提供了多种用户认证方式，支持密码登录和令牌登录。

### 用户信息管理

```javascript
async fetchUserInfo() {
    // 获取用户信息
}

getUserInfo() {
    // 返回已缓存的用户信息
}
```

处理用户信息的获取和缓存。

### 会话和消息管理

```javascript
async getChatLog(conversationId, options) {
    // 获取聊天记录
}

async setupConversation(recvId, chatType) {
    // 建立新会话
}

async getConversations() {
    // 获取会话列表
}
```

提供了会话创建、获取和聊天记录查询等功能。

### WebSocket集成

```javascript
createWebSocketClient() {
    // 创建WebSocket客户端
}

getWebSocketClient() {
    // 获取当前WebSocket客户端
}
```

与WebSocket客户端集成，提供实时消息通信能力。

## 工具方法

```javascript
static parseUserId(token) {
    // 从JWT令牌中解析用户ID
}

async request(endpoint, method, data, needAuth) {
    // 执行HTTP请求
}
```

提供了令牌解析和HTTP请求等工具方法。

## 使用方式

```javascript
// 创建客户端实例
const client = new UnifiedApiClient({
    API_BASE_URL: 'http://localhost:8888',
    WS_URL: 'ws://localhost:10090/ws'
});

// 用户登录
await client.loginWithToken(jwtToken);

// 获取WebSocket客户端
const wsClient = client.createWebSocketClient();
await wsClient.connect();

// 获取会话列表
const conversations = await client.getConversations();
```

## 特点和优势

1. **统一API访问**：将用户API和IM API整合到一个客户端
2. **完整认证流程**：支持多种认证方式，处理令牌管理
3. **WebSocket集成**：无缝整合WebSocket实时通信
4. **灵活配置**：支持自定义服务器地址和端点
5. **类型安全**：定义了清晰的消息类型和聊天类型常量

## 注意事项

1. 在使用WebSocket功能前必须先完成认证
2. 令牌过期需要重新登录刷新
3. 销毁客户端时应调用destroy方法释放资源