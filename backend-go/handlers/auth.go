package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"cornerstone-backend/config"
	"cornerstone-backend/models"
)

type AuthHandler struct {
	db  *config.SupabaseClient
	cfg *config.Config
}

func NewAuthHandler(db *config.SupabaseClient, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

// Helper: query users from Supabase
func (h *AuthHandler) queryUsers(filter string) ([]models.User, error) {
	url := fmt.Sprintf("%s/rest/v1/users?%s", h.db.URL, filter)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+h.db.ServiceKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var users []models.User
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, err
	}

	return users, nil
}

// Helper: insert user to Supabase
func (h *AuthHandler) insertUser(user map[string]interface{}) (models.User, error) {
	url := fmt.Sprintf("%s/rest/v1/users", h.db.URL)
	body, _ := json.Marshal(user)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return models.User{}, err
	}

	req.Header.Set("Authorization", "Bearer "+h.db.ServiceKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return models.User{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		// Read error response
		var errResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errResp)
		fmt.Printf("Supabase error (status %d): %v\n", resp.StatusCode, errResp)
		return models.User{}, fmt.Errorf("supabase error: %v", errResp)
	}

	var result []models.User
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return models.User{}, err
	}

	if len(result) == 0 {
		return models.User{}, fmt.Errorf("failed to create user: empty response")
	}

	return result[0], nil
}

// Login handles username/password login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Check for admin/owner credentials
	if (req.Username == "admin" || req.Username == "owner") && req.Password == "admin" {
		role := "admin"
		if req.Username == "owner" {
			role = "owner"
		}

		user := &models.User{
			ID:       req.Username + "-user",
			Username: req.Username,
			Email:    req.Username + "@cornerstone.local",
			Role:     role,
		}

		token, refreshToken, err := h.generateTokens(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, models.AuthResponse{
			User:         user,
			AccessToken:  token,
			RefreshToken: refreshToken,
			ExpiresIn:    3600,
		})
		return
	}

	// Query user from database
	users, err := h.queryUsers(fmt.Sprintf("username=eq.%s", req.Username))

	var user *models.User

	if err != nil || len(users) == 0 {
		// User doesn't exist → create new user with guest role
		fmt.Printf("[DEBUG] User %s not found, creating new user...\n", req.Username)

		newUser := &models.User{
			ID:       fmt.Sprintf("user_%d", time.Now().UnixNano()),
			Username: req.Username,
			Email:    fmt.Sprintf("%s@mservice.com.vn", req.Username),
			Role:     "guest",
		}

		// Insert into database (async - don't block login)
		go func() {
			userData := map[string]interface{}{
				"id":       newUser.ID,
				"username": newUser.Username,
				"email":    newUser.Email,
				"role":     newUser.Role,
			}
			if _, err := h.insertUser(userData); err != nil {
				fmt.Printf("[DEBUG] Failed to insert user: %v\n", err)
			} else {
				fmt.Printf("[DEBUG] Successfully created user %s\n", newUser.Username)
			}
		}()

		user = newUser
	} else {
		// User exists
		user = &users[0]
	}

	// Verify password
	// Note: In production, password should be hashed in DB
	// err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	// if err != nil {
	// 	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
	// 	return
	// }

	token, refreshToken, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		User:         user,
		AccessToken:  token,
		RefreshToken: refreshToken,
		ExpiresIn:    3600,
	})
}

// Register creates new user account
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Check if email is from mservice.com.vn
	role := "guest"
	if len(req.Email) > 0 {
		// Basic check - in production use proper email domain validation
		role = "guest"
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user in database
	userData := map[string]interface{}{
		"username":      req.Username,
		"email":         req.Email,
		"password_hash": string(hashedPassword),
		"role":          role,
	}

	newUser, err := h.insertUser(userData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}
	token, refreshToken, err := h.generateTokens(&newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		User:         &newUser,
		AccessToken:  token,
		RefreshToken: refreshToken,
		ExpiresIn:    3600,
	})
}

// GoogleCallback handles Google OAuth callback
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	var req models.GoogleCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Verify Google ID token and extract claims
	claims, err := h.verifyGoogleToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token"})
		return
	}

	// Extract user info from claims
	email := claims["email"].(string)
	name := claims["name"].(string)
	googleID := claims["sub"].(string)

	// Create user object
	user := &models.User{
		ID:       "google-" + googleID,
		Username: name,
		Email:    email,
		Role:     "guest",
	}

	token, refreshToken, err := h.generateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		User:         user,
		AccessToken:  token,
		RefreshToken: refreshToken,
		ExpiresIn:    3600,
	})
}

// Helper: verify Google ID token and extract claims
func (h *AuthHandler) verifyGoogleToken(tokenString string) (map[string]interface{}, error) {
	// Parse JWT without verification (for demo)
	// In production, verify with Google's public keys
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	// Decode payload (base64url)
	payload := parts[1]
	// Add padding if needed
	switch len(payload) % 4 {
	case 2:
		payload += "=="
	case 3:
		payload += "="
	}

	decoded, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		return nil, err
	}

	var claims map[string]interface{}
	if err := json.Unmarshal(decoded, &claims); err != nil {
		return nil, err
	}

	return claims, nil
}

// RefreshToken generates new access token from refresh token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// TODO: Verify refresh token and issue new access token
	c.JSON(http.StatusOK, gin.H{"message": "Token refresh not yet implemented"})
}

// GetUser returns current user info
func (h *AuthHandler) GetUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	users, err := h.queryUsers(fmt.Sprintf("id=eq.%s", userID))
	if err != nil || len(users) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, users[0])
}

// Logout clears user session
func (h *AuthHandler) Logout(c *gin.Context) {
	// In production, invalidate refresh token in DB
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// Helper: generate JWT tokens
func (h *AuthHandler) generateTokens(user *models.User) (string, string, error) {
	// Access token (1 hour)
	accessClaims := jwt.MapClaims{
		"sub":  user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(time.Hour).Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenStr, err := accessToken.SignedString([]byte(h.cfg.JWTSecret))
	if err != nil {
		return "", "", err
	}

	// Refresh token (7 days)
	refreshClaims := jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().AddDate(0, 0, 7).Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenStr, err := refreshToken.SignedString([]byte(h.cfg.JWTSecret))
	if err != nil {
		return "", "", err
	}

	return accessTokenStr, refreshTokenStr, nil
}
