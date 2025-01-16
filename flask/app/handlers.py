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
    
def get_latest_traffic_data():
    try:
        # Query to fetch the latest traffic data
        query1 = """
            SELECT timestamp, ongar_distributor_road, littleplace_castleheaney_distributor_road_south, main_street, the_mall, station_road, ongar_distributor_road_east, ongar_barnhill_distributor_road, littleplace_castleheaney_distributor_road_north, the_avenue
            FROM tomtom
            ORDER BY timestamp DESC
            LIMIT 1;
            """
        
        # Execute the query using a connection
        with db.engine.connect() as connection:
            result = connection.execute(text(query1)).fetchone()
            
        # If no results are found
        if result is None:
            return jsonify({"error": "No traffic data found"}), 404
        
        # Map the result to variables
        timestamp, ongar_distributor_road, littleplace_castleheaney_distributor_road_south, main_street, the_mall, station_road, ongar_distributor_road_east, ongar_barnhill_distributor_road, littleplace_castleheaney_distributor_road_north, the_avenue = result
        
        # Return the result as JSON
        return jsonify({
            "timestamp": timestamp, 
            "ongar_distributor_road": ongar_distributor_road,
            "littleplace_castleheaney_distributor_road_south": littleplace_castleheaney_distributor_road_south,
            "main_street": main_street,
            "the_mall": the_mall,
            "station_road": station_road,
            "ongar_distributor_road_east": ongar_distributor_road_east,
            "ongar_barnhill_distributor_road": ongar_barnhill_distributor_road,
            "littleplace_castleheaney_distributor_road_north": littleplace_castleheaney_distributor_road_north,
            "the_avenue": the_avenue
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching latest traffic data: {e}")
        return jsonify({"error": "Failed to fetch latest traffic data"}), 500 
    
def get_latest_noise_data():
    try:
        # Query to fetch the latest noise pollution data
        query2 = """
            SELECT timestamp, datetime, laeq, lafmax, la10, la90, lceq, lcfmax, lc10, lc90
            FROM noisepollution
            ORDER BY timestamp DESC
            LIMIT 1;
        """
        
        # Execute the query using a connection
        with db.engine.connect() as connection:
            result = connection.execute(text(query2)).fetchone()
        
        # If no results are found
        if result is None:
            return jsonify({"error": "No noise pollution data found"}), 404
        
        # Map the result to variables
        (timestamp, datetime_value, laeq, lafmax, la10, la90, lceq, lcfmax, lc10, lc90) = result
        
        # Return the result as JSON
        return jsonify({
            "timestamp": timestamp, 
            "datetime": datetime_value.strftime('%Y-%m-%d %H:%M:%S'),  
            "laeq": laeq,
            "lafmax": lafmax,
            "la10": la10,
            "la90": la90,
            "lceq": lceq,
            "lcfmax": lcfmax,
            "lc10": lc10,
            "lc90": lc90
        }), 200
        
    except Exception as e:
        logging.error(f"Error fetching latest noise pollution data: {e}")
        return jsonify({"error": "Failed to fetch latest noise pollution data"}), 500