FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY backend-go/go.mod backend-go/go.sum ./
RUN go mod download
COPY backend-go/ .
RUN CGO_ENABLED=0 GOOS=linux go build -o bin/cornerstone-backend main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/bin/cornerstone-backend .
EXPOSE 8080
CMD ["./cornerstone-backend"]
