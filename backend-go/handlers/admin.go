package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"cornerstone-backend/config"
	"cornerstone-backend/models"
)

type AdminHandler struct {
	db  *config.SupabaseClient
	cfg *config.Config
}

func NewAdminHandler(db *config.SupabaseClient, cfg *config.Config) *AdminHandler {
	return &AdminHandler{db: db, cfg: cfg}
}

// GetManagedUsers returns users managed by the owner
func (h *AdminHandler) GetManagedUsers(c *gin.Context) {
	ownerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, exists := c.Get("user_role")
	if !exists || userRole != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owners can manage users"})
		return
	}

	// TODO: Query user_roles table to get managed users
	// For now, return empty list
	c.JSON(http.StatusOK, gin.H{
		"owner_id": ownerID,
		"users":    []interface{}{},
	})
}

// UpdateUserRole updates a user's role (only owner can do this)
func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, exists := c.Get("user_role")
	if !exists || userRole != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owners can manage users"})
		return
	}

	var req struct {
		UserID  string `json:"user_id" binding:"required"`
		NewRole string `json:"new_role" binding:"required"` // admin or guest
		Notes   string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.NewRole != "admin" && req.NewRole != "guest" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be 'admin' or 'guest'"})
		return
	}

	// TODO: Insert or update user_roles table
	// For now, return success
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("User %s role updated to %s", req.UserID, req.NewRole),
	})
}

// GetAllUsers returns all users (only owner can access)
func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	fmt.Println("[DEBUG] GetAllUsers called")

	userID, exists := c.Get("user_id")
	if !exists {
		fmt.Println("[DEBUG] No user_id in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	fmt.Printf("[DEBUG] user_id: %v\n", userID)

	userRole, exists := c.Get("user_role")
	if !exists {
		fmt.Println("[DEBUG] No user_role in context")
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owners can view all users"})
		return
	}

	fmt.Printf("[DEBUG] user_role: %v (type: %T)\n", userRole, userRole)

	// Type assert to string
	role, ok := userRole.(string)
	if !ok || role != "owner" {
		fmt.Printf("[DEBUG] Not owner: ok=%v, role=%v\n", ok, role)
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owners can view all users"})
		return
	}

	fmt.Println("[DEBUG] Calling queryAllUsers...")
	// Query all users from database
	users, err := h.queryAllUsers()
	if err != nil {
		fmt.Printf("[DEBUG] queryAllUsers error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	fmt.Printf("[DEBUG] Got %d users\n", len(users))
	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

// Helper: query all users from Supabase
func (h *AdminHandler) queryAllUsers() ([]models.User, error) {
	url := fmt.Sprintf("%s/rest/v1/users?select=*", h.db.URL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+h.db.ServiceKey)
	req.Header.Set("apikey", h.db.ServiceKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Debug log
	fmt.Printf("[DEBUG] Supabase response status: %d\n", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		// Try to read error response
		var errBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errBody)
		fmt.Printf("[DEBUG] Error response: %v\n", errBody)
		return []models.User{}, fmt.Errorf("supabase returned status %d", resp.StatusCode)
	}

	var users []models.User
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	fmt.Printf("[DEBUG] Successfully fetched %d users\n", len(users))
	return users, nil
}
