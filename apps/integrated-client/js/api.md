# API客户端模块说明文档

## 模块概述

`api.js` 是ExampleIM应用的核心通信组件，负责封装与后端服务器的所有HTTP API交互，提供一致的接口调用方式，以及管理用户认证状态。该模块采用单例模式设计，确保整个应用中只有一个API客户端实例。

## 主要功能

1. **HTTP请求封装**
   - 统一请求格式和错误处理
   - 自动添加认证头信息
   - 支持GET、POST、PUT、DELETE等方法

2. **用户认证管理**
   - JWT令牌的存储和管理
   - 登录状态的维护
   - 令牌持久化（浏览器本地存储）

3. **应用功能API**
   - 用户管理：登录、注册、用户信息
   - 社交功能：好友管理、群组操作
   - 消息功能：会话列表、历史消息获取

4. **WebSocket支持**
   - 提供WebSocket连接URL构建
   - JWT令牌通过URL路径部分传递

## 类结构

### ApiClient 类

#### 属性

| 属性名 | 类型 | 说明 |
|--------|------|------|
| baseUrl | String | API服务器基础URL |
| token | String | 用户JWT认证令牌 |

#### 方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| setToken(token) | token: String | void | 设置认证令牌并保存到本地存储 |
| clearToken() | 无 | void | 清除认证令牌 |
| getToken() | 无 | String | 获取当前认证令牌 |
| isLoggedIn() | 无 | Boolean | 判断用户是否已登录 |
| getHeaders() | 无 | Object | 创建包含认证信息的请求头 |
| request(method, endpoint, data) | method: String, endpoint: String, data: Object | Promise | 发送HTTP请求的核心方法 |
| get(endpoint) | endpoint: String | Promise | 发送GET请求 |
| post(endpoint, data) | endpoint: String, data: Object | Promise | 发送POST请求 |
| put(endpoint, data) | endpoint: String, data: Object | Promise | 发送PUT请求 |
| delete(endpoint) | endpoint: String | Promise | 发送DELETE请求 |

#### 业务方法

| 分类 | 方法名 | 说明 |
|------|--------|------|
| **用户API** | login(username, password) | 用户登录 |
|  | register(username, password, nickname) | 用户注册 |
|  | getUserInfo() | 获取当前用户信息 |
|  | updateUserInfo(userData) | 更新用户信息 |
| **社交API** | getFriendsList() | 获取好友列表 |
|  | sendFriendRequest(username, message) | 发送好友请求 |
|  | getFriendRequests() | 获取收到的好友请求 |
|  | acceptFriendRequest(requestId) | 接受好友请求 |
|  | rejectFriendRequest(requestId) | 拒绝好友请求 |
|  | createGroup(name, description, members) | 创建群组 |
|  | getGroups() | 获取群组列表 |
|  | getGroupInfo(groupId) | 获取群组详情 |
|  | addGroupMember(groupId, userId) | 添加群组成员 |
|  | removeGroupMember(groupId, userId) | 移除群组成员 |
| **消息API** | getSessions() | 获取会话列表 |
|  | getSessionMessages(sessionId, limit, before) | 获取会话消息历史 |
|  | getWebSocketUrl() | 获取WebSocket连接URL |

## 使用示例

```javascript
// 导入API客户端
import api from './api.js';

// 用户登录
async function loginUser() {
  try {
    const response = await api.login('username', 'password');
    console.log('登录成功:', response);
    // 令牌已在api客户端内部保存
  } catch (error) {
    console.error('登录失败:', error.message);
  }
}

// 获取会话列表
async function fetchSessions() {
  try {
    // 检查是否已登录
    if (!api.isLoggedIn()) {
      console.error('用户未登录');
      return;
    }
    
    const sessions = await api.getSessions();
    console.log('会话列表:', sessions);
  } catch (error) {
    console.error('获取会话失败:', error.message);
  }
}

// 建立WebSocket连接
function connectWebSocket() {
  const wsUrl = api.getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  // 配置WebSocket事件处理...
}
```

## 安全考虑

1. **令牌存储**：使用浏览器的localStorage存储JWT令牌，注意该存储在跨站脚本攻击(XSS)时可能被窃取

2. **令牌传输**：
   - HTTP请求中通过Authorization头部传输令牌
   - WebSocket连接使用URL路径部分传递令牌，而非查询参数，提高安全性

3. **错误处理**：所有API错误都包含详细信息，但在生产环境中应避免将后端错误细节直接展示给用户

## 依赖关系

模块不依赖其他内部模块，使用浏览器原生的fetch API和localStorage API完成功能。