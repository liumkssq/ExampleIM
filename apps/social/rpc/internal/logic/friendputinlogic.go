package logic

import (
	"context"
	"database/sql"
	"time"

	"github.com/liumkssq/easy-chat/apps/social/socialmodels"
	"github.com/liumkssq/easy-chat/pkg/constants"
	"github.com/liumkssq/easy-chat/pkg/xerr"
	"github.com/pkg/errors"

	"github.com/liumkssq/easy-chat/apps/social/rpc/internal/svc"
	"github.com/liumkssq/easy-chat/apps/social/rpc/social"

	"github.com/zeromicro/go-zero/core/logx"
)

type FriendPutInLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewFriendPutInLogic(ctx context.Context, svcCtx *svc.ServiceContext) *FriendPutInLogic {
	return &FriendPutInLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

// 好友业务：请求好友、通过或拒绝申请、好友列表
func (l *FriendPutInLogic) FriendPutIn(in *social.FriendPutInReq) (*social.FriendPutInResp, error) {
	// First check if they are already friends
	friends, err := l.svcCtx.FriendsModel.FindByUidAndFid(l.ctx, in.UserId, in.ReqUid)
	if err != nil && err != socialmodels.ErrNotFound {
		logx.Errorf("FindByUidAndFid error: %v, userId: %s, friendId: %s", err, in.UserId, in.ReqUid)
		return nil, errors.Wrapf(xerr.NewDBErr(), "find friend error: %v", err)
	}
	if friends != nil {
		// Already friends, return success
		return &social.FriendPutInResp{}, nil
	}

	// Check if there's already a friend request
	friendReqs, err := l.svcCtx.FriendRequestsModel.FindByReqUidAndUserId(l.ctx, in.ReqUid, in.UserId)
	if err != nil && err != socialmodels.ErrNotFound {
		logx.Errorf("FindByReqUidAndUserId error: %v, reqUid: %s, userId: %s", err, in.ReqUid, in.UserId)
		return nil, errors.Wrapf(xerr.NewDBErr(), "find friend request error: %v", err)
	}
	if friendReqs != nil {
		// Request already exists, return success
		return &social.FriendPutInResp{}, nil
	}

	// Create new friend request
	reqTime := time.Unix(in.ReqTime, 0)
	_, err = l.svcCtx.FriendRequestsModel.Insert(l.ctx, &socialmodels.FriendRequests{
		UserId: in.UserId,
		ReqUid: in.ReqUid,
		ReqMsg: sql.NullString{
			Valid:  len(in.ReqMsg) > 0,
			String: in.ReqMsg,
		},
		ReqTime: reqTime,
		HandleResult: sql.NullInt64{
			Int64: int64(constants.NoHandlerResult),
			Valid: true,
		},
	})
	if err != nil {
		logx.Errorf("Insert friend request error: %v, request: %+v", err, in)
		return nil, errors.Wrapf(xerr.NewDBErr(), "insert friend request error: %v", err)
	}

	return &social.FriendPutInResp{}, nil
}
