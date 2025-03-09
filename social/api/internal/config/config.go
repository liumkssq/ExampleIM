package config

import (
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
)

type Config struct {
	rest.RestConf
	SocialRpc   zrpc.RpcClientConf
	RetryPolicy RetryPolicyConfig
}

type RetryPolicyConfig struct {
	MethodConfig []MethodConfig `json:"methodConfig"`
}

type MethodConfig struct {
	Name         ServiceName `json:"name"`
	WaitForReady bool        `json:"waitForReady"`
	RetryPolicy  RetryPolicy `json:"retryPolicy"`
}

type ServiceName struct {
	Service string `json:"service"`
}

type RetryPolicy struct {
	MaxAttempts          int      `json:"MaxAttempts"`
	InitialBackoff       string   `json:"InitialBackoff"`
	MaxBackoff           string   `json:"MaxBackoff"`
	BackoffMultiplier    float64  `json:"BackoffMultiplier"`
	RetryableStatusCodes []string `json:"RetryableStatusCodes"`
}
