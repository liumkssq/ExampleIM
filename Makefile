.PHONY: all build test clean lint docker-build docker-push pprof bench flame-graph

# Global variables
DOCKER_REGISTRY ?= your-registry
VERSION ?= $(shell git describe --tags --always --dirty)
SERVICES := user social im task

# Go related variables
GOBASE := $(shell pwd)
GOBIN := $(GOBASE)/bin
PROFILE_PORT ?= 6060
SERVICE ?= user
BENCH_TIME ?= 30s
BENCH_FUNC ?= .

# Build all services
all: lint test build

# Build specific service
build-%:
	@echo "Building $*..."
	@cd apps/$* && go build -o ../../bin/$* ./cmd/...

# Build all services
build: $(addprefix build-,$(SERVICES))

# Run tests
test:
	@echo "Running tests..."
	@go test ./... -v -race

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(GOBIN)/*

# Run linter
lint:
	@echo "Running linter..."
	@golangci-lint run ./...

# Docker related commands
docker-build-%:
	@echo "Building Docker image for $*..."
	@docker build -t $(DOCKER_REGISTRY)/$*:$(VERSION) -f apps/$*/Dockerfile .

# Build all Docker images
docker-build: $(addprefix docker-build-,$(SERVICES))

# Push Docker image
docker-push-%:
	@echo "Pushing Docker image for $*..."
	@docker push $(DOCKER_REGISTRY)/$*:$(VERSION)

# Push all Docker images
docker-push: $(addprefix docker-push-,$(SERVICES))

# Run all services locally using docker-compose
docker-compose-up:
	@docker-compose up -d

# Stop all services
docker-compose-down:
	@docker-compose down

# Profiling commands
pprof-%:
	@echo "Starting pprof for $* service..."
	@cd apps/$* && go test -cpuprofile=cpu.prof -memprofile=mem.prof -bench=$(BENCH_FUNC) -benchtime=$(BENCH_TIME) ./...

# Run pprof HTTP server for CPU profile
pprof-cpu-%:
	@echo "Viewing CPU profile for $* service..."
	@go tool pprof -http=:$(PROFILE_PORT) apps/$*/cpu.prof

# Run pprof HTTP server for memory profile
pprof-mem-%:
	@echo "Viewing memory profile for $* service..."
	@go tool pprof -http=:$(PROFILE_PORT) apps/$*/mem.prof

# Generate flame graph
flame-graph-%:
	@echo "Generating flame graph for $* service..."
	@cd apps/$* && go test -cpuprofile=cpu.prof -bench=$(BENCH_FUNC) -benchtime=$(BENCH_TIME) ./...
	@go tool pprof -flamegraph apps/$*/cpu.prof > apps/$*/flame.svg

# Run benchmarks
bench-%:
	@echo "Running benchmarks for $* service..."
	@cd apps/$* && go test -bench=$(BENCH_FUNC) -benchmem -benchtime=$(BENCH_TIME) ./...

# Run all benchmarks
bench-all:
	@for service in $(SERVICES); do \
		make bench-$$service; \
	done

# Show help
help:
	@echo "Available targets:"
	@echo "  all              - Run lint, test, and build"
	@echo "  build           - Build all services"
	@echo "  build-<service> - Build specific service"
	@echo "  test            - Run tests"
	@echo "  clean           - Clean build artifacts"
	@echo "  lint            - Run linter"
	@echo "  docker-build    - Build all Docker images"
	@echo "  docker-push     - Push all Docker images"
	@echo "  docker-compose-up   - Start all services locally"
	@echo "  docker-compose-down - Stop all services"
	@echo "  pprof-<service>     - Run pprof profiling for a service"
	@echo "  pprof-cpu-<service> - View CPU profile in browser"
	@echo "  pprof-mem-<service> - View memory profile in browser"
	@echo "  flame-graph-<service> - Generate flame graph for a service"
	@echo "  bench-<service>     - Run benchmarks for a service"
	@echo "  bench-all          - Run benchmarks for all services"
	@echo ""
	@echo "Variables:"
	@echo "  SERVICE=<name>     - Specify service name for commands"
	@echo "  BENCH_TIME=30s     - Specify benchmark duration"
	@echo "  BENCH_FUNC=.       - Specify benchmark function pattern"
	@echo "  PROFILE_PORT=6060  - Specify port for pprof HTTP server"
