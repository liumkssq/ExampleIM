package group

import (
	"context"
	"github.com/liumkssq/easy-chat/apps/social/api/internal/svc"
	"github.com/liumkssq/easy-chat/apps/social/api/internal/types"
	"github.com/liumkssq/easy-chat/apps/social/rpc/socialclient"
	"github.com/liumkssq/easy-chat/pkg/constants"

	"github.com/zeromicro/go-zero/core/logx"
)

type GroupUserOnlineLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGroupUserOnlineLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GroupUserOnlineLogic {
	return &GroupUserOnlineLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GroupUserOnlineLogic) GroupUserOnline(req *types.GroupUserOnlineReq) (resp *types.GroupUserOnlineResp, err error) {
	// todo: add your logic here and delete this line

	groupUsers, err := l.svcCtx.Social.GroupUsers(l.ctx, &socialclient.GroupUsersReq{
		GroupId: req.GroupId,
	})
	if err != nil || len(groupUsers.List) == 0 {
		return &types.GroupUserOnlineResp{}, err
	}
	// 查询，缓存中查询在线的用户
	uids := make([]string, 0, len(groupUsers.List))
	for _, group := range groupUsers.List {
		uids = append(uids, group.UserId)
	}

	onlines, err := l.svcCtx.Redis.Hgetall(constants.REDIS_ONLINE_USER)
	if err != nil {
		return nil, err
	}

	resOnLineList := make(map[string]bool, len(uids))
	for _, s := range uids {
		if _, ok := onlines[s]; ok {
			resOnLineList[s] = true
		} else {
			resOnLineList[s] = false
		}
	}

	return &types.GroupUserOnlineResp{
		OnlineList: resOnLineList,
	}, nil
}
