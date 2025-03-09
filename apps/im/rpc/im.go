package main

import (
	"flag"
	"fmt"
	"github.com/liumkssq/easy-chat/pkg/interceptor/rpcserver"

	"github.com/liumkssq/easy-chat/apps/im/rpc/im"
	"github.com/liumkssq/easy-chat/apps/im/rpc/internal/config"
	"github.com/liumkssq/easy-chat/apps/im/rpc/internal/server"
	"github.com/liumkssq/easy-chat/apps/im/rpc/internal/svc"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/service"
	"github.com/zeromicro/go-zero/zrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

var configFile = flag.String("f", "etc/im.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)
	ctx := svc.NewServiceContext(c)

	s := zrpc.MustNewServer(c.RpcServerConf, func(grpcServer *grpc.Server) {
		im.RegisterImServer(grpcServer, server.NewImServer(ctx))

		if c.Mode == service.DevMode || c.Mode == service.TestMode {
			reflection.Register(grpcServer)
		}
	})
	s.AddUnaryInterceptors(rpcserver.LogInterceptor)
	defer s.Stop()

	fmt.Printf("Starting rpc server at %s...\n", c.ListenOn)
	s.Start()
}
