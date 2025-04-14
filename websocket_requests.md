# ExampleIM WebSocket通信指南

## 连接与认证

### 连接URL
```
ws://127.0.0.1:10090/ws?token=你的JWT令牌
```

### JWT令牌格式
```json
{
  "exp": 1753152030,     // 过期时间
  "iat": 1744512030,     // 签发时间
  "imooc.com": "0x0000003000000001"  // 用户ID
}
```

### 注意事项
- JWT令牌必须使用`imooc.com`作为用户ID的键名
- 签名密钥需与服务端配置一致（`imooc.com`）

## 消息格式

所有WebSocket请求需遵循以下JSON格式：

```json
{
  "frameType": 0,     // 消息类型：0=数据帧, 1=心跳, 2=确认帧, 3=无需确认帧, 9=错误帧
  "id": "消息ID",     // 客户端生成的唯一消息ID
  "method": "路由名称", // 请求的方法名
  "data": {           // 请求的具体数据
    // 根据不同method有不同的结构
  }
}
```

## 支持的路由

### 1. user.online - 用户上线

**请求格式：**
```json
{
  "frameType": 0,
  "id": "1",
  "method": "user.online",
  "data": {
    "userId": "0x0000003000000001"  // 用户ID
  }
}
```

**响应：**
服务器会返回该用户所在的用户ID列表。

### 2. conversation.chat - 发送聊天消息

**请求格式：**
```json
{
  "frameType": 0,
  "id": "2",
  "method": "conversation.chat",
  "data": {
    "conversationId": "0x0000003000000001_0x0000003000000002",   // 会话ID格式为小ID_大ID
    "chatType": 2,               // 聊天类型：2=单聊，1=群聊（使用整数常量）
    "recvId": "0x0000003000000002",        // 接收消息的用户ID
    "msg": {
      "mType": 0,                // 消息类型：0=文本（使用整数常量）
      "content": "消息内容"      // 具体消息内容
    },
    "sendTime": 1626342523123    // 发送时间戳（毫秒）
  }
}
```

**处理流程：**
系统会将消息转发到消息队列，然后由消息队列分发给接收者。

### 3. push - 推送消息

**请求格式：**
```json
{
  "frameType": 0,
  "id": "3",
  "method": "push",
  "data": {
    "conversationId": "0x0000003000000001_0x0000003000000002",  // 会话ID格式为小ID_大ID
    "chatType": 2,               // 聊天类型：2=单聊，1=群聊（使用整数常量）
    "sendId": "0x0000003000000001",        // 发送消息的用户ID
    "recvId": "0x0000003000000002",        // 接收消息的用户ID
    "mType": 0,                  // 消息类型：0=文本（使用整数常量）
    "content": "消息内容",       // 具体消息内容
    "sendTime": 1626342523123    // 发送时间戳（毫秒）
  }
}
```

**处理流程：**
系统会直接将消息推送给在线的接收者，如果接收者不在线则不处理（服务端TODO：处理离线消息）。

## 消息确认机制

服务器配置了严格的消息确认机制（RigorAck），意味着客户端需要对接收到的消息进行确认。具体确认机制可参考WebSocket连接的初始化配置。

## 客户端示例代码

```javascript
// 连接WebSocket
const socket = new WebSocket(`ws://127.0.0.1:10090/ws?token=${token}`);

// 发送用户上线消息
function sendOnlineMessage() {
  const message = {
    frameType: 0,
    id: generateMessageId(),
    method: "user.online",
    data: {
      userId: "0x0000003000000001"
    }
  };
  socket.send(JSON.stringify(message));
}

