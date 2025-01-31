from flask import jsonify, request
from app.database import db
import logging
from sqlalchemy.sql import text
from math import floor


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
    
def get_historical_traffic_data(start_time, end_time):
    try:
        # Query to fetch the most representative traffic data point within the specified time range
        query = """
            SELECT timestamp, ongar_distributor_road, littleplace_castleheaney_distributor_road_south, 
                   main_street, the_mall, station_road, ongar_distributor_road_east, 
                   ongar_barnhill_distributor_road, littleplace_castleheaney_distributor_road_north, the_avenue
            FROM tomtom
            WHERE timestamp BETWEEN :start_time AND :end_time
            ORDER BY ABS(timestamp - :midpoint)  # Find the timestamp closest to the middle of the range
            LIMIT 1;
        """
        
        # Calculate the midpoint of the time range
        midpoint = (start_time + end_time) // 2
        
        # Execute the query using a connection
        with db.engine.connect() as connection:
            result = connection.execute(
                text(query), 
                {'start_time': start_time, 'end_time': end_time, 'midpoint': midpoint}
            ).fetchone()
            
        # If no results are found
        if result is None:
            return jsonify({"error": "No traffic data found for the specified time range"}), 404
        
        # Convert the result to a dictionary
        data = {
            "timestamp": result.timestamp,
            "ongar_distributor_road": result.ongar_distributor_road,
            "littleplace_castleheaney_distributor_road_south": result.littleplace_castleheaney_distributor_road_south,
            "main_street": result.main_street,
            "the_mall": result.the_mall,
            "station_road": result.station_road,
            "ongar_distributor_road_east": result.ongar_distributor_road_east,
            "ongar_barnhill_distributor_road": result.ongar_barnhill_distributor_road,
            "littleplace_castleheaney_distributor_road_north": result.littleplace_castleheaney_distributor_road_north,
            "the_avenue": result.the_avenue
        }
        
        return jsonify(data), 200
        
    except Exception as e:
        logging.error(f"Error fetching historical traffic data: {e}")
        return jsonify({"error": "Failed to fetch historical traffic data"}), 500
     
def get_historical_environment_data(start_time, end_time):
    try:
        # Query to fetch the most representative environment data point within the specified time range
        query = """
            SELECT timestamp, `pm2.5` AS pm2_5, location, temperature, weather, wind_speed, rain
            FROM environment
            WHERE timestamp BETWEEN :start_time AND :end_time
            ORDER BY ABS(timestamp - :midpoint)  # Find the timestamp closest to the middle of the range
            LIMIT 1;
        """
        
        # Calculate the midpoint of the time range
        midpoint = (start_time + end_time) // 2
        
        # Execute the query using a connection
        with db.engine.connect() as connection:
            result = connection.execute(
                text(query), 
                {'start_time': start_time, 'end_time': end_time, 'midpoint': midpoint}
            ).fetchone()
            
        # If no results are found
        if result is None:
            return jsonify({"error": "No environment data found for the specified time range"}), 404
        
        # Convert the result to a dictionary
        data = {
            "timestamp": result.timestamp,
            "pm2_5": result.pm2_5,
            "location": result.location,
            "temperature": result.temperature,
            "weather": result.weather,
            "wind_speed": result.wind_speed,
            "rain": result.rain
        }
        
        return jsonify(data), 200
        
    except Exception as e:
        logging.error(f"Error fetching historical environment data: {e}")
        return jsonify({"error": "Failed to fetch historical environment data"}), 500

def get_most_recent_hourly_pm25_average():
    try:
        # Query to find the most recent hour with data
        recent_hour_query = """
            SELECT 
                FLOOR(timestamp / 3600) * 3600 AS hour_timestamp
            FROM environment
            ORDER BY hour_timestamp DESC
            LIMIT 1;
        """

        # Execute the query to find the most recent hour with data
        with db.engine.connect() as connection:
            recent_hour_result = connection.execute(text(recent_hour_query)).fetchone()

        # If no recent hour is found in the database
        if not recent_hour_result or recent_hour_result.hour_timestamp is None:
            return jsonify({"error": "No PM 2.5 data available in the database"}), 404

        # Extract the most recent hour timestamp
        recent_hour = recent_hour_result.hour_timestamp
        start_time = recent_hour
        end_time = recent_hour + 3600  # Add one hour to get the end timestamp

        # Query to calculate the average PM 2.5 for the most recent hour
        avg_query = """
            SELECT 
                AVG(`pm2.5`) AS avg_pm25,
                COUNT(*) AS data_points
            FROM environment
            WHERE timestamp BETWEEN :start_time AND :end_time;
        """

        # Execute the query to calculate the average
        with db.engine.connect() as connection:
            avg_result = connection.execute(
                text(avg_query), 
                {'start_time': start_time, 'end_time': end_time}
            ).fetchone()

        # If no data points were found for the recent hour
        if not avg_result or avg_result.avg_pm25 is None:
            return jsonify({"error": "No PM 2.5 data found for the most recent hour with data"}), 404

        # Return the average and metadata
        return jsonify({
            "start_time": start_time,
            "end_time": end_time,
            "avg_pm25": round(avg_result.avg_pm25, 2),
            "data_points": avg_result.data_points
        }), 200

    except Exception as e:
        logging.error(f"Error fetching PM 2.5 average for the most recent hour with data: {e}")
        return jsonify({"error": "Failed to fetch PM 2.5 average"}), 500
    
