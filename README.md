# Easy-Chat Microservices

A modern microservices-based chat application with user management, social features, instant messaging, and task management capabilities.

## Services

- **User Service**: Handles user authentication, registration, and profile management
- **Social Service**: Manages social interactions, friend relationships, and user connections
- **IM Service**: Real-time instant messaging and chat functionality
- **Task Service**: Task and project management features

## Tech Stack

- **Language**: Go
- **Databases**:
  - MySQL 5.7 (Primary data store)
  - Redis (Caching and session management)
  - MongoDB (Message and social data)
  - Elasticsearch (Search functionality)
- **Message Queue**: Kafka
- **Service Discovery**: etcd
- **Monitoring & Observability**:
  - Jaeger (Distributed tracing)
  - Prometheus (Metrics)
  - Grafana (Visualization)
  - Kibana (Log analysis)
  - pprof (Performance profiling)

## Prerequisites

- Go 1.21 or later
- Docker and Docker Compose
- Make
- golangci-lint

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd example
   ```

2. **Set up environment**

   ```bash
   # Start all required services
   make docker-compose-up
   ```

3. **Build services**

   ```bash
   # Build all services
   make build

   # Build specific service
   make build-user
   ```

4. **Run tests**

   ```bash
   make test
   ```

## Development

### Project Structure

```
.
├── apps/
│   ├── user/       # User management service
│   ├── social/     # Social networking service
│   ├── im/         # Instant messaging service
│   └── task/       # Task management service
├── components/     # Infrastructure components
├── script/        # Setup and utility scripts
└── docker-compose.yml
```

### Common Commands

```bash
# Start all services
make docker-compose-up

# Stop all services
make docker-compose-down

# Run linter
make lint

# Clean build artifacts
make clean
```

### Performance Testing

The project includes comprehensive performance testing tools:

```bash
# Run benchmarks for a service
make bench-user

# Generate and view CPU profile
make pprof-cpu-user

# Generate and view memory profile
make pprof-mem-user

# Generate flame graph
make flame-graph-user
```

### CI/CD

The project uses GitHub Actions for CI/CD:

- **CI Pipeline**: Triggered on push to main/master and pull requests
  - Runs tests
  - Performs linting
  - Builds services

- **CD Pipeline**: Triggered on version tags (v*)
  - Builds Docker images
  - Pushes to registry
  - Deploys to production

## Configuration

### Environment Variables

- `DOCKER_REGISTRY`: Docker registry URL
- `MYSQL_ROOT_PASSWORD`: MySQL root password
- `MONGO_INITDB_ROOT_USERNAME`: MongoDB root username
- `MONGO_INITDB_ROOT_PASSWORD`: MongoDB root password

### Ports

- User Service: 8080
- Social Service: 8081
- IM Service: 8082
- Task Service: 8083
- MySQL: 13306
- Redis: 16379
- MongoDB: 47017
- Elasticsearch: 9200
- Kibana: 5601
- Jaeger UI: 16686
- Prometheus: 9090
- Grafana: 3000

## Monitoring and Profiling

### Metrics and Dashboards

- Grafana: <http://localhost:3000>
- Prometheus: <http://localhost:9090>
- Kibana: <http://localhost:5601>
- Jaeger: <http://localhost:16686>

### Performance Profiling

- pprof UI: <http://localhost:6060/debug/pprof/>
- Flame Graphs: Generated in service directories

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests and linting (`make test lint`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/yourusername/example](https://github.com/yourusername/example)
