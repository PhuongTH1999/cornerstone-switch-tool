package config

import (
	"os"
)

type Config struct {
	Port                string
	SupabaseURL         string
	SupabaseKey         string
	SupabaseServiceRole string
	GoogleClientID      string
	GoogleClientSecret  string
	JWTSecret           string
	FrontendURL         string
	Environment         string
}

func NewConfig() *Config {
	return &Config{
		Port:                getEnv("PORT", "8080"),
		SupabaseURL:         getEnv("SUPABASE_URL", "https://cnwxfakyfdmlvdmkknvp.supabase.co"),
		SupabaseKey:         getEnv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNud3hmYWt5ZmRtbHZkbWtrbnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NzcwODMsImV4cCI6MjA5OTA1MzA4M30.vVBHBkw-yQlm1TRj08b2vp63d00fHMV8c3AAc5Gr490"),
		SupabaseServiceRole: getEnv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNud3hmYWt5ZmRtbHZkbWtrbnZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ3NzA4MywiZXhwIjoyMDk5MDUzMDgzfQ.pEEdTidwvXGf8bAd2vo-mxOohOKkp8XWRZahiI47jVQ"),
		GoogleClientID:      getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:  getEnv("GOOGLE_CLIENT_SECRET", ""),
		JWTSecret:           getEnv("JWT_SECRET", "change-me-in-production"),
		FrontendURL:         getEnv("FRONTEND_URL", "http://localhost:5173"),
		Environment:         getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
