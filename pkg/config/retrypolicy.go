package config

var retryPolicy = `{
	"methodConfig": [{
		"name": [{
			"service": "social.social"
		}],
		"waitForReady": true,
		"retryPolicy": {
			"MaxAttempts": 5,
			"InitialBackoff": "1s",
			"MaxBackoff": "1s",
			"BackoffMultiplier": 1.0,
			"RetryableStatusCodes": ["UNKNOWN", "DEADLINE_EXCEEDED"]
		}
	}]
}`

// GetRetryPolicy returns the retry policy configuration
func GetRetryPolicy() string {
	return retryPolicy
}
