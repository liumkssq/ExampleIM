package user

import (
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/svc"
	websocketx "github.com/liumkssq/easy-chat/apps/im/ws/websocket"
)

func OnLine(svc *svc.ServiceContext) websocketx.HandlerFunc {
	return func(srv *websocketx.Server, conn *websocketx.Conn, msg *websocketx.Message) {
		uids := srv.GetUsers()
		u := srv.GetUsers(conn)
		err := srv.Send(websocketx.NewMessage(u[0], uids), conn)
		srv.Info("err ", err)
	}
}
