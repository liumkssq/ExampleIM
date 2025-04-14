/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package job

import "time"

type (
	RetryOptions func(opts *retryOptions)

	retryOptions struct {
		timeout     time.Duration
		retryNums   int
		isRetryFunc IsRetryFunc
		retryJetLag RetryJetLagFunc
	}
)

func newOptions(opts ...RetryOptions) *retryOptions {
	opt := &retryOptions{
		timeout:     DefaultRetryTimeout,
		retryNums:   DefaultRetryNums,
		isRetryFunc: RetryAlways,
		retryJetLag: RetryJetLagAlways,
	}

	for _, options := range opts {
		options(opt)
	}
	return opt
}

func WithRetryTimeout(timeout time.Duration) RetryOptions {
	return func(opts *retryOptions) {
		if timeout > 0 {
			opts.timeout = timeout
		}
	}
}
func WithRetryNums(nums int) RetryOptions {
	return func(opts *retryOptions) {
		opts.retryNums = 1

		if nums > 1 {
			opts.retryNums = nums
		}
	}
}

func WithIsRetryFunc(retryFunc IsRetryFunc) RetryOptions {
	return func(opts *retryOptions) {
		if retryFunc != nil {
			opts.isRetryFunc = retryFunc
		}
	}
}

func WithRetryJetLagFunc(retryJetLagFunc RetryJetLagFunc) RetryOptions {
	return func(opts *retryOptions) {
		if retryJetLagFunc != nil {
			opts.retryJetLag = retryJetLagFunc
		}
	}
}
