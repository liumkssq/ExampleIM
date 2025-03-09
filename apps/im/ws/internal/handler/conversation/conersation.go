package conversation

import (
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/svc"
	"github.com/liumkssq/easy-chat/apps/im/ws/websocket"
)

func Chat(svc *svc.ServiceContext) websocket.HandlerFunc {
	return func(srv *websocket.Server, conn *websocket.Conn, msg *websocket.Message) {
		//var data ws.Chat
		//todo
		//srv.SendByUserId(server.NewMessage)
	}
}
