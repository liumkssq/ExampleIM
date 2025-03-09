package svc

import (
	"github.com/liumkssq/easy-chat/apps/im/rpc/imclient"
	"github.com/liumkssq/easy-chat/apps/social/api/internal/config"
	"github.com/liumkssq/easy-chat/apps/social/rpc/socialclient"
	"github.com/liumkssq/easy-chat/apps/user/rpc/userclient"
	"github.com/liumkssq/easy-chat/pkg/interceptor"
	"github.com/liumkssq/easy-chat/pkg/middleware"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
)

var retryPolicy = `{
	"methodConfig": [{
		"name": [{
			"service": "social.social"
		}],
		"waitForReady": true,
		"retryPolicy": {
			"MaxAttempts": 5,
			"InitialBackoff": "1s",
			"MaxBackoff": "1s",
			"BackoffMultiplier": 1.0,
			"RetryableStatusCodes": ["UNKNOWN", "DEADLINE_EXCEEDED"]
		}
	}]
}`

type ServiceContext struct {
	Config      config.Config
	Idempotence rest.Middleware
	imclient.Im
	Redis   *redis.Redis
	UserRpc userclient.User
	Social  socialclient.Social
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config:      c,
		Redis:       redis.MustNewRedis(c.Redisx),
		Idempotence: middleware.NewIdempotenceMiddleware().Handle,
		Im:          imclient.NewIm(zrpc.MustNewClient(c.ImRpc)),
		UserRpc:     userclient.NewUser(zrpc.MustNewClient(c.UserRpc)),
		Social: socialclient.NewSocial(zrpc.MustNewClient(
			c.SocialRpc,
			zrpc.WithUnaryClientInterceptor(interceptor.DefaultIdempotentClient),
			zrpc.WithDialOption(grpc.WithDefaultServiceConfig(retryPolicy))),
		),
	}
}
