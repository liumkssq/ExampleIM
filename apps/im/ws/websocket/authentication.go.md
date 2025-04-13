# authentication.go 文件说明

## 文件概述

`authentication.go` 文件实现了WebSocket连接的认证接口和默认实现。该文件定义了一个通用的WebSocket认证机制，用于控制客户端连接权限和获取用户标识。

## 主要接口和结构

### Authentication 接口

```go
type Authentication interface {
    Auth(w http.ResponseWriter, r *http.Request) bool
    UserId(r *http.Request) string
}
```

这个接口定义了两个关键方法：
- `Auth`：验证WebSocket连接请求是否有效
- `UserId`：从请求中提取用户ID

### authentication 结构体

```go
type authentication struct {
}
```

这是Authentication接口的默认实现，提供了基本的认证逻辑。

## 主要功能实现

### Auth 方法

```go
func (a *authentication) Auth(w http.ResponseWriter, r *http.Request) bool {
    return true
}
```

默认实现总是返回`true`，表示允许所有连接请求。在实际应用中，应该重写此方法实现真正的认证逻辑，例如检查JWT令牌。

### UserId 方法

```go
func (a authentication) UserId(r *http.Request) string {
    query := r.URL.Query()
    if query != nil && query["userId"] != nil {
        return fmt.Sprintf("%v", query["userId"])
    }
    return fmt.Sprintf("%v", time.Now().UnixMilli())
}
```

该方法从HTTP请求中提取用户ID：
1. 首先尝试从URL查询参数中获取`userId`参数
2. 如果未找到，则返回当前时间戳作为默认ID

## 使用场景

1. 在WebSocket服务器初始化时，可以通过`WithServerAuthentication`选项设置自定义认证实现
2. 默认实现主要用于开发和测试环境，生产环境应该使用更严格的认证机制

## 与服务器的集成

服务器在处理新的WebSocket连接请求时会调用这些方法：
1. 在`ServerWs`方法中调用`Auth`来决定是否接受连接
2. 在`addConn`方法中调用`UserId`来获取用户标识

## 设计特点

1. **接口分离**：通过接口定义分离认证策略和具体实现
2. **可扩展性**：可以轻松实现自定义认证逻辑
3. **简单默认实现**：提供基本功能，便于开发和测试

## 注意事项

1. 默认实现没有真正的安全验证，不适合生产环境
2. 在实际应用中应实现合适的认证逻辑，例如验证JWT令牌
3. 用户ID的提取逻辑应根据具体业务需求调整