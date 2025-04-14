/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package ws

import "github.com/liumkssq/easy-chat/pkg/constants"

type (
	Msg struct {
		MsgId           string            `mapstructure:"msgId"`
		ReadRecords     map[string]string `mapstructure:"readRecords"`
		constants.MType `mapstructure:"mType"`
		Content         string `mapstructure:"content"`
	}

	Chat struct {
		constants.ChatType `mapstructure:"chatType"`
		Msg                `mapstructure:"msg"`

		ConversationId string `mapstructure:"conversationId"`
		SendId         string `mapstructure:"sendId"`
		RecvId         string `mapstructure:"recvId"`
		SendTime       int64  `mapstructure:"sendTime"`
	}

	Push struct {
		constants.ChatType `mapstructure:"chatType"`
		constants.MType    `mapstructure:"mType"`

		ConversationId string `mapstructure:"conversationId"`

		SendId   string   `mapstructure:"sendId"`
		RecvId   string   `mapstructure:"recvId"`
		RecvIds  []string `mapstructure:"recvIds"`
		SendTime int64    `mapstructure:"sendTime"`

		MsgId       string                `mapstructure:"msgId"`
		ReadRecords map[string]string     `mapstructure:"readRecords"`
		ContentType constants.ContentType `mapstructure:"contentType"`

		Content string `mapstructure:"content"`
	}

	MarkRead struct {
		constants.ChatType `mapstructure:"chatType"`
		RecvId             string   `mapstructure:"recvId"`
		ConversationId     string   `mapstructure:"conversationId"`
		MsgIds             []string `mapstructure:"msgIds"`
	}
)
