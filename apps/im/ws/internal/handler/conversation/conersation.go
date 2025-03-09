package conversation

import (
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/svc"
	"github.com/liumkssq/easy-chat/apps/im/ws/websocket"
	"github.com/liumkssq/easy-chat/apps/im/ws/ws"
	"github.com/liumkssq/easy-chat/pkg/constants"
	"github.com/mitchellh/mapstructure"
)

func Chat(svc *svc.ServiceContext) websocket.HandlerFunc {
	return func(srv *websocket.Server, conn *websocket.Conn, msg *websocket.Message) {
		var data ws.Chat
		if err := mapstructure.Decode(msg.Data, &data); err != nil {
			srv.Send(websocket.NewErrMessage(err), conn)
			return
		}
		switch data.ChatType {
		case constants.SingleChatType:
			//err := svc.MsgChatTransferClient.Push(&mq.MsgChatTransfer{
			//	ConversationId: data.ConversationId,
			//	ChatType:       data.ChatType,
			//	SendId:         conn.Uid,
			//	RecvId:         data.RecvId,
			//	SendTime:       time.Now().UnixNano(),
			//	MType:          data.Msg.MType,
			//	Content:        data.Msg.Content,
			//})
		}
	}
}
