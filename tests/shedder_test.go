/**
 * @author: dn-jinmin/dn-jinmin
 * @doc:
 */

package main

import (
	"math/rand"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/zeromicro/go-zero/core/load"
	"github.com/zeromicro/go-zero/core/mathx"
	"github.com/zeromicro/go-zero/core/stat"
)

const (
	buckets        = 1
	bucketDuration = time.Millisecond * 1000
)

func init() {
	stat.SetReporter(nil)
}

func Test_Shedder(t *testing.T) {
	shedder := load.NewAdaptiveShedder(load.WithWindow(bucketDuration), load.WithBuckets(buckets), load.WithCpuThreshold(10))
	var wg sync.WaitGroup
	var drop int64
	proba := mathx.NewProba()
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := 0; i < 30; i++ {
				promise, err := shedder.Allow()
				if err != nil {
					t.Log(" ---------- shedder.Allow() ---------", err)
					atomic.AddInt64(&drop, 1)
				} else {
					count := rand.Intn(5)
					time.Sleep(time.Millisecond * time.Duration(count) * 10)
					if proba.TrueOnProba(0.01) {
						promise.Fail()
					} else {
						promise.Pass()
					}
				}
			}
		}()
	}
	wg.Wait()
}
