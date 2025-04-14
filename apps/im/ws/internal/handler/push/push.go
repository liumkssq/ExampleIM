/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package push

import (
	"github.com/liumkssq/easy-chat/apps/im/ws/internal/svc"
	"github.com/liumkssq/easy-chat/apps/im/ws/websocket"
	"github.com/liumkssq/easy-chat/apps/im/ws/ws"
	"github.com/liumkssq/easy-chat/pkg/constants"
	"github.com/mitchellh/mapstructure"
)

func Push(svc *svc.ServiceContext) websocket.HandlerFunc {
	return func(srv *websocket.Server, conn *websocket.Conn, msg *websocket.Message) {
		var data ws.Push
		if err := mapstructure.Decode(msg.Data, &data); err != nil {
			srv.Send(websocket.NewErrMessage(err))
			return
		}
		// 发送的目标
		switch data.ChatType {
		case constants.SingleChatType:
			single(srv, &data, data.RecvId)
		case constants.GroupChatType:
			group(srv, &data)
		}
	}
}

func single(srv *websocket.Server, data *ws.Push, recvId string) error {
	rconn := srv.GetConn(recvId)
	if rconn == nil {
		// todo: 目标离线
		return nil
	}

	srv.Infof("push msg %v", data)

	return srv.Send(websocket.NewMessage(data.SendId, &ws.Chat{
		ConversationId: data.ConversationId,
		ChatType:       data.ChatType,
		SendTime:       data.SendTime,
		Msg: ws.Msg{
			ReadRecords: data.ReadRecords,
			MsgId:       data.MsgId,
			MType:       data.MType,
			Content:     data.Content,
		},
	}), rconn)
}

func group(srv *websocket.Server, data *ws.Push) error {
	for _, id := range data.RecvIds {
		func(id string) {
			srv.Schedule(func() {
				single(srv, data, id)
			})
		}(id)
	}
	return nil
}
