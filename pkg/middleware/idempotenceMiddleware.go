/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package middleware

import (
	"github.com/liumkssq/easy-chat/pkg/interceptor"
	"net/http"
)

type IdempotenceMiddleware struct {
}

func NewIdempotenceMiddleware() *IdempotenceMiddleware {
	return &IdempotenceMiddleware{}
}
func (m *IdempotenceMiddleware) Handler(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r = r.WithContext(interceptor.ContextWithVal(r.Context()))

		next(w, r)
	}
}
