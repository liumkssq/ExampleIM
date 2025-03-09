package interceptor

import (
	"context"
	"fmt"

	"github.com/zeromicro/go-zero/core/collection"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/utils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

const (
	// Tkey 任务key
	Tkey = "easy-im-idempotence-task-key"
	// Dkey 分发key
	Dkey = "easy-im-idempotence-dispatch-key"
)

// Idempotence 幂等性接口
type Idempotence interface {
	// Identify 生成唯一标识
	Identify(ctx context.Context, method string) string
	// IsIdempotentMethod 判断是否是幂等性方法
	IsIdempotentMethod(fullMethod string) bool
	// TryAcquire 尝试获取锁
	TryAcquire(ctx context.Context, id string) (resp interface{}, isAcquire bool)
	// SaveResp 保存响应
	SaveResp(ctx context.Context, id string, resp interface{}, respErr error) error
}

// defaultIdempotent 默认实现

func ContentWithVal(ctx context.Context) context.Context {
	return context.WithValue(ctx, Tkey, utils.NewUuid())
}

func NewIdempotenceClient(idempotence Idempotence) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		identify := idempotence.Identify(ctx, method)
		ctx = metadata.NewOutgoingContext(ctx, map[string][]string{
			Dkey: {identify},
		})
		return invoker(ctx, method, req, reply, cc, opts...)
	}
}

func NewIdempotenceServe(idempotence Idempotence) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		identify := metadata.ValueFromIncomingContext(ctx, Dkey)
		if len(identify) == 0 || !idempotence.IsIdempotentMethod(info.FullMethod) {
			return handler(ctx, req)
		}
		fmt.Println("start")
		r, isAcquire := idempotence.TryAcquire(ctx, identify[0])
		if isAcquire {
			resp, err = handler(ctx, req)
			if err != nil {
				return
			}
			err = idempotence.SaveResp(ctx, identify[0], resp, err)
			if err != nil {
				logx.Errorf("save resp error: %v", err)
			}
			return resp, err
		}
		if r != nil {
			return r, nil
		}
		return nil, fmt.Errorf("idempotent")
	}
}

var (
	DefaultIdempotent       = new(defaultIdempotent)
	DefaultIdempotentClient = NewIdempotenceClient(DefaultIdempotent)
)

type defaultIdempotent struct {
	Redis  *redis.Redis
	Cache  *collection.Cache
	method map[string]bool
}

// NewDefaultIdempotent 创建默认幂等性实现
func NewDefaultIdempotent(c redis.RedisConf) Idempotence {
	// 创建缓存实例
	cache, err := collection.NewCache(60 * 60)
	if err != nil {
		panic(err)
	}

	return &defaultIdempotent{
		Redis: redis.MustNewRedis(c),
		Cache: cache,
		method: map[string]bool{
			"/social.social/GroupCreate": true,
		},
	}
}

// Identify 生成唯一标识
func (d *defaultIdempotent) Identify(ctx context.Context, method string) string {
	// 获取api任务-请求id
	id := ctx.Value(Tkey)

	// 生成rpc请求任务id
	rpcId := fmt.Sprintf("%v.%s", id, method)

	return rpcId
}

// IsIdempotentMethod 判断是否是幂等性方法
func (d *defaultIdempotent) IsIdempotentMethod(fullMethod string) bool {
	return d.method[fullMethod]
}

// TryAcquire 尝试获取锁
func (d *defaultIdempotent) TryAcquire(ctx context.Context, id string) (resp interface{}, isAcquire bool) {
	// 设置id，redis
	retry, err := d.Redis.SetnxEx(id, "1", 60*60)
	if err != nil {
		return nil, false
	}

	if retry {
		return nil, true
	}

	// 从缓存中获取数据
	resp, _ = d.Cache.Get(id)
	return resp, retry
}

// SaveResp 保存响应
func (d *defaultIdempotent) SaveResp(ctx context.Context, id string, resp interface{}, respErr error) error {
	// TODO implement me
	d.Cache.Set(id, resp)
	return nil
}
