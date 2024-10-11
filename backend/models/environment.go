package models

// Environment represents the schema of the environment table.
type Environment struct {
	ID          int     `json:"id"`
	Timestamp   int     `json:"timestamp"`
	Location    string  `json:"location"`
	PM25        float64 `json:"pm2_5"`
	Temperature float64 `json:"temperature"`
	Weather     string  `json:"weather"`
	WindSpeed   float64 `json:"wind_speed"`
	Rain        float64 `json:"rain"`
}