// 发送聊天消息
function sendChatMessage(conversationId, receiverId, content) {
  const message = {
    frameType: 0,
    id: generateMessageId(),
    method: "conversation.chat",
    data: {
      conversationId: conversationId,
      chatType: 2,  // 2=单聊
      recvId: receiverId,
      msg: {
        mType: 0,  // 0=文本消息
        content: content
      },
      sendTime: Date.now()
    }
  };
  socket.send(JSON.stringify(message));
}
```

## 错误处理

当请求出错时，服务器会返回一个`frameType`为`9`的错误帧，`data`字段包含错误信息：

```json
{
  "frameType": 9,
  "data": "错误信息"
}
```

## Apifox调试指南

### 1. 创建WebSocket连接

1. 在Apifox中创建新的WebSocket接口
2. 设置WebSocket连接URL：
   ```
   ws://127.0.0.1:10090/ws?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTMxNTIwMzAsImlhdCI6MTc0NDUxMjAzMCwiaW1vb2MuY29tIjoiMHgwMDAwMDAzMDAwMDAwMDAxIn0.您的JWT签名
   ```

3. 选择"跳过TLS验证"（如果需要）

### 2. 认证方式选择

JWT认证有两种方式，选择**其中一种**即可：

1. **URL参数方式**（推荐）：
   ```
   ws://127.0.0.1:10090/ws?token=你的JWT令牌
   ```

2. **Header方式**：设置Headers：
   ```
   Authorization: Bearer 你的JWT令牌
   ```

另外，WebSocket连接还需要标准头部：
```
Sec-WebSocket-Version: 13
Connection: Upgrade
Upgrade: websocket
```

### 3. 调试 user.online 消息

**消息数据：**
```json
{
  "frameType": 0,
  "id": "1",
  "method": "user.online",
  "data": {
    "userId": "0x0000003000000001"
  }
}
```

**预期响应：**
```json
{
  "frameType": 0,
  "formId": "0x0000003000000001",
  "data": ["0x0000003000000001", "0x0000003000000002", "...其他在线用户ID"]
}
```

### 4. 调试 conversation.chat 消息

**消息数据：**
```json
{
  "frameType": 0,
  "id": "2",
  "method": "conversation.chat",
  "data": {
    "conversationId": "0x0000003000000001_0x0000003000000002",
    "chatType": 2,               // 2=单聊
    "recvId": "0x0000003000000002",
    "msg": {
      "mType": 0,                // 0=文本
      "content": "Hello, this is a test message"
    },
    "sendTime": 1626342523123
  }
}
```

**注意事项：**
- conversationId必须符合格式：`小ID_大ID`（如果没有指定，服务器会自动生成）
- 发送者ID由当前连接的用户ID确定（JWT中的用户ID）
- 接收者ID必须是存在的用户ID
- mType和chatType必须使用正确的整数常量值

### 5. 调试 push 消息

**消息数据：**
```json
{
  "frameType": 0,
  "id": "3",
  "method": "push",
  "data": {
    "conversationId": "0x0000003000000001_0x0000003000000002",
    "chatType": 2,               // 2=单聊
    "sendId": "0x0000003000000001",
    "recvId": "0x0000003000000002",
    "mType": 0,                  // 0=文本
    "content": "This is a push message test",
    "sendTime": 1626342523123
  }
}
```

**注意事项：**
- sendId应该与当前连接的用户ID一致
- recvId必须是在线的用户ID，否则消息发送不成功
- mType和chatType必须使用正确的整数常量值

### 6. 消息类型常量

**消息类型(mType)的整数值含义：**
```
0: 文本消息 (TextMType)
```

**聊天类型(chatType)的整数值含义：**
```
1: 群聊 (GroupChatType)
2: 单聊 (SingleChatType)
```

请使用正确的整数常量，不要使用字符串。

### 7. 可用用户ID列表

系统中存在的用户ID包括：
```
0x0000002000000001
0x0000002000000002
0x0000003000000001
0x0000003000000002
0x0000003000000003
0x0000003000000004
0x0000003000000005
0x0000003000000006
```

请确保使用这些ID进行测试。

### 8. 响应解析

Apifox接收到的WebSocket响应可能包含以下几种类型：

1. **成功响应**：返回数据帧（frameType为0）
2. **错误响应**：返回错误帧（frameType为9）
3. **心跳帧**：用于保持连接（frameType为1）

### 9. 认证错误处理

如果响应中包含 `"data": "不具备访问权限"`，请检查：
- JWT Token是否正确
- Token是否包含正确的用户ID格式（`"imooc.com": "0x0000003000000001"`）
- Token是否已过期

### 10. 完整调试流程

1. 先获取JWT Token（使用Apifox的HTTP接口测试登录API）
2. 使用Token建立WebSocket连接
3. 发送user.online消息
4. 根据用户ID列表，发送conversation.chat消息或push消息
5. 观察响应并进行下一步测试