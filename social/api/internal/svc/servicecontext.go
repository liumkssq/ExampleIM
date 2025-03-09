package svc

import (
	"time"

	"github.com/liumkssq/easy-chat/pkg/job"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config      Config
	SocialRpc   zrpc.Client
	RetryPolicy *job.RetryConfig
}

func NewServiceContext(c Config) *ServiceContext {
	// 创建重试策略配置
	retryPolicy := &job.RetryConfig{
		MaxRetries:     5,
		InitialBackoff: time.Second, // "1s"
		MaxBackoff:     time.Second, // "1s"
		BackoffFactor:  1.0,
		Jitter:         true,
	}

	return &ServiceContext{
		Config:      c,
		SocialRpc:   zrpc.MustNewClient(c.SocialRpc),
		RetryPolicy: retryPolicy,
	}
}
