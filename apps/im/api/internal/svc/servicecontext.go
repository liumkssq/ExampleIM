package svc

import (
	"github.com/liumkssq/easy-chat/apps/im/api/internal/config"
	"github.com/liumkssq/easy-chat/apps/im/rpc/imclient"
	"github.com/liumkssq/easy-chat/apps/social/rpc/socialclient"
	"github.com/liumkssq/easy-chat/apps/user/rpc/userclient"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config config.Config
	imclient.Im
	userclient.User
	socialclient.Social
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config: c,
		Im:     imclient.NewIm(zrpc.MustNewClient(c.ImRpc)),
		User:   userclient.NewUser(zrpc.MustNewClient(c.UserRpc)),
		Social: socialclient.NewSocial(zrpc.MustNewClient(c.SocialRpc)),
	}
}
