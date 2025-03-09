package test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/liumkssq/easy-chat/apps/task/mq/mq"
	"github.com/liumkssq/easy-chat/pkg/constants"
	"github.com/zeromicro/go-queue/kq"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

func getAuthToken(t *testing.T) string {
	// Register a test user
	reqBody := RegisterReq{
		Phone:    "13800138000",
		Password: "test123",
		Nickname: "TestUser",
		Sex:      1,
		Avatar:   "https://example.com/avatar.jpg",
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := http.Post("http://localhost:8888/v1/user/register", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	var result RegisterResp
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		t.Fatal(err)
	}

	return result.Token
}

func TestKafkaPublish(t *testing.T) {
	// Get JWT token first
	token := getAuthToken(t)
	fmt.Printf("Using JWT token: %s\n", token)

	// Set up Redis with system token
	redisClient := redis.MustNewRedis(redis.RedisConf{
		Host: "127.0.0.1:16379",
		Type: "node",
		Pass: "easy-chat",
	})

	err := redisClient.Set(constants.REDIS_SYSTEM_ROOT_TOKEN, token)
	if err != nil {
		t.Fatal(err)
	}

	// Create Kafka pusher
	pusher := kq.NewPusher([]string{"127.0.0.1:9094"}, "msgChatTransfer")

	msg := &mq.MsgChatTransfer{
		ConversationId: "test-conversation",
		ChatType:       constants.SingleChatType,
		SendId:         "user1",
		RecvId:         "user2",
		SendTime:       time.Now().UnixNano(),
		MType:          constants.TextMType,
		Content:        "Hello, this is a test message!",
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatal(err)
	}

	err = pusher.Push(context.Background(), string(data))
	if err != nil {
		t.Fatal(err)
	}

	t.Log("Message published successfully")
}
