package job

import "time"

// RetryOption defines the retry option function type
type RetryOption func(*RetryOptions)

// RetryOptions contains all retry configuration options
type RetryOptions struct {
	// Timeout is the total timeout for all retry attempts
	Timeout time.Duration
	// RetryNums is the maximum number of retry attempts
	RetryNums int
	// RetryJetLag is the delay between retries
	RetryJetLag time.Duration
	// RetryFunc is the function to determine if retry should continue
	RetryFunc func(error) bool
}

// DefaultRetryOptions provides default retry options
var DefaultRetryOptions = RetryOptions{
	Timeout:     30 * time.Second,
	RetryNums:   3,
	RetryJetLag: 1 * time.Second,
	RetryFunc:   DefaultRetryFunc,
}

// DefaultRetryFunc is the default retry condition function
func DefaultRetryFunc(err error) bool {
	return err != nil && !IsNonRetryableError(err)
}

// WithTimeout sets the timeout option
func WithTimeout(timeout time.Duration) RetryOption {
	return func(o *RetryOptions) {
		o.Timeout = timeout
	}
}

// WithRetryNums sets the retry numbers option
func WithRetryNums(nums int) RetryOption {
	return func(o *RetryOptions) {
		o.RetryNums = nums
	}
}

// WithRetryJetLag sets the retry delay option
func WithRetryJetLag(jetLag time.Duration) RetryOption {
	return func(o *RetryOptions) {
		o.RetryJetLag = jetLag
	}
}

// WithRetryFunc sets the retry condition function
func WithRetryFunc(fn func(error) bool) RetryOption {
	return func(o *RetryOptions) {
		o.RetryFunc = fn
	}
}
