from flask import jsonify
from app.database import db
import logging
from sqlalchemy.sql import text


def get_latest_environment_data():
    try:
        # Query to fetch the latest environment data
        query = """
            SELECT timestamp, `pm2.5` AS pm2_5, location, temperature, weather, wind_speed, rain
            FROM environment
            ORDER BY timestamp DESC
            LIMIT 1;
        """

        # Execute the query using a connection
        with db.engine.connect() as connection:
            result = connection.execute(text(query)).fetchone()

        # If no results are found
        if result is None:
            return jsonify({"error": "No environment data found"}), 404

        # Map the result to variables
        timestamp, pm25, location, temperature, weather, wind_speed, rain = result

        # Return the result as JSON
        return jsonify({
            "timestamp": timestamp,
            "pm2_5": pm25,
            "location": location,
            "temperature": temperature,
            "weather": weather,
            "wind_speed": wind_speed,
            "rain": rain
        }), 200

    except Exception as e:
        logging.error(f"Error fetching latest environment data: {e}")
        return jsonify({"error": "Failed to fetch latest environment data"}), 500