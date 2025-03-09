package test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
)

type RegisterReq struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
	Nickname string `json:"nickname"`
	Sex      byte   `json:"sex"`
	Avatar   string `json:"avatar"`
}

type RegisterResp struct {
	Token  string `json:"token"`
	Expire int64  `json:"expire"`
}

func TestGetAuthToken(t *testing.T) {
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

	fmt.Printf("Got JWT Token: %s\n", result.Token)
	fmt.Printf("Token Expires: %d\n", result.Expire)
}
