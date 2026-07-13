package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"cornerstone-backend/config"
	"cornerstone-backend/handlers"
	"cornerstone-backend/middleware"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}
}

func main() {
	// Load config
	cfg := config.NewConfig()

	// Initialize Supabase client
	supabaseClient := config.NewSupabaseClient(cfg)

	// Setup Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// Public routes
	authHandler := handlers.NewAuthHandler(supabaseClient, cfg)
	public := router.Group("/api/auth")
	{
		public.POST("/login", authHandler.Login)
		public.POST("/register", authHandler.Register)
		public.POST("/google-callback", authHandler.GoogleCallback)
		public.POST("/refresh-token", authHandler.RefreshToken)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/user", authHandler.GetUser)
		protected.POST("/logout", authHandler.Logout)
	}

	// Admin routes (owner only)
	adminHandler := handlers.NewAdminHandler(supabaseClient, cfg)
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware())
	{
		admin.GET("/users", adminHandler.GetAllUsers)
		admin.GET("/managed-users", adminHandler.GetManagedUsers)
		admin.POST("/update-user-role", adminHandler.UpdateUserRole)
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Server running on http://localhost:%s\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
