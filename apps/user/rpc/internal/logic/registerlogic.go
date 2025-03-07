package logic

import (
	"context"
	"database/sql"
	"github.com/liumkssq/easy-chat/apps/user/models"
	"github.com/liumkssq/easy-chat/pkg/ctxdata"
	"github.com/liumkssq/easy-chat/pkg/encrypt"
	"github.com/liumkssq/easy-chat/pkg/wuid"
	"github.com/pkg/errors"
	"time"

	"github.com/liumkssq/easy-chat/apps/user/rpc/internal/svc"
	"github.com/liumkssq/easy-chat/apps/user/rpc/user"

	"github.com/zeromicro/go-zero/core/logx"
)

var (
	ErrPhoneIsRegister = errors.New("手机号已经注册")
)

type RegisterLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewRegisterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RegisterLogic {
	return &RegisterLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *RegisterLogic) Register(in *user.RegisterReq) (*user.RegisterResp, error) {

	userEntiry, err := l.svcCtx.UserModels.FindByPhone(l.ctx, in.Phone)
	if err != nil && err != models.ErrNotFound {
		return nil, err
	}
	if userEntiry != nil {
		return nil, ErrPhoneIsRegister
	}

	userEntiry = &models.Users{
		Id:       wuid.GenUid(l.svcCtx.Config.Mysql.DataSource),
		Avatar:   in.Avatar,
		Nickname: in.Nickname,
		Phone:    in.Phone,
		Sex: sql.NullInt64{
			Int64: int64(in.Sex),
			Valid: true,
		},
	}
	//todo 密码加密
	if len(in.Password) > 0 {
		genPasswod, err := encrypt.GenPasswordHash([]byte(in.Password))
		if err != nil {
			return nil, err
		}
		userEntiry.Password = sql.NullString{
			String: string(genPasswod),
			Valid:  true,
		}
	}

	_, err = l.svcCtx.UserModels.Insert(l.ctx, userEntiry)
	if err != nil {
		return nil, err
	}
	now := time.Now().Unix()

	token, err := ctxdata.GetJwtToken(l.svcCtx.Config.Jwt.AccessSecret,
		now, l.svcCtx.Config.Jwt.AccessExpire, userEntiry.Id)
	if err != nil {
		return nil, err
	}
	return &user.RegisterResp{
		Token:  token,
		Expire: now + l.svcCtx.Config.Jwt.AccessExpire,
	}, nil
}
