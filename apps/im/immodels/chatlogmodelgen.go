package immodels

import (
	"context"
	"go.mongodb.org/mongo-driver/mongo/options"
	"time"

	"github.com/zeromicro/go-zero/core/stores/mon"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type chatLogModel interface {
	Insert(ctx context.Context, data *ChatLog) error
	FindOne(ctx context.Context, id string) (*ChatLog, error)
	ListBySendTime(ctx context.Context, conversationId string, startSendTime, endSendTime, limit int64) ([]*ChatLog, error)
	Update(ctx context.Context, data *ChatLog) error
	Delete(ctx context.Context, id string) error
}

type defaultChatLogModel struct {
	conn *mon.Model
}

func newDefaultChatLogModel(conn *mon.Model) *defaultChatLogModel {
	return &defaultChatLogModel{conn: conn}
}

func (m *defaultChatLogModel) Insert(ctx context.Context, data *ChatLog) error {
	if !data.ID.IsZero() {
		data.ID = primitive.NewObjectID()
		data.CreateAt = time.Now()
		data.UpdateAt = time.Now()
	}

	_, err := m.conn.InsertOne(ctx, data)
	return err
}

func (m *defaultChatLogModel) FindOne(ctx context.Context, id string) (*ChatLog, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidObjectId
	}

	var data ChatLog

	err = m.conn.FindOne(ctx, &data, bson.M{"_id": oid})
	switch err {
	case nil:
		return &data, nil
	case mon.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}

func (m *defaultChatLogModel) Update(ctx context.Context, data *ChatLog) error {
	data.UpdateAt = time.Now()

	_, err := m.conn.ReplaceOne(ctx, bson.M{"_id": data.ID}, data)
	return err
}

func (m *defaultChatLogModel) Delete(ctx context.Context, id string) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidObjectId
	}

	_, err = m.conn.DeleteOne(ctx, bson.M{"_id": oid})
	return err
}

// 查询聊天记录
func (m *defaultChatLogModel) ListBySendTime(ctx context.Context, conversationId string, startSendTime, endSendTime, limit int64) ([]*ChatLog, error) {
	var data []*ChatLog

	opt := options.FindOptions{
		Limit: &DefaultChatLogLimit,
		Sort: bson.M{
			"sendTime": -1,
		},
	}
	if limit > 0 {
		opt.Limit = &limit
	}

	filter := bson.M{
		"conversationId": conversationId,
	}

	if endSendTime > 0 {
		filter["sendTime"] = bson.M{
			"$gt":  endSendTime,
			"$lte": startSendTime,
		}
	} else {
		filter["sendTime"] = bson.M{
			"$lt": startSendTime,
		}
	}
	err := m.conn.Find(ctx, &data, filter, &opt)
	switch err {
	case nil:
		return data, nil
	case mon.ErrNotFound:
		return nil, ErrNotFound
	default:
		return nil, err
	}
}
