# serverOptions.go 文件说明

## 文件概述

`serverOptions.go` 文件定义了WebSocket服务器的配置选项，实现了一个灵活的选项模式，允许用户在创建WebSocket服务器时自定义各种参数。该文件作为服务器配置的核心组件，支持认证、超时和消息确认等多种配置。

## 主要类型定义

### ServerOptions 函数类型

```go
type ServerOptions func(opt *serverOption)
```

这是一个函数类型，用于修改服务器选项。通过这种函数选项模式，可以实现灵活的服务器配置。

### serverOption 结构体

```go
type serverOption struct {
    Authentication
    ack               AckType
    ackTimeout        time.Duration
    pattern           string
    maxConnectionIdle time.Duration
}
```

包含服务器的所有配置参数：
- `Authentication`：用户认证接口
- `ack`：消息确认类型
- `ackTimeout`：确认超时时间
- `pattern`：WebSocket路径模式
- `maxConnectionIdle`：最大空闲连接时间

## 主要函数

### newServerOption 函数

```go
func newServerOption(opts ...ServerOptions) serverOption {
    o := serverOption{
        Authentication:    new(authentication),
        maxConnectionIdle: defaultMaxConnectionIdle,
        ackTimeout:        defaultAckTimeout,
        pattern:           "/ws",
    }
    for _, opt := range opts {
        opt(&o)
    }
    return o
}
```

创建服务器选项的工厂函数，设置默认值并应用自定义选项。

## 选项函数

### WithServerAuthentication

```go
func WithServerAuthentication(auth Authentication) ServerOptions {
    return func(opt *serverOption) {
        opt.Authentication = auth
    }
}
```

设置自定义认证实现。

### WithServerAck

```go
func WithServerAck(ack AckType) ServerOptions {
    return func(opt *serverOption) {
        opt.ack = ack
    }
}
```

设置消息确认类型（无确认、简单确认或严格确认）。

### WithServerMaxConnectionIdle

```go
func WithServerMaxConnectionIdle(maxConnectionIdle time.Duration) ServerOptions {
    return func(opt *serverOption) {
        opt.maxConnectionIdle = maxConnectionIdle
    }
}
```

设置最大空闲连接时间，超过此时间的空闲连接将被关闭。

### WithServerAckTimeout

```go
func WithServerAckTimeout(ackTimeout time.Duration) ServerOptions {
    return func(opt *serverOption) {
        opt.ackTimeout = ackTimeout
    }
}
```

设置消息确认超时时间。

### WithServerPatten

```go
func WithServerPatten(patten string) ServerOptions {
    return func(opt *serverOption) {
        opt.pattern = patten
    }
}
```

设置WebSocket服务的URL路径模式。

## 使用方式

这些选项函数用于在创建WebSocket服务器时自定义配置：

```go
server := NewServer("localhost:8080", 
    WithServerAuthentication(customAuth),
    WithServerAck(RigorAck),
    WithServerPatten("/ws/chat"))
```

## 设计特点

1. **函数选项模式**：通过函数选项模式实现灵活配置
2. **合理默认值**：提供合理的默认配置
3. **模块化设计**：各配置项相互独立，可以单独设置
4. **链式配置**：可以通过多个选项函数链式配置服务器

## 注意事项

1. 选项函数应该在服务器启动前设置，启动后更改无效
2. 认证实现应根据实际应用场景选择合适的策略
3. 消息确认机制会影响性能，应根据业务需求合理选择