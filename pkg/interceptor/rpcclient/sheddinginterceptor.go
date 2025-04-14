/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package rpcclient

import (
	"context"
	"fmt"
	"github.com/zeromicro/go-zero/core/load"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"sync"
)

var (
	sheddingStat *load.SheddingStat
	shedder      load.Shedder
	lock         sync.Mutex
)

func NewSheddingClient(sname string, opts ...load.ShedderOption) grpc.UnaryClientInterceptor {
	ensureShedding(sname, opts...)

	return func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) (err error) {
		sheddingStat.IncrementTotal()
		var promise load.Promise
		promise, err = shedder.Allow()
		if err != nil {
			sheddingStat.IncrementDrop()
			fmt.Println("---- sheddingStat.IncrementDrop() --------- ")
			return
		}
		fmt.Println("---- shedder.Allow() --------- ", err)
		defer func() {
			if Acceptable(err) {
				fmt.Println("---- NewSheddingClient --- acceptable promise.Pass() ", err)
				promise.Pass()
			} else {
				promise.Fail()
				fmt.Println("---- NewSheddingClient --- acceptable promise.Fail()")
			}
		}()

		// 请求
		return invoker(ctx, method, req, reply, cc, opts...)
	}
}

func ensureShedding(sname string, opts ...load.ShedderOption) {
	lock.Lock()
	if sheddingStat == nil {
		sheddingStat = load.NewSheddingStat(sname)
	}

	if shedder == nil {
		shedder = load.NewAdaptiveShedder(opts...)
	}
	lock.Unlock()
}

func Acceptable(err error) bool {
	switch status.Code(err) {
	case codes.DeadlineExceeded, codes.Internal, codes.Unavailable, codes.DataLoss, codes.Unimplemented:
		return false
	default:
		return true
	}
}
