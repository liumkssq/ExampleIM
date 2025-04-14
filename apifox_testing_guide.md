# ExampleIM 完整API测试指南

本文档提供了使用Apifox测试ExampleIM系统的HTTP API和WebSocket连接的详细说明。通过这些接口，可以完成用户注册、登录、会话管理和消息收发等核心功能。

## 服务器配置

### HTTP API服务
```yaml
Name: im
Host: 0.0.0.0
Port: 8882
JwtAuth:
  AccessSecret: imooc.com
```

### WebSocket服务
```yaml
Name: im.ws
ListenOn: 0.0.0.0:10090
JwtAuth:
  AccessSecret: imooc.com
```

## 认证机制

所有API请求和WebSocket连接都需要JWT认证：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTMxNTIwMzAsImlhdCI6MTc0NDUxMjAzMCwiaW1vb2MuY29tIjoiMHgwMDAwMDAzMDAwMDAwMDAxIn0.签名部分
```

JWT负载格式：
```json
{
  "exp": 1753152030,     // 过期时间
  "iat": 1744512030,     // 签发时间
  "imooc.com": "0x0000003000000001"  // 用户ID
}
```

## HTTP API测试

### 1. 建立会话 (Setup Conversation)

**请求信息：**
- **URL**: `http://127.0.0.1:8882/v1/im/setup/conversation`
- **方法**: POST
- **认证**: JWT Bearer Token

**请求体：**
```json
{
  "sendId": "0x0000003000000001",
  "recvId": "0x0000003000000002",
  "ChatType": 2
}
```

**参数说明：**
- `sendId`: 发送者用户ID
- `recvId`: 接收者用户ID
- `ChatType`: 聊天类型，2=单聊，1=群聊

**响应示例：**
```json
{}
```

### 2. 获取会话列表 (Get Conversations)

**请求信息：**
- **URL**: `http://127.0.0.1:8882/v1/im/conversation`
- **方法**: GET
- **认证**: JWT Bearer Token

**响应示例：**
```json
{
  "userId": "0x0000003000000001",
  "conversationList": {
    "0x0000003000000001_0x0000003000000002": {
      "conversationId": "0x0000003000000001_0x0000003000000002",
      "ChatType": 2,
      "targetId": "0x0000003000000002",
      "isShow": true,
      "seq": 1,
      "read": 0,
      "total": 10,
      "unread": 5
    }
  }
}
```

### 3. 更新会话 (Update Conversations)

**请求信息：**
- **URL**: `http://127.0.0.1:8882/v1/im/conversation`
- **方法**: PUT
- **认证**: JWT Bearer Token

**请求体：**
```json
{
  "conversationList": {
    "0x0000003000000001_0x0000003000000002": {
      "conversationId": "0x0000003000000001_0x0000003000000002",
      "ChatType": 2,
      "targetId": "0x0000003000000002",
      "isShow": true,
      "read": 10
    }
  }
}
```

**响应示例：**
```json
{}
```

### 4. 获取聊天记录 (Get Chat Log)

**请求信息：**
- **URL**: `http://127.0.0.1:8882/v1/im/chatlog`
- **方法**: GET
- **认证**: JWT Bearer Token

**查询参数：**
- `conversationId`: 必填，会话ID，格式为 `小ID_大ID`
- `startSendTime`: 可选，开始时间戳
- `endSendTime`: 可选，结束时间戳
- `count`: 可选，返回消息数量

**请求示例：**
```
GET /v1/im/chatlog?conversationId=0x0000003000000001_0x0000003000000002&count=20
```

**响应示例：**
```json
{
  "list": [
    {
      "id": "message1",
      "conversationId": "0x0000003000000001_0x0000003000000002",
      "sendId": "0x0000003000000001",
      "recvId": "0x0000003000000002",
      "msgType": 0,
      "msgContent": "Hello, this is a test message",
      "chatType": 2,
      "SendTime": 1626342523123
    }
  ]
}
```

## WebSocket测试

### 1. 建立WebSocket连接

**请求信息：**
- **URL**: `ws://127.0.0.1:10090/ws?token=你的JWT令牌`
- **Header**:
  ```
  Sec-WebSocket-Version: 13
  Connection: Upgrade
  Upgrade: websocket
  ```

### 2. 用户上线消息 (user.online)

**发送消息：**
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

### 3. 聊天消息 (conversation.chat)

**发送消息：**
```json
{
  "frameType": 0,
  "id": "2",
  "method": "conversation.chat",
  "data": {
    "conversationId": "0x0000003000000001_0x0000003000000002",
    "chatType": 2,
    "recvId": "0x0000003000000002",
    "msg": {
      "mType": 0,
      "content": "Hello, this is a test message"
    },
    "sendTime": 1626342523123
  }
}
```

### 4. 推送消息 (push)

**发送消息：**
```json
{
  "frameType": 0,
  "id": "3",
  "method": "push",
  "data": {
    "conversationId": "0x0000003000000001_0x0000003000000002",
    "chatType": 2,
    "sendId": "0x0000003000000001",
    "recvId": "0x0000003000000002",
    "mType": 0,
    "content": "This is a push message test",
    "sendTime": 1626342523123
  }
}
```

## 完整测试流程示例

### 场景：两用户之间建立会话并互相发送消息

1. **用户A登录**
   - 获取用户A的JWT令牌

2. **用户B登录**
   - 获取用户B的JWT令牌

3. **建立会话**
   - 用户A调用 `POST /v1/im/setup/conversation` 创建与用户B的会话

4. **获取会话列表**
   - 用户A调用 `GET /v1/im/conversation` 查看会话列表
   - 确认与用户B的会话存在

5. **建立WebSocket连接**
   - 用户A和用户B分别建立WebSocket连接
   - 发送 `user.online` 消息通知上线状态

6. **发送聊天消息**
   - 用户A通过WebSocket发送 `conversation.chat` 消息给用户B
   - 用户B应收到通过Kafka传递的消息

7. **查看聊天记录**
   - 用户B调用 `GET /v1/im/chatlog` 查看与用户A的聊天记录
   - 确认消息已正确记录

8. **直接推送消息**
   - 用户B通过WebSocket发送 `push` 消息给用户A
   - 用户A应立即收到消息（如果在线）

9. **更新会话状态**
   - 用户B调用 `PUT /v1/im/conversation` 更新会话已读状态

## 测试数据

### 可用用户ID列表

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

### 消息类型常量

```
消息类型(mType):
0: 文本消息 (TextMType)

聊天类型(chatType):
1: 群聊 (GroupChatType)
2: 单聊 (SingleChatType)
```

## Apifox配置技巧

1. **环境变量设置**
   - 创建全局变量存储服务器地址和端口
   - 创建变量存储JWT令牌，方便复用

2. **认证配置**
   - 为HTTP API创建Bearer Token授权配置
   - 为WebSocket请求配置URL参数认证

3. **测试用例组织**
   - 按功能模块组织测试用例
   - 创建测试套件组合相关API

4. **自动化测试**
   - 创建前置脚本获取并存储JWT令牌
   - 设置变量提取器获取会话ID
   - 配置断言验证响应

5. **WebSocket调试技巧**
   - 使用新建的WebSocket客户端HTML文件辅助调试
   - 使用Apifox的WebSocket请求保存和重用消息模板
   - 注意记录并观察WebSocket连接的状态变化