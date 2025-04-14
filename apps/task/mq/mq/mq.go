/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package mq

import "github.com/liumkssq/easy-chat/pkg/constants"

type MsgChatTransfer struct {
	MsgId string `mapstructure:"msgId"`

	ConversationId     string `json:"conversationId"`
	constants.ChatType `json:"chatType"`
	SendId             string   `json:"sendId"`
	RecvId             string   `json:"recvId"`
	RecvIds            []string `json:"recvIds"`
	SendTime           int64    `json:"sendTime"`

	constants.MType `json:"mType"`
	Content         string `json:"content"`
}

type MsgMarkRead struct {
	constants.ChatType `json:"chatType"`
	ConversationId     string   `json:"conversationId"`
	SendId             string   `json:"sendId"`
	RecvId             string   `json:"recvId"`
	MsgIds             []string `json:"msgIds"`
}
