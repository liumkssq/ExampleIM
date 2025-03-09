package job

import (
	"context"
	"errors"
	"math"
	"math/rand"
	"time"
)

// RetryConfig defines the configuration for retry behavior
type RetryConfig struct {
	// MaxRetries is the maximum number of retries before giving up
	MaxRetries int
	// InitialBackoff is the initial backoff duration
	InitialBackoff time.Duration
	// MaxBackoff is the maximum backoff duration
	MaxBackoff time.Duration
	// BackoffFactor is the factor by which the backoff increases
	BackoffFactor float64
	// Jitter adds randomness to the backoff to prevent synchronized retries
	Jitter bool
}

// DefaultRetryConfig provides sensible default values for RetryConfig
var DefaultRetryConfig = RetryConfig{
	MaxRetries:     5,
	InitialBackoff: 100 * time.Millisecond,
	MaxBackoff:     10 * time.Second,
	BackoffFactor:  2.0,
	Jitter:         true,
}

// RetryableFunc is a function that can be retried
type RetryableFunc func(ctx context.Context) error

// ErrMaxRetriesExceeded is returned when the maximum number of retries is exceeded
var ErrMaxRetriesExceeded = errors.New("maximum number of retries exceeded")

// ErrRetryTimeout is returned when the retry operation times out
var ErrRetryTimeout = errors.New("retry operation timed out")

// Retry executes the given function with retry logic based on the provided options
func Retry(ctx context.Context, fn RetryableFunc, opts ...RetryOption) error {
	// Apply options
	options := DefaultRetryOptions
	for _, opt := range opts {
		opt(&options)
	}

	// Create timeout context
	timeoutCtx, cancel := context.WithTimeout(ctx, options.Timeout)
	defer cancel()

	var err error
	for attempt := 0; attempt <= options.RetryNums; attempt++ {
		// If this is not the first attempt, wait according to the retry delay
		if attempt > 0 {
			select {
			case <-timeoutCtx.Done():
				if timeoutCtx.Err() == context.DeadlineExceeded {
					return errors.Join(ErrRetryTimeout, err)
				}
				return timeoutCtx.Err()
			case <-time.After(options.RetryJetLag):
				// Continue with retry
			}
		}

		// Execute the function
		err = fn(timeoutCtx)
		if err == nil {
			return nil
		}

		// Check if we should retry
		if !options.RetryFunc(err) {
			return err
		}
	}

	return errors.Join(ErrMaxRetriesExceeded, err)
}

// calculateBackoff determines the next backoff duration based on the attempt number and config
func calculateBackoff(attempt int, config RetryConfig) time.Duration {
	// Calculate exponential backoff: initialBackoff * (backoffFactor ^ attempt)
	backoff := float64(config.InitialBackoff) * math.Pow(config.BackoffFactor, float64(attempt))

	// Apply maximum backoff limit
	if backoff > float64(config.MaxBackoff) {
		backoff = float64(config.MaxBackoff)
	}

	// Apply jitter if configured (adds up to 20% random variation)
	if config.Jitter {
		jitter := rand.Float64() * 0.2
		backoff = backoff * (1 + jitter)
	}

	return time.Duration(backoff)
}

// NonRetryableError wraps an error to indicate it should not be retried
type NonRetryableError struct {
	Err error
}

// Error implements the error interface
func (e NonRetryableError) Error() string {
	if e.Err == nil {
		return "non-retryable error"
	}
	return "non-retryable: " + e.Err.Error()
}

// Unwrap returns the wrapped error
func (e NonRetryableError) Unwrap() error {
	return e.Err
}

// NewNonRetryableError creates a new non-retryable error
func NewNonRetryableError(err error) error {
	return NonRetryableError{Err: err}
}

// IsNonRetryableError checks if an error is marked as non-retryable
func IsNonRetryableError(err error) bool {
	var nonRetryable NonRetryableError
	return errors.As(err, &nonRetryable)
}

// RetryWithCallback is similar to Retry but calls the onRetry function before each retry
func RetryWithCallback(ctx context.Context, fn RetryableFunc, onRetry func(attempt int, err error), opts ...RetryOption) error {
	// Apply options
	options := DefaultRetryOptions
	for _, opt := range opts {
		opt(&options)
	}

	// Create timeout context
	timeoutCtx, cancel := context.WithTimeout(ctx, options.Timeout)
	defer cancel()

	var err error
	for attempt := 0; attempt <= options.RetryNums; attempt++ {
		// If this is not the first attempt, call callback and wait
		if attempt > 0 {
			if onRetry != nil {
				onRetry(attempt, err)
			}

			select {
			case <-timeoutCtx.Done():
				if timeoutCtx.Err() == context.DeadlineExceeded {
					return errors.Join(ErrRetryTimeout, err)
				}
				return timeoutCtx.Err()
			case <-time.After(options.RetryJetLag):
				// Continue with retry
			}
		}

		// Execute the function
		err = fn(timeoutCtx)
		if err == nil {
			return nil
		}

		// Check if we should retry
		if !options.RetryFunc(err) {
			return err
		}
	}

	return errors.Join(ErrMaxRetriesExceeded, err)
}
