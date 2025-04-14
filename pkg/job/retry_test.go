/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package job

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestWithRetry(t *testing.T) {
	var (
		ErrTest = errors.New("测试异常")
		handler = func(ctx context.Context) error {
			t.Log("执行handler")
			return ErrTest
		}
	)
	type args struct {
		ctx     context.Context
		handler func(context.Context) error
		opts    []RetryOptions
	}
	tests := []struct {
		name    string
		args    args
		wantErr error
	}{
		{
			"1", args{
				ctx:     context.Background(),
				handler: handler,
				opts:    []RetryOptions{},
			}, ErrJobTimeout,
		},
		{
			"2", args{
				ctx:     context.Background(),
				handler: handler,
				opts: []RetryOptions{
					WithRetryTimeout(3 * time.Second),
					WithRetryJetLagFunc(func(ctx context.Context, retryCount int, lastTime time.Duration) time.Duration {
						return 500 * time.Millisecond
					}),
				},
			}, ErrTest,
		},
		{
			"3", args{
				ctx:     context.Background(),
				handler: handler,
				opts: []RetryOptions{
					WithIsRetryFunc(func(ctx context.Context, retryCount int, err error) bool {
						return false
					}),
				},
			}, ErrTest,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if err := WithRetry(tt.args.ctx, tt.args.handler, tt.args.opts...); err != tt.wantErr {
				t.Errorf("WithRetry() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
