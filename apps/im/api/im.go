package main

import (
	"flag"
	"fmt"
	"github.com/liumkssq/easy-chat/pkg/resultx"
	"github.com/zeromicro/go-zero/rest/httpx"

	"github.com/liumkssq/easy-chat/apps/im/api/internal/config"
	"github.com/liumkssq/easy-chat/apps/im/api/internal/handler"
	"github.com/liumkssq/easy-chat/apps/im/api/internal/svc"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"
)

var configFile = flag.String("f", "etc/im.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	server := rest.MustNewServer(c.RestConf, rest.WithCors("*"))
	defer server.Stop()

	ctx := svc.NewServiceContext(c)
	handler.RegisterHandlers(server, ctx)
	httpx.SetErrorHandlerCtx(resultx.ErrHandler(c.Name))
	httpx.SetOkHandler(resultx.OkHandler)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
