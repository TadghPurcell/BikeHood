package handlers

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetLatestEnvironmentData(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Updated query with pm2.5 properly wrapped using backticks
		query := `
			SELECT timestamp, ` + "`pm2.5`" + `, location, temperature, weather, wind_speed, rain
			FROM environment
			ORDER BY timestamp DESC
			LIMIT 1;
		`

		row := db.QueryRow(query)

		var timestamp int
		var pm25, temperature, windSpeed, rain float64
		var location, weather string

		err := row.Scan(&timestamp, &pm25, &location, &temperature, &weather, &windSpeed, &rain)
		if err != nil {
			log.Printf("Error fetching latest environment data: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch latest environment data"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"timestamp":   timestamp,
			"pm2_5":       pm25,
			"location":    location,
			"temperature": temperature,
			"weather":     weather,
			"wind_speed":  windSpeed,
			"rain":        rain,
		})
	}
}
