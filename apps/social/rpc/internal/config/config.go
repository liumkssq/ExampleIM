package config

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/zrpc"
)

type Config struct {
	zrpc.RpcServerConf
	//TimeOut int
	Mysql struct {
		DataSource string
	}
	Cache cache.CacheConf
}
