package svc

import (
	"github.com/liumkssq/easy-chat/apps/user/models"
	"github.com/liumkssq/easy-chat/apps/user/rpc/internal/config"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type ServiceContext struct {
	Config     config.Config
	UserModels models.UsersModel
}

func NewServiceContext(c config.Config) *ServiceContext {
	conn := sqlx.NewMysql(c.Mysql.DataSource)
	return &ServiceContext{
		Config:     c,
		UserModels: models.NewUsersModel(conn, c.Cache),
	}
}
