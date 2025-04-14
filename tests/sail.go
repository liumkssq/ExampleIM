/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package main

import (
	"fmt"
	"github.com/HYY-yu/sail-client"
	"time"
)

type Config struct {
	Name string
	Host string
	Port string
	Mode string

	Database string

	UserRpc struct {
		Etcd struct {
			Hosts []string
			Key   string
		}
	}
	Redisx struct {
		Host string
		Pass string
	}
	JwtAuth struct {
		AccessSecret string
	}
}

func main() {
	var cfg Config

	s := sail.New(&sail.MetaConfig{
		ETCDEndpoints:  "192.168.117.24:3379",
		ProjectKey:     "98c6f2c2287f4c73cea3d40ae7ec3ff2",
		Namespace:      "user",
		Configs:        "user-api.yaml",
		ConfigFilePath: "./conf",
		LogLevel:       "DEBUG",
	}, sail.WithOnConfigChange(func(configFileKey string, s *sail.Sail) {
		if s.Err() != nil {
			fmt.Println(s.Err())
			return
		}

		fmt.Println(s.Pull())

		v, err := s.MergeVipers()
		if err != nil {
			fmt.Println(err)
			return
		}
		v.Unmarshal(&cfg)
		fmt.Println(cfg, "\n", cfg.Database)
	}))
	if s.Err() != nil {
		fmt.Println(s.Err())
		return
	}

	fmt.Println(s.Pull())

	v, err := s.MergeVipers()
	if err != nil {
		fmt.Println(err)
		return
	}
	v.Unmarshal(&cfg)
	fmt.Println(cfg, "\n", cfg.Database)

	for {
		time.Sleep(time.Second)
	}
}
