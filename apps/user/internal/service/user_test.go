package service

import (
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"testing"
)

func init() {
	// Start pprof server for live profiling
	go func() {
		runtime.SetBlockProfileRate(1)
		runtime.SetMutexProfileFraction(1)
		http.ListenAndServe("localhost:6060", nil)
	}()
}

// BenchmarkUserCreate benchmarks the user creation process
func BenchmarkUserCreate(b *testing.B) {
	// Setup test dependencies
	svc := setupTestUserService(b)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		user := generateTestUser(i)
		_, err := svc.Create(user)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// BenchmarkUserLogin benchmarks the login process
func BenchmarkUserLogin(b *testing.B) {
	// Setup test dependencies
	svc := setupTestUserService(b)
	user := generateTestUser(0)
	_, err := svc.Create(user)
	if err != nil {
		b.Fatal(err)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := svc.Login(user.Email, "password123")
		if err != nil {
			b.Fatal(err)
		}
	}
}

// BenchmarkUserProfileParallel benchmarks profile retrieval with parallel execution
func BenchmarkUserProfileParallel(b *testing.B) {
	// Setup test dependencies
	svc := setupTestUserService(b)
	user := generateTestUser(0)
	userID, err := svc.Create(user)
	if err != nil {
		b.Fatal(err)
	}

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, err := svc.GetProfile(userID)
			if err != nil {
				b.Fatal(err)
			}
		}
	})
}

// Example of memory allocation benchmark
func BenchmarkUserSearch(b *testing.B) {
	// Setup test dependencies
	svc := setupTestUserService(b)

	// Create test users
	for i := 0; i < 100; i++ {
		user := generateTestUser(i)
		_, err := svc.Create(user)
		if err != nil {
			b.Fatal(err)
		}
	}

	b.ResetTimer()
	b.ReportAllocs() // Report memory allocations

	for i := 0; i < b.N; i++ {
		_, err := svc.Search("test")
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Helper functions (implement these based on your actual user service)
func setupTestUserService(b *testing.B) UserService {
	// Initialize your service with test dependencies
	// Return a test instance of your UserService
	return nil // Replace with actual implementation
}

func generateTestUser(i int) User {
	// Create a test user with unique data
	// Return a test User object
	return User{} // Replace with actual implementation
}
