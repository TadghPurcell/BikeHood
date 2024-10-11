package routes

import (
	"bikehood-backend/handlers"
	"database/sql"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, db *sql.DB) {
	router.GET("/api/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// New route to get the latest environment data
	router.GET("/api/environment/latest", handlers.GetLatestEnvironmentData(db))
}
