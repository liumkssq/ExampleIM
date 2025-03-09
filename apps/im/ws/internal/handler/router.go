package handler

import (
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/handler/conversation"
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/handler/user"
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/svc"
	"github.com/liumkssq/easy-chat/apps/im/ws/websocket"
)

func RegisterHandler(srv *websocket.Server, svc *svc.ServiceContext) {
	srv.AddRoutes([]websocket.Route{
		{
			Method:  "user.online",
			Handler: user.OnLine(svc),
		},
		{
			Method:  "conversation.chat",
			Handler: conversation.Chat(svc),
		},
		//{
		//	Method:  "push",
		//	Handler: push.Push(svc),
		//},
	})
}
