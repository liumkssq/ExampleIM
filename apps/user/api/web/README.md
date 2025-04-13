# ExampleIM 用户中心客户端

这是一个用于 ExampleIM 系统的用户中心客户端，提供登录、注册和用户信息管理功能。

## 功能特点

1. **用户登录**：使用手机号和密码登录系统
2. **用户注册**：创建新用户账号
3. **用户信息查看**：显示当前登录用户的信息
4. **Token管理**：查看和复制JWT Token，方便用于其他API调用
5. **本地会话存储**：记住登录状态，刷新页面后不需要重新登录

## 使用方法

### 准备工作

1. 确保 ExampleIM 的用户服务 API 已启动并正常运行
2. 如果 API 不是运行在默认端口，请在"API设置"部分修改 API 基础 URL

### 功能说明

1. **登录**：
   - 填写手机号和密码
   - 点击"登录"按钮
   - 登录成功后会自动获取用户信息并切换到用户信息页面

2. **注册**：
   - 填写手机号、密码、昵称和其他信息
   - 点击"注册"按钮
   - 注册成功后会自动获取用户信息并切换到用户信息页面

3. **用户信息**：
   - 查看当前登录用户的信息
   - 可以复制 JWT Token 用于 WebSocket 等其他 API 调用
   - 点击"刷新用户信息"按钮可以重新获取最新的用户信息
   - 点击"退出登录"按钮可以清除登录状态

4. **API响应**：
   - 显示所有 API 请求和响应的详细信息
   - 便于调试和了解 API 交互过程
   - 点击"清除"按钮可以清空响应记录

## API接口

本客户端使用以下API接口：

1. **登录接口**：(从 swagger.json 提取)
   ```
   POST /v1/user/login
   请求体: { "phone": "手机号", "password": "密码" }
   响应: { "token": "JWT令牌", "expire": 过期时间戳 }
   ```

2. **注册接口**：(从 swagger.json 提取)
   ```
   POST /v1/user/register
   请求体: { "phone": "手机号", "password": "密码", "nickname": "昵称", "sex": 性别, "avatar": "头像URL" }
   响应: { "token": "JWT令牌", "expire": 过期时间戳 }
   ```

3. **用户信息接口**：(从 swagger.json 提取)
   ```
   GET /v1/user/user
   请求头: Authorization: Bearer {token}
   响应: { "info": { "id": "用户ID", "mobile": "手机号", "nickname": "昵称", "sex": 性别, "avatar": "头像URL" } }
   ```

## Token使用

获取的JWT Token可用于：

1. 调用需要认证的API接口（如获取用户信息）
2. WebSocket连接认证（在URL中通过`?token=xxx`或请求头中传递）

## 注意事项

1. 默认API基础URL为`http://localhost:8888`（根据`user.yaml`配置）
2. 客户端已根据`swagger.json`调整了API请求路径和数据格式
3. JWT配置基于`user.yaml`，密钥为"imooc.com"，过期时间为8640000秒
4. 登录状态会保存在浏览器的localStorage中，清除浏览器数据会导致需要重新登录
5. 为了安全起见，生产环境应使用HTTPS