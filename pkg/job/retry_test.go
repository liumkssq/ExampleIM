package job

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestRetry(t *testing.T) {
	var attempts int

	// Test successful execution on first attempt
	t.Run("success_first_attempt", func(t *testing.T) {
		attempts = 0
		err := Retry(context.Background(), func(ctx context.Context) error {
			attempts++
			return nil
		})
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
		if attempts != 1 {
			t.Errorf("Expected 1 attempt, got %d", attempts)
		}
	})

	// Test successful execution after retries
	t.Run("success_after_retries", func(t *testing.T) {
		attempts = 0
		err := Retry(context.Background(), func(ctx context.Context) error {
			attempts++
			if attempts < 3 {
				return errors.New("temporary error")
			}
			return nil
		})
		if err != nil {
			t.Errorf("Expected no error, got %v", err)
		}
		if attempts != 3 {
			t.Errorf("Expected 3 attempts, got %d", attempts)
		}
	})

	// Test non-retryable error
	t.Run("non_retryable_error", func(t *testing.T) {
		attempts = 0
		expectedErr := errors.New("critical error")
		err := Retry(context.Background(), func(ctx context.Context) error {
			attempts++
			return NewNonRetryableError(expectedErr)
		})

		if !errors.Is(err, expectedErr) {
			t.Errorf("Expected error %v, got %v", expectedErr, err)
		}
		if attempts != 1 {
			t.Errorf("Expected 1 attempt, got %d", attempts)
		}
	})

	// Test timeout
	t.Run("timeout", func(t *testing.T) {
		attempts = 0
		err := Retry(context.Background(), func(ctx context.Context) error {
			attempts++
			return errors.New("temporary error")
		}, WithTimeout(100*time.Millisecond))

		if !errors.Is(err, ErrRetryTimeout) {
			t.Errorf("Expected timeout error, got %v", err)
		}
	})

	// Test custom retry function
	t.Run("custom_retry_function", func(t *testing.T) {
		attempts = 0
		customErr := errors.New("custom error")
		err := Retry(context.Background(), func(ctx context.Context) error {
			attempts++
			return customErr
		}, WithRetryFunc(func(err error) bool {
			return false // Never retry
		}))

		if !errors.Is(err, customErr) {
			t.Errorf("Expected error %v, got %v", customErr, err)
		}
		if attempts != 1 {
			t.Errorf("Expected 1 attempt, got %d", attempts)
		}
	})
}

func TestRetryWithCallback(t *testing.T) {
	var attempts int
	var callbackAttempts int

	err := RetryWithCallback(
		context.Background(),
		func(ctx context.Context) error {
			attempts++
			if attempts < 3 {
				return errors.New("temporary error")
			}
			return nil
		},
		func(attempt int, err error) {
			callbackAttempts++
		},
	)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if attempts != 3 {
		t.Errorf("Expected 3 attempts, got %d", attempts)
	}
	if callbackAttempts != 2 {
		t.Errorf("Expected 2 callback calls, got %d", callbackAttempts)
	}
}
