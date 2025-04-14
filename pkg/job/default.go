/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package job

import "time"

const (
	DefaultRetryJetLag  = time.Second
	DefaultRetryTimeout = 2 * time.Second
	DefaultRetryNums    = 5
)
