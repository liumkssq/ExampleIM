package svc

import (
	"github.com/liumkssq/easy-chat/apps/im/rpc/imclient"
	"github.com/liumkssq/easy-chat/apps/social/api/internal/config"
	"github.com/liumkssq/easy-chat/apps/social/api/internal/middleware"
	"github.com/liumkssq/easy-chat/apps/social/rpc/socialclient"
	"github.com/liumkssq/easy-chat/apps/user/rpc/userclient"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
)

var retryPolicy = `{
	"methodConfig" : [{
		"name": [{
			"service": "social.social"
		}],
		"waitForReady": true,
		"retryPolicy": {
			"maxAttempts": 5,
			"initialBackoff": "0.001s",
			"maxBackoff": "0.002s",
			"backoffMultiplier": 1.0,
			"retryableStatusCodes": ["UNKNOWN", "DEADLINE_EXCEEDED"]
		}
	}]
}`

type ServiceContext struct {
	Config                config.Config
	IdempotenceMiddleware rest.Middleware
	LimitMiddleware       rest.Middleware
	*redis.Redis
	socialclient.Social
	userclient.User
	imclient.Im
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config:                c,
		IdempotenceMiddleware: middleware.NewIdempotenceMiddleware().Handle,
		LimitMiddleware:       middleware.NewLimitMiddleware().Handle,
		Social:                socialclient.NewSocial(zrpc.MustNewClient(c.SocialRpc)), //zrpc.WithDialOption(grpc.WithDefaultServiceConfig(retryPolicy)),
		//zrpc.WithUnaryClientInterceptor(interceptor.DefaultIdempotentClient),

		User: userclient.NewUser(zrpc.MustNewClient(c.UserRpc)), //zrpc.WithUnaryClientInterceptor(rpcclient.NewSheddingClient("user-rpc",
		//	load.WithBuckets(10),
		//	load.WithCpuThreshold(1),
		//	load.WithWindow(time.Millisecond*100000),
		//)),

		Im: imclient.NewIm(zrpc.MustNewClient(c.ImRpc)),
	}
}
