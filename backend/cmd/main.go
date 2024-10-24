package main

import (
	"bikehood-backend/database"
	"bikehood-backend/routes"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	err := godotenv.Load(".env") // Ensure the path to the .env file is correct
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	// Connect to the database
	db, err := database.ConnectDB()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	log.Println("Connected to the local database successfully!")

	// Setting up Gin server
	router := gin.Default()

	// Enable CORS to handle cross-origin requests from your frontend
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"} // You can specify specific origins here for better security
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}

	router.Use(cors.New(config))

	// Setup routes
	routes.SetupRoutes(router, db)

	// Start the server on port 8080
	port := ":8080"
	log.Printf("Server is running on port %s", port)
	router.Run(port)
}
