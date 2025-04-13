package logic

import (
	"context"
	"fmt"
	"github.com/liumkssq/easy-chat/apps/user/models"
	"github.com/pkg/errors"

	"github.com/jinzhu/copier"
	"github.com/liumkssq/easy-chat/apps/user/rpc/internal/svc"
	"github.com/liumkssq/easy-chat/apps/user/rpc/user"
	"github.com/zeromicro/go-zero/core/logx"
)

var ErrUserNotFound = errors.New("这个用户没有")

type GetUserInfoLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewGetUserInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserInfoLogic {
	return &GetUserInfoLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *GetUserInfoLogic) GetUserInfo(in *user.GetUserInfoReq) (*user.GetUserInfoResp, error) {

	userEntiy, err := l.svcCtx.UserModels.FindOne(l.ctx, in.Id)
	if err != nil {
		if err == models.ErrNotFound {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	logx.Infof("userEntiy %v", userEntiy)
	var resp user.UserEntity
	_ = copier.Copy(&resp, userEntiy)
	fmt.Printf("resp: %v", resp)

	return &user.GetUserInfoResp{
		User: &resp,
	}, nil
}
