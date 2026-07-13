.PHONY: install run build test dev

install:
	go mod download
	go mod tidy

run:
	go run main.go

dev:
	go run main.go

build:
	go build -o bin/cornerstone-backend main.go

test:
	go test ./...

clean:
	rm -rf bin/

help:
	@echo "Available commands:"
	@echo "  make install  - Download dependencies"
	@echo "  make run      - Run the server"
	@echo "  make build    - Build binary"
	@echo "  make test     - Run tests"
	@echo "  make clean    - Clean build artifacts"
