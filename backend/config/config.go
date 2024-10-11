package config

import (
	"log"

	"github.com/joho/godotenv"
)

// LoadEnvVariables loads the environment variables from the .env file.
func LoadEnvVariables(filePath string) error {
	err := godotenv.Load(filePath)
	if err != nil {
		log.Println("Error loading .env file")
		return err
	}
	log.Println("Environment variables loaded successfully!")
	return nil
}
