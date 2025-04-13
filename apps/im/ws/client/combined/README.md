# ExampleIM 统一客户端

这是一个基于Web的即时通讯客户端，整合了用户认证、API通信和WebSocket实时消息功能。该客户端与ExampleIM后端服务无缝集成，提供了完整的聊天体验。

## 功能特点

- **统一认证**：支持密码登录和JWT Token登录两种方式
- **实时通讯**：基于WebSocket的实时消息收发
- **会话管理**：支持创建、查看和管理多个会话
- **消息历史**：查看和搜索聊天历史记录
- **用户信息**：显示和管理用户资料
- **现代界面**：响应式设计，美观易用

## 技术架构

客户端采用纯前端技术栈，包括：

- **HTML5/CSS3**：构建用户界面
- **JavaScript (ES6+)**：实现业务逻辑
- **WebSocket API**：实现实时通信
- **Fetch API**：与REST API交互
- **LocalStorage**：本地状态存储

## 文件结构

- `index.html`：应用主页面
- `unified-client.js`：统一客户端核心库
- `app.js`：应用主逻辑

## 快速开始

1. 确保ExampleIM后端服务已经启动
   - API服务默认运行在 `http://localhost:8888`
   - WebSocket服务默认运行在 `ws://localhost:10090/ws`

2. 打开 `index.html` 文件

3. 使用以下方式登录：
   - 使用手机号和密码登录
   - 或使用有效的JWT Token登录

4. 开始聊天！

## API接口

客户端支持以下API接口：

- **认证接口**：
  - `/v1/user/login`：用户登录
  - `/v1/user/register`：用户注册
  - `/v1/user/user`：获取用户信息

- **消息接口**：
  - `/v1/im/chatlog`：获取聊天历史记录
  - `/v1/im/setup/conversation`：创建会话
  - `/v1/im/conversation`：获取/更新会话列表

## WebSocket消息格式

客户端与服务器通过以下格式的JSON消息通信：

```javascript
{
  "frameType": 0,  // 0=数据, 1=心跳, 2=确认, 3=无需确认, 9=错误
  "id": "123",     // 消息ID
  "method": "conversation.chat",  // 消息方法
  "data": {        // 消息数据
    // 根据方法不同，数据结构不同
  }
}
```

## 自定义配置

客户端提供了以下配置选项：

- **API服务地址**：设置REST API服务的URL
- **WebSocket服务地址**：设置WebSocket服务的URL

## 代码示例

### 初始化客户端

```javascript
const client = new UnifiedClient({
  API: {
    BASE_URL: 'http://localhost:8888'
  },
  WS: {
    URL: 'ws://localhost:10090/ws'
  }
});
```

### 登录

```javascript
// 使用密码登录
const result = await client.login('13800138000', 'password123');

// 或使用Token登录
const result = await client.loginWithToken('your.jwt.token');
```

### 发送消息

```javascript
client.sendChatMessage(
  'conversation_id',  // 会话ID
  'target_user_id',   // 接收者ID
  1,                  // 聊天类型：1=单聊，2=群聊
  '你好，世界！'       // 消息内容
);
```

### 接收消息

```javascript
client.on('conversation.chat', function(message) {
  console.log('收到新消息:', message);
});
```

## 错误处理

客户端实现了完善的错误处理机制：

- API请求错误：通过Promise的catch捕获
- WebSocket连接错误：通过error事件监听
- 自动重连：WebSocket断开时自动尝试重连

## 限制和注意事项

- 客户端依赖浏览器的WebSocket和Fetch API，不支持旧版浏览器
- WebSocket连接可能受到网络环境和防火墙的影响
- JWT Token应妥善保管，避免泄露