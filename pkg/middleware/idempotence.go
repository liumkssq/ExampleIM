package middleware

import (
	"net/http"

	"github.com/liumkssq/easy-chat/pkg/interceptor"
)

type IdempotenceMiddleware struct{}

func NewIdempotenceMiddleware() *IdempotenceMiddleware {
	return &IdempotenceMiddleware{}
}

func (m *IdempotenceMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r = r.WithContext(interceptor.ContentWithVal(r.Context()))

		next(w, r)
	}
}
