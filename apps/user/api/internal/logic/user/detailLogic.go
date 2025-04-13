package user

import (
	"context"
	"fmt"
	"github.com/jinzhu/copier"
	"github.com/liumkssq/easy-chat/apps/user/rpc/user"
	"github.com/liumkssq/easy-chat/pkg/ctxdata"

	"github.com/liumkssq/easy-chat/apps/user/api/internal/svc"
	"github.com/liumkssq/easy-chat/apps/user/api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 获取用户信息
func NewDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DetailLogic {
	return &DetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DetailLogic) Detail(req *types.UserInfoReq) (resp *types.UserInfoResp, err error) {
	uid := ctxdata.GetUId(l.ctx)
	fmt.Println("get uid", uid)
	userInfoResp, err := l.svcCtx.User.GetUserInfo(l.ctx, &user.GetUserInfoReq{
		Id: uid,
	})
	fmt.Printf("userInfoResp: %v\n", userInfoResp)
	if err != nil {
		return nil, err
	}
	var res types.User
	copier.Copy(&res, userInfoResp.User)
	fmt.Printf("res %v ", res)
	return &types.UserInfoResp{Info: res}, nil
}
