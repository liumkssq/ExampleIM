# ExampleIM 高级客户端

这是一个基于 ExampleIM 的高级聊天客户端，集成了 IM API 和 WebSocket 功能，提供完整的聊天体验。

## 功能特点

1. **用户认证**：使用 JWT Token 进行用户认证和鉴权
2. **会话管理**：支持获取、创建和管理聊天会话
3. **实时消息**：通过 WebSocket 实现消息的实时收发
4. **聊天记录**：支持查看历史聊天记录
5. **UI 界面**：提供完整的聊天界面，包括会话列表、消息列表等

## 文件结构

- `index.html` - 主界面
- `style.css` - 样式文件
- `app.js` - 应用逻辑代码
- `../utils/api.js` - IM API 客户端工具
- `../utils/websocket-client.js` - WebSocket 客户端工具

## 使用方法

### 1. 准备工作

- 确保 ExampleIM 的 API 服务和 WebSocket 服务已正常运行
- 获取有效的 JWT Token（可使用之前创建的用户中心客户端登录获取）

### 2. 登录

1. 打开 `index.html` 文件
2. 在认证表单中填入你的 JWT Token
3. 点击"登录"按钮

### 3. 使用聊天功能

登录成功后，你可以：

- 在左侧会话列表中查看现有会话或创建新会话
- 点击会话进入聊天界面
- 在底部输入框中输入消息并发送
- 查看聊天记录和消息状态

## API 集成

本客户端集成了以下 IM API 接口：

1. **获取聊天记录**：
   ```
   GET /v1/im/chatlog
   ```

2. **建立会话**：
   ```
   POST /v1/im/setup/conversation
   ```

3. **获取会话列表**：
   ```
   GET /v1/im/conversation
   ```

4. **更新会话**：
   ```
   PUT /v1/im/conversation
   ```

## WebSocket 集成

本客户端实现了与 ExampleIM WebSocket 服务的集成，支持以下消息类型：

1. **用户上线**：`user.online`
2. **聊天消息**：`conversation.chat`
3. **推送消息**：`push`

## 配置选项

在客户端界面中，你可以配置：

- **API 服务地址**：默认为 `http://localhost:8888`
- **WebSocket 地址**：默认为 `ws://localhost:10090/ws`

## 安全注意事项

1. JWT Token 具有高度敏感性，请勿在不安全的环境中使用
2. 生产环境应使用 HTTPS 和 WSS 协议增强安全性
3. 本客户端将 Token 保存在 localStorage 中，如需提高安全性可改为使用 sessionStorage

## 适配说明

本客户端基于以下 ExampleIM 文件进行适配：

1. IM API (`im.api`): 聊天记录、会话管理等 API 接口
2. IM RPC (`im.proto`): 消息和会话数据结构定义
3. WebSocket 服务 (`message.go`, `server.go`): WebSocket 消息规范和处理逻辑

## 当前支持的 Token

客户端默认填充了以下 Token 用于测试：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTMwMjY5NjQsImlhdCI6MTc0NDM4Njk2NCwiaW1vb2MuY29tIjoiMHgwMDAwMDAyMDAwMDAwMDAxIn0.3sUfN8txxjDIc3iq7Tv_6D7m6-LCVuZb6cB2FB0bGt4
```

该 Token 对应的用户 ID 为 `0x00000020000000001`。