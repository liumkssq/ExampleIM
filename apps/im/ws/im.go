package main

import (
	"flag"
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/config"
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/handler"
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/svc"
	"github.com/liumkssq/easy-chat/apps/im/ws/websocket"
	"github.com/zeromicro/go-zero/core/conf"
	"time"
)

var configFile = flag.String("f", "etc/im.yaml", "the config file")

func main() {
	flag.Parse()
	var c config.Config
	conf.MustLoad(*configFile, &c)
	if err := c.SetUp(); err != nil {
		panic(err)
	}
	ctx := svc.NewServiceContext(c)
	srv := websocket.NewServer(c.ListenOn,
		websocket.WithServerAuthentication(handler.NewJwtAuth(ctx)),
		websocket.WithServerAck(websocket.RigorAck),
		websocket.WithServerMaxConnectionIdle(10*60*time.Second))

	defer srv.Stop()
	handler.RegisterHandler(srv, ctx)
	srv.Start()
}
