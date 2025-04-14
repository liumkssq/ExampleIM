package websocket

//* @author: dn-jinmin/dn-jinmin
//* @doc:
//*/
//
//package conversation
//
//import (
//	"github.com/mitchellh/mapstructure"
//	"imooc.com/easy-chat/apps/im/ws/internal/svc"
//	"imooc.com/easy-chat/apps/im/ws/websocket"
//	"imooc.com/easy-chat/apps/im/ws/ws"
//	"imooc.com/easy-chat/apps/task/mq/mq"
//	"imooc.com/easy-chat/pkg/constants"
//	"imooc.com/easy-chat/pkg/wuid"
//	"time"
//)
//
//func Chat(svc *svc.ServiceContext) websocket.HandlerFunc {
//	return func(srv *websocket.Server, conn *websocket.Conn, msg *websocket.Message) {
//		// todo: 私聊
//		var data ws.Chat
//		if err := mapstructure.Decode(msg.Data, &data); err != nil {
//			srv.Send(websocket.NewErrMessage(err), conn)
//			return
//		}
//
//		if data.ConversationId == "" {
//			switch data.ChatType {
//			case constants.SingleChatType:
//				data.ConversationId = wuid.CombineId(conn.Uid, data.RecvId)
//			case constants.GroupChatType:
//				data.ConversationId = data.RecvId
//			}
//		}
//
//		err := svc.MsgChatTransferClient.Push(&mq.MsgChatTransfer{
//			ConversationId: data.ConversationId,
//			ChatType:       data.ChatType,
//			SendId:         conn.Uid,
//			RecvId:         data.RecvId,
//			SendTime:       time.Now().UnixMilli(),
//			MType:          data.Msg.MType,
//			Content:        data.Msg.Content,
//			MsgId:          msg.Id,
//		})
//		if err != nil {
//			srv.Send(websocket.NewErrMessage(err), conn)
//			return
//		}
//	}
//}
//
//func MarkRead(svc *svc.ServiceContext) websocket.HandlerFunc {
//	return func(srv *websocket.Server, conn *websocket.Conn, msg *websocket.Message) {
//		// todo: 已读未读处理
//		var data ws.MarkRead
//		if err := mapstructure.Decode(msg.Data, &data); err != nil {
//			srv.Send(websocket.NewErrMessage(err), conn)
//			return
//		}
//
//		err := svc.MsgReadTransferClient.Push(&mq.MsgMarkRead{
//			ChatType:       data.ChatType,
//			ConversationId: data.ConversationId,
//			SendId:         conn.Uid,
//			RecvId:         data.RecvId,
//			MsgIds:         data.MsgIds,
//		})
//
//		if err != nil {
//			srv.Send(websocket.NewErrMessage(err), conn)
//			return
//		}
//	}
//}
