# ExampleIM WebSocket客户端

这是一个用于测试 ExampleIM WebSocket 服务的客户端应用。通过这个客户端，你可以连接到 ExampleIM 的 WebSocket 服务，并进行消息收发测试。

## 文件说明

- `index.html` - 主界面
- `style.css` - 样式文件
- `script.js` - JavaScript逻辑代码
- `token-generator.html` - JWT Token生成工具

## 使用说明

### 1. 准备工作

1. 确保 ExampleIM 的 WebSocket 服务已启动
2. 导入示例用户数据（位于 `/script/mysql/sql/sample_data.sql`）
3. 获取有效的 JWT Token（可使用 `token-generator.html` 生成测试用 Token）

### 2. 连接服务器

1. 打开 `index.html`
2. 在"连接设置"面板中填写：
   - 服务器地址：WebSocket服务地址，默认为 `ws://localhost:10090/ws`
   - 用户ID：已注册的用户ID，如测试数据中的 "10001"
   - JWT Token：用户的身份验证Token
3. 点击"连接"按钮

### 3. 发送消息

连接成功后，可以在"消息发送"面板选择消息类型并发送：

- **用户上线**：不需要额外参数，连接成功后自动发送
- **私聊消息**：需填写会话ID、聊天类型、接收者ID、消息类型和内容
- **推送消息**：类似于私聊消息，但包含发送者ID

### 4. 消息格式说明

根据服务端的路由定义（`router.go`），支持以下消息类型：

1. **用户上线消息** (`user.online`)
   ```json
   {
     "frameType": "data",
     "method": "user.online",
     "id": "1",
     "data": {
       "userId": "10001"
     }
   }
   ```

2. **会话聊天消息** (`conversation.chat`)
   ```json
   {
     "frameType": "data",
     "method": "conversation.chat",
     "id": "2",
     "data": {
       "conversationId": "conv_123",
       "chatType": 1,
       "recvId": "10002",
       "msg": {
         "mType": "text",
         "content": "你好，这是一条测试消息"
       },
       "sendTime": 1635123456789
     }
   }
   ```

3. **推送消息** (`push`)
   ```json
   {
     "frameType": "data",
     "method": "push",
     "id": "3",
     "data": {
       "conversationId": "conv_123",
       "chatType": 1,
       "recvId": "10002",
       "sendId": "10001",
       "mType": "text",
       "content": "这是一条推送消息",
       "sendTime": 1635123456789
     }
   }
   ```

## 注意事项

1. 确保填写正确的服务器地址和有效的JWT Token

2. **Token传递方式**：
   - **URL查询参数**（如`?token=xxx`）：这是WebSocket连接中最常用的认证方式，本客户端默认使用此方式。
   - **HTTP请求头**（如`Authorization: Bearer xxx`）：这是REST API的标准方式，在WebSocket中只能在初始握手时设置，且并非所有浏览器都支持自定义WebSocket头部。
   - go-zero框架的TokenParser组件支持从上述两种方式获取Token，本客户端现已兼容这两种方式。

3. 实际环境中，Token应通过用户登录API获取，而不是使用简单生成工具

4. 会话ID可以是任意字符串，但在实际应用中，会话ID应当符合业务逻辑

5. 聊天类型中，1表示单聊，2表示群聊

6. 如果连接失败，请检查：
   - 服务器是否正常运行
   - Token是否有效
   - 用户ID是否存在
   - 浏览器开发者工具中的网络面板查看是否有错误