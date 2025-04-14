/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package interceptor

import (
	"context"
	"fmt"
	"github.com/pkg/errors"
	"github.com/zeromicro/go-zero/core/collection"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/utils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
)

type Idempotent interface {
	// 获取请求的标识
	Identify(ctx context.Context, method string) string
	// 是否支持幂等性
	IsIdempotentMethod(fullMethod string) bool
	// 幂等性的验证
	TryAcquire(ctx context.Context, id string) (resp interface{}, isAcquire bool)
	// 执行之后结果的保存
	SaveResp(ctx context.Context, id string, resp interface{}, respErr error) error
}

var (
	// 请求任务标识
	TKey = "easy-chat-idempotence-task-id"

	// 设置rpc调度中rpc请求的标识
	DKey = "easy-chat-idempotence-dispatch-key"
)

func ContextWithVal(ctx context.Context) context.Context {
	// 设置请求的id
	return context.WithValue(ctx, TKey, utils.NewUuid())
}

// 客户端的拦截器
func NewIdempotenceClient(idempotent Idempotent) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		// 获取唯一的key
		identify := idempotent.Identify(ctx, method)

		// 在rpc请求中的头部信息
		ctx = metadata.NewOutgoingContext(ctx, map[string][]string{
			DKey: {identify},
		})

		// 请求
		return invoker(ctx, method, req, reply, cc, opts...)
	}
}

func NewIdempotenceServer(idempotent Idempotent) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		// 获取请求的id
		identify := metadata.ValueFromIncomingContext(ctx, DKey)
		if len(identify) == 0 || !idempotent.IsIdempotentMethod(info.FullMethod) {
			// 不进行幂等性处理
			return handler(ctx, req)
		}

		fmt.Println("----", "请求进入 幂等性处理 ", identify)

		r, isAcquire := idempotent.TryAcquire(ctx, identify[0])
		if isAcquire {
			resp, err = handler(ctx, req)
			fmt.Println("---- 执行任务", identify)

			if err := idempotent.SaveResp(ctx, identify[0], resp, err); err != nil {
				return resp, err
			}

			return resp, err
		}

		// 任务已经有执行了
		fmt.Println("----- 任务在执行", identify)

		if r != nil {
			fmt.Println("--- 任务已经执行完了 ", identify)
			return r, nil
		}

		// 可能还在执行
		return nil, errors.WithStack(xerr.New(int(codes.DeadlineExceeded), fmt.Sprintf("存在其他任务在执行 id %v", identify[0])))
	}
}

var (
	DefaultIdempotent       = new(defaultIdempotent)
	DefaultIdempotentClient = NewIdempotenceClient(DefaultIdempotent)
)

type defaultIdempotent struct {
	// 获取和设置请求的id
	*redis.Redis
	// 注意存储
	*collection.Cache
	// 设置方法对幂等的支持
	method map[string]bool
}

func NewDefaultIdempotent(c redis.RedisConf) Idempotent {
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

// // 获取请求的标识
// Identify(ctx context.Context, method string) string
func (d *defaultIdempotent) Identify(ctx context.Context, method string) string {
	id := ctx.Value(TKey)
	// 让其生成请求id
	rpcId := fmt.Sprintf("%v.%s", id, method)
	return rpcId
}

// // 是否支持幂等性
// IsIdempotentMethod(fullMethod string) bool
func (d *defaultIdempotent) IsIdempotentMethod(fullMethod string) bool {
	return d.method[fullMethod]
}

// // 幂等性的验证
// TryAcquire(ctx context.Context, id string) (resp interface{}, isAcquire bool)
func (d *defaultIdempotent) TryAcquire(ctx context.Context, id string) (resp interface{}, isAcquire bool) {
	// 基于redis实现
	retry, err := d.SetnxEx(id, "1", 60*60)
	if err != nil {
		return nil, false
	}

	if retry {
		return nil, true
	}

	resp, _ = d.Cache.Get(id)
	return resp, false
}

// // 执行之后结果的保存
// SaveResp(ctx context.Context, id string, resp interface{}, respErr error) error
func (d *defaultIdempotent) SaveResp(ctx context.Context, id string, resp interface{}, respErr error) error {
	d.Cache.Set(id, resp)
	return nil
}
