/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package config

import (
	"github.com/zeromicro/go-zero/core/service"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

type Config struct {
	service.ServiceConf

	ListenOn string

	JwtAuth struct {
		AccessSecret string
	}
	Redisx redis.RedisConf

	Mongo struct {
		Url string
		Db  string
	}

	MsgChatTransfer struct {
		Topic string
		Addrs []string
	}

	MsgReadTransfer struct {
		Topic string
		Addrs []string
	}
}