def get_most_recent_daily_pm25_average():
    try:
        # Query to find the most recent day with data
        recent_day_query = """
            SELECT 
                FLOOR(timestamp / 86400) * 86400 AS day_timestamp
            FROM environment
            ORDER BY day_timestamp DESC
            LIMIT 1;
        """

        # Execute the query to find the most recent day with data
        with db.engine.connect() as connection:
            recent_day_result = connection.execute(text(recent_day_query)).fetchone()

        # If no recent day is found in the database
        if not recent_day_result or recent_day_result.day_timestamp is None:
            return jsonify({"error": "No PM 2.5 data available in the database"}), 404

        # Extract the most recent day timestamp
        recent_day = recent_day_result.day_timestamp
        start_time = recent_day  # Start of the day
        end_time = recent_day + 86400  # End of the day (24 hours in seconds)

        # Query to calculate the average PM 2.5 for the most recent day
        avg_query = """
            SELECT 
                AVG(`pm2.5`) AS avg_pm25,
                COUNT(*) AS data_points
            FROM environment
            WHERE timestamp BETWEEN :start_time AND :end_time;
        """

        # Execute the query to calculate the average
        with db.engine.connect() as connection:
            avg_result = connection.execute(
                text(avg_query), 
                {'start_time': start_time, 'end_time': end_time}
            ).fetchone()

        # If no data points were found for the recent day
        if not avg_result or avg_result.avg_pm25 is None:
            return jsonify({"error": "No PM 2.5 data found for the most recent day with data"}), 404

        # Return the average and metadata
        return jsonify({
            "start_time": start_time,
            "end_time": end_time,
            "avg_pm25": round(avg_result.avg_pm25, 2),
            "data_points": avg_result.data_points
        }), 200

    except Exception as e:
        logging.error(f"Error fetching PM 2.5 average for the most recent day with data: {e}")
        return jsonify({"error": "Failed to fetch PM 2.5 average"}), 500
    
def get_historical_hourly_pm25_average(timestamp):
    try:
        # Calculate the start and end times for the hour
        start_time = (timestamp // 3600) * 3600  # Start of the hour
        end_time = start_time + 3600  # End of the hour

        query = """
            SELECT 
                AVG(`pm2.5`) AS avg_pm25,
                COUNT(*) AS data_points
            FROM environment
            WHERE timestamp BETWEEN :start_time AND :end_time;
        """

        with db.engine.connect() as connection:
            result = connection.execute(
                text(query), 
                {"start_time": start_time, "end_time": end_time}
            ).fetchone()

        if not result or result.avg_pm25 is None:
            return jsonify({"error": "No PM2.5 data found for the specified hour"}), 404

        return jsonify({
            "hour_start": start_time,
            "hour_end": end_time,
            "avg_pm25": round(result.avg_pm25, 2),
            "data_points": result.data_points
        }), 200

    except Exception as e:
        logging.error(f"Error fetching historical hourly PM2.5 average: {e}")
        return jsonify({"error": "Failed to fetch historical hourly PM2.5 average"}), 500

    
def get_historical_daily_pm25_average(timestamp):
    try:
        # Calculate the start and end times for the day
        start_of_day = (timestamp // 86400) * 86400  # Start of the day
        end_of_day = start_of_day + 86400  # End of the day

        query = """
            SELECT 
                AVG(`pm2.5`) AS avg_pm25,
                COUNT(*) AS data_points
            FROM environment
            WHERE timestamp BETWEEN :start_time AND :end_time;
        """

        with db.engine.connect() as connection:
            result = connection.execute(
                text(query), 
                {"start_time": start_of_day, "end_time": end_of_day}
            ).fetchone()

        if not result or result.avg_pm25 is None:
            return jsonify({"error": "No PM2.5 data found for the specified day"}), 404

        return jsonify({
            "day_start": start_of_day,
            "day_end": end_of_day,
            "avg_pm25": round(result.avg_pm25, 2),
            "data_points": result.data_points
        }), 200

    except Exception as e:
        logging.error(f"Error fetching historical daily PM2.5 average: {e}")
        return jsonify({"error": "Failed to fetch historical daily PM2.5 average"}), 500
