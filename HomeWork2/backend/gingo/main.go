package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// ─── Domain ──────────────────────────────────────────────────────────────────

type User struct {
	ID            int64  `json:"id"`
	Username      string `json:"username"`
	DisplayName   string `json:"display_name"`
	FavoriteGenre string `json:"favorite_genre"`
}

// ─── Requests ──────────────────────────────────────────────────────────────────

type RegisterRequest struct {
	Username    string `json:"username"     binding:"required"`
	Password    string `json:"password"     binding:"required"`
	DisplayName string `json:"display_name"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type UpdateRequest struct {
	DisplayName   string `json:"display_name"`
	FavoriteGenre string `json:"favorite_genre"`
}

// ─── Globals ─────────────────────────────────────────────────────────────────

var (
	db     *pgxpool.Pool
	secret = []byte(mustEnv("JWT_SECRET"))
)

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required environment variable %s is not set", key)
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

func generateToken(userID int64) (string, error) {
	claims := jwt.MapClaims{
		"sub": strconv.FormatInt(userID, 10),
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret)
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return secret, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		claims, _ := token.Claims.(jwt.MapClaims)
		c.Set("userID", claims["sub"].(string))
		c.Next()
	}
}

// ownerOnly returns the int64 id if the JWT subject matches the URL :id param.
func ownerOnly(c *gin.Context) (int64, bool) {
	paramID := c.Param("id")
	jwtID := c.GetString("userID")
	if paramID != jwtID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return 0, false
	}
	id, err := strconv.ParseInt(paramID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return 0, false
	}
	return id, true
}

// ─── Handlers ────────────────────────────────────────────────────────────────

// POST /register
func registerHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
		return
	}

	var id int64
	err = db.QueryRow(c.Request.Context(),
		`INSERT INTO users (username, password_hash, display_name)
		 VALUES ($1, $2, $3) RETURNING id`,
		req.Username, string(hash), req.DisplayName,
	).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			c.JSON(http.StatusConflict, gin.H{"error": "username already taken"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "username": req.Username})
}

// POST /login
func loginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	var passwordHash string
	err := db.QueryRow(c.Request.Context(),
		`SELECT id, username, password_hash, display_name, favorite_genre
		 FROM users WHERE username = $1`,
		req.Username,
	).Scan(&user.ID, &user.Username, &passwordHash, &user.DisplayName, &user.FavoriteGenre)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := generateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

// GET /users/:id
func getUserHandler(c *gin.Context) {
	id, ok := ownerOnly(c)
	if !ok {
		return
	}

	var user User
	err := db.QueryRow(c.Request.Context(),
		`SELECT id, username, display_name, favorite_genre FROM users WHERE id = $1`, id,
	).Scan(&user.ID, &user.Username, &user.DisplayName, &user.FavoriteGenre)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// PUT /users/:id
func updateUserHandler(c *gin.Context) {
	id, ok := ownerOnly(c)
	if !ok {
		return
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	err := db.QueryRow(c.Request.Context(),
		`UPDATE users
		 SET display_name   = CASE WHEN $2 <> '' THEN $2 ELSE display_name END,
		     favorite_genre = CASE WHEN $3 <> '' THEN $3 ELSE favorite_genre END
		 WHERE id = $1
		 RETURNING id, username, display_name, favorite_genre`,
		id, req.DisplayName, req.FavoriteGenre,
	).Scan(&user.ID, &user.Username, &user.DisplayName, &user.FavoriteGenre)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// DELETE /users/:id
func deleteUserHandler(c *gin.Context) {
	id, ok := ownerOnly(c)
	if !ok {
		return
	}

	tag, err := db.Exec(c.Request.Context(), `DELETE FROM users WHERE id = $1`, id)
	if err != nil || tag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "account deleted"})
}

// ─── Main ─────────────────────────────────────────────────────────────────────

func main() {
	dsn := mustEnv("DATABASE_URL")
	port := getEnv("PORT", "8080")

	ctx := context.Background()

	var err error
	// Retry connecting to Postgres for up to 30 seconds (useful in Docker)
	for i := range 6 {
		db, err = pgxpool.New(ctx, dsn)
		if err == nil {
			if pingErr := db.Ping(ctx); pingErr == nil {
				break
			}
			db.Close()
		}
		log.Printf("waiting for postgres… attempt %d/6", i+1)
		time.Sleep(5 * time.Second)
	}
	if err != nil {
		log.Fatalf("cannot connect to postgres: %v", err)
	}
	defer db.Close()
	log.Println("connected to postgres")

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	r.POST("/register", registerHandler)
	r.POST("/login", loginHandler)

	protected := r.Group("/users")
	protected.Use(authMiddleware())
	{
		protected.GET("/:id", getUserHandler)
		protected.PUT("/:id", updateUserHandler)
		protected.DELETE("/:id", deleteUserHandler)
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
