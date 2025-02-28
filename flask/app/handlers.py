from flask import jsonify, request
import json
from app.database import db
import logging
from sqlalchemy.sql import text
from math import floor
from websocket import create_connection
from app.websocket import socketio
import time

SUMO_WEBSOCKET_URL = "ws://localhost:5678"

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
    
def get_traffic_data_past_24h():
    """
    Returns ~24 data points for the 'past 24 hours' of traffic data 
    (relative to the latest timestamp in 'tomtom'),
    aggregated by hour. Summarizes across all roads as avg_traffic.
    """
    try:
        # 1) Max timestamp 
        max_ts_query = "SELECT MAX(timestamp) AS max_ts FROM tomtom;"
        with db.engine.connect() as connection:
            max_ts_result = connection.execute(text(max_ts_query)).fetchone()

        if not max_ts_result or not max_ts_result.max_ts:
            return jsonify([]), 200

        max_ts = max_ts_result.max_ts
        start_time = max_ts - 86400

        # 2) Group by hour, average across 9 columns for a single 'avg_traffic'
        query = """
            SELECT 
                FLOOR(timestamp / 3600) * 3600 AS hour_ts,
                AVG(
                  (ongar_distributor_road 
                   + littleplace_castleheaney_distributor_road_south
                   + main_street
                   + the_mall
                   + station_road
                   + ongar_distributor_road_east
                   + ongar_barnhill_distributor_road
                   + littleplace_castleheaney_distributor_road_north
                   + the_avenue
                  ) / 9
                ) AS avg_traffic
            FROM tomtom
            WHERE timestamp BETWEEN :start_time AND :end_time
            GROUP BY hour_ts
            ORDER BY hour_ts ASC;
        """

        with db.engine.connect() as connection:
            rows = connection.execute(
                text(query),
                {"start_time": start_time, "end_time": max_ts}
            ).fetchall()

        data = []
        for row in rows:
            data.append({
                "hour_ts": row.hour_ts,
                "avg_traffic": round(row.avg_traffic or 0, 2),
            })

        return jsonify(data), 200

    except Exception as e:
        logging.error(f"Error fetching traffic data 24h: {e}")
        return jsonify({"error": "Failed"}), 500
    
def traffic_roads_hourly():
    """
    Returns one row per hour, with the average traffic for each road.
    """
    try:
        # 1) Get max timestamp to find the last 24h 
        max_ts_query = "SELECT MAX(timestamp) AS max_ts FROM tomtom;"
        with db.engine.connect() as conn:
            max_ts_result = conn.execute(text(max_ts_query)).fetchone()

        if not max_ts_result or not max_ts_result.max_ts:
            return jsonify([]), 200 

        max_ts = max_ts_result.max_ts
        start_ts = max_ts - 86400  

        # 2) Group by hour_ts, average each road
        query = """
            SELECT
              FLOOR(timestamp / 3600) * 3600 AS hour_ts,
              AVG(ongar_distributor_road) AS ongar_distributor_road,
              AVG(littleplace_castleheaney_distributor_road_south) AS littleplace_castleheaney_distributor_road_south,
              AVG(main_street) AS main_street,
              AVG(the_mall) AS the_mall,
              AVG(station_road) AS station_road,
              AVG(ongar_distributor_road_east) AS ongar_distributor_road_east,
              AVG(ongar_barnhill_distributor_road) AS ongar_barnhill_distributor_road,
              AVG(littleplace_castleheaney_distributor_road_north) AS littleplace_castleheaney_distributor_road_north,
              AVG(the_avenue) AS the_avenue
            FROM tomtom
            WHERE timestamp BETWEEN :start_ts AND :end_ts
            GROUP BY hour_ts
            ORDER BY hour_ts ASC;
        """

        with db.engine.connect() as conn:
            rows = conn.execute(
                text(query),
                {"start_ts": start_ts, "end_ts": max_ts}
            ).fetchall()

        # 3) Convert to list of dicts
        data = []
        for row in rows:
            data.append({
                "hour_ts": row.hour_ts,
                "ongar_distributor_road": round(row.ongar_distributor_road or 0, 2),
                "littleplace_castleheaney_distributor_road_south": round(row.littleplace_castleheaney_distributor_road_south or 0, 2),
                "main_street": round(row.main_street or 0, 2),
                "the_mall": round(row.the_mall or 0, 2),
                "station_road": round(row.station_road or 0, 2),
                "ongar_distributor_road_east": round(row.ongar_distributor_road_east or 0, 2),
                "ongar_barnhill_distributor_road": round(row.ongar_barnhill_distributor_road or 0, 2),
                "littleplace_castleheaney_distributor_road_north": round(row.littleplace_castleheaney_distributor_road_north or 0, 2),
                "the_avenue": round(row.the_avenue or 0, 2),
            })

        return jsonify(data), 200

    except Exception as e:
        logging.error(f"Error in traffic_roads_hourly: {e}")
        return jsonify({"error": "Failed"}), 500
    
def traffic_one_road_hourly(road_name):
    """
    Returns hourly aggregated data (average) for the specified road_name
    over the last 24 hours.
    """

    valid_roads = {
        "ongar_distributor_road",
        "littleplace_castleheaney_distributor_road_south",
        "main_street",
        "the_mall",
        "station_road",
        "ongar_distributor_road_east",
        "ongar_barnhill_distributor_road",
        "littleplace_castleheaney_distributor_road_north",
        "the_avenue",
    }

    try:
        # 1) Check if road_name is valid to avoid SQL injection
        if road_name not in valid_roads:
            return jsonify({"error": f"Invalid road name: {road_name}"}), 400

        # 2) Find the maximum timestamp in tomtom
        max_ts_query = "SELECT MAX(timestamp) AS max_ts FROM tomtom;"
        with db.engine.connect() as connection:
            max_ts_result = connection.execute(text(max_ts_query)).fetchone()

        if not max_ts_result or not max_ts_result.max_ts:
            return jsonify([]), 200  

        max_ts = max_ts_result.max_ts
        start_ts = max_ts - 86400  

        # 3) Construct the aggregator query with the chosen column
        query = f"""
            SELECT
              FLOOR(timestamp / 3600) * 3600 AS hour_ts,
              AVG({road_name}) AS avg_value
            FROM tomtom
            WHERE timestamp BETWEEN :start_ts AND :end_ts
            GROUP BY hour_ts
            ORDER BY hour_ts ASC;
        """

        with db.engine.connect() as connection:
            rows = connection.execute(
                text(query),
                {"start_ts": start_ts, "end_ts": max_ts}
            ).fetchall()

        # 4) Convert rows to a list of dicts
        data = []
        for row in rows:
            data.append({
                "hour_ts": row.hour_ts,
                "avg_value": round(row.avg_value or 0, 2),
            })

        return jsonify(data), 200

    except Exception as e:
        logging.error(f"Error in traffic_one_road_hourly: {e}")
        return jsonify({"error": "Failed to fetch one road data"}), 500
     
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
    
def get_environment_data_past_24h():
    """
    Returns ~24 data points for the 'past 24 hours' of environment data, 
    relative to the *latest* timestamp in the environment table.
    Each point = average PM2.5 for that hour.
    """
    try:
        # 1) Find the max timestamp 
        max_ts_query = "SELECT MAX(timestamp) AS max_ts FROM environment;"
        with db.engine.connect() as connection:
            max_ts_result = connection.execute(text(max_ts_query)).fetchone()

        if not max_ts_result or not max_ts_result.max_ts:
            # If the table is empty, return an empty list
            return jsonify([]), 200

        max_ts = max_ts_result.max_ts 
        start_time = max_ts - 86400   

        # 2) Group by hour (3600s). 
        #    For each hour, compute average PM2.5
        query = """
            SELECT
                FLOOR(timestamp / 3600) * 3600 AS hour_ts,
                AVG(`pm2.5`) AS avg_pm25
            FROM environment
            WHERE timestamp BETWEEN :start_time AND :end_time
            GROUP BY hour_ts
            ORDER BY hour_ts ASC;
        """

        with db.engine.connect() as connection:
            rows = connection.execute(
                text(query),
                {"start_time": start_time, "end_time": max_ts}
            ).fetchall()

        # 3) Convert rows to a list of dicts
        data = []
        for row in rows:
            data.append({
                "hour_ts": row.hour_ts,
                "avg_pm25": round(row.avg_pm25 or 0, 2),
            })

        return jsonify(data), 200

    except Exception as e:
        logging.error(f"Error fetching environment data 24h: {e}")
        return jsonify({"error": "Failed"}), 500
    
def get_noise_data_past_24h():
    """
    Returns ~24 data points for the 'past 24 hours' of noise data 
    (relative to the latest timestamp in 'noisepollution'),
    aggregated by hour for laeq.
    """
    print("DEBUG: DB engine URL =", db.engine.url)

    try:
        # 1) Max timestamp
        max_ts_query = "SELECT MAX(timestamp) AS max_ts FROM noisepollution;"
        with db.engine.connect() as connection:
            max_ts_result = connection.execute(text(max_ts_query)).fetchone()

        if not max_ts_result or not max_ts_result.max_ts:
            return jsonify([]), 200

        max_ts = max_ts_result.max_ts
        start_time = max_ts - 86400
        
        print("DEBUG: noise_24h -> max_ts =", max_ts)
        print("DEBUG: noise_24h -> start_time =", start_time)

        # 2) Aggregated by hour: laeq
        query = """
            SELECT
                FLOOR(timestamp / 3600) * 3600 AS hour_ts,
                AVG(laeq) AS avg_laeq
            FROM noisepollution
            WHERE timestamp BETWEEN :start_time AND :end_time
            GROUP BY hour_ts
            ORDER BY hour_ts ASC;
        """
        print("DEBUG: noise_24h -> query:\n", query)

        with db.engine.connect() as connection:
            rows = connection.execute(
                text(query),
                {"start_time": start_time, "end_time": max_ts}
            ).fetchall()
            
            print("DEBUG: noise_24h -> aggregator rows count =", len(rows))
        for i, row in enumerate(rows):
            print(f"Row #{i}: hour_ts={row.hour_ts}, avg_laeq={row.avg_laeq}")

        data = []
        for row in rows:
            data.append({
                "hour_ts": row.hour_ts,
                "avg_laeq": round(row.avg_laeq or 0, 2),
            })

        return jsonify(data), 200

    except Exception as e:
        logging.error(f"Error fetching noise data 24h: {e}")
        return jsonify({"error": "Failed"}), 500
    
def compare_traffic_noise():
    """
    Returns an array of { hour_ts, avg_traffic, avg_laeq } 
    covering the last 24 hours.
    """
    try:
        conn = db.engine.connect()

        # 1) Find max timestamp in both tables
        max_ts_tomtom = conn.execute(text("SELECT MAX(timestamp) FROM tomtom")).fetchone()[0]
        max_ts_noise = conn.execute(text("SELECT MAX(timestamp) FROM noisepollution")).fetchone()[0]

        if not max_ts_tomtom or not max_ts_noise:
            conn.close()
            return jsonify([]), 200

        max_ts = min(max_ts_tomtom, max_ts_noise)
        start_ts = max_ts - 86400  

        # 2) Aggregator: Traffic 
        traffic_query = """
            SELECT 
              FLOOR(timestamp / 3600)*3600 AS hour_ts,
              AVG(
                (ongar_distributor_road 
                 + littleplace_castleheaney_distributor_road_south
                 + main_street
                 + the_mall
                 + station_road
                 + ongar_distributor_road_east
                 + ongar_barnhill_distributor_road
                 + littleplace_castleheaney_distributor_road_north
                 + the_avenue
                )/9
              ) AS avg_traffic
            FROM tomtom
            WHERE timestamp BETWEEN :start_ts AND :end_ts
            GROUP BY hour_ts
        """

        traffic_rows = conn.execute(
            text(traffic_query),
            {"start_ts": start_ts, "end_ts": max_ts}
        ).fetchall()

        # Convert traffic data into a dict keyed by hour_ts
        traffic_dict = {}
        for row in traffic_rows:
            traffic_dict[row.hour_ts] = row.avg_traffic or 0

        # 3) Aggregator: Noise
        noise_query = """
            SELECT
              FLOOR(timestamp / 3600)*3600 AS hour_ts,
              AVG(laeq) AS avg_laeq
            FROM noisepollution
            WHERE timestamp BETWEEN :start_ts AND :end_ts
            GROUP BY hour_ts
        """

        noise_rows = conn.execute(
            text(noise_query),
            {"start_ts": start_ts, "end_ts": max_ts}
        ).fetchall()

        # Converting noise data into a dict keyed by hour_ts
        noise_dict = {}
        for row in noise_rows:
            noise_dict[row.hour_ts] = row.avg_laeq or 0

        conn.close()

        # 4) Merge traffic_dict & noise_dict
        all_hours = set(traffic_dict.keys()) | set(noise_dict.keys())
        merged = []
        for hour in sorted(all_hours):
            merged.append({
                "hour_ts": hour,
                "avg_traffic": round(traffic_dict.get(hour, 0), 2),
                "avg_laeq": round(noise_dict.get(hour, 0), 2),
            })

        return jsonify(merged), 200

    except Exception as e:
        logging.error(f"Error comparing traffic & noise: {e}")
        return jsonify({"error": str(e)}), 500
    
def compare_traffic_pm25():
    """
    Returns an array of { hour_ts, avg_traffic, avg_pm25 }
    for the last 24 hours. 
    """
    try:
        conn = db.engine.connect()

        # 1) get max_ts from tomtom & environment
        max_ts_traffic = conn.execute(text("SELECT MAX(timestamp) FROM tomtom")).fetchone()[0]
        max_ts_env = conn.execute(text("SELECT MAX(timestamp) FROM environment")).fetchone()[0]

        if not max_ts_traffic or not max_ts_env:
            conn.close()
            return jsonify([]), 200

        # pick the minimum max_ts so the last 24h is valid for both
        max_ts = min(max_ts_traffic, max_ts_env)
        start_ts = max_ts - 86400

        # 2) aggregator for traffic
        traffic_query = """
            SELECT
              FLOOR(timestamp / 3600)*3600 AS hour_ts,
              AVG(
                (ongar_distributor_road 
                 + littleplace_castleheaney_distributor_road_south
                 + main_street
                 + the_mall
                 + station_road
                 + ongar_distributor_road_east
                 + ongar_barnhill_distributor_road
                 + littleplace_castleheaney_distributor_road_north
                 + the_avenue
                ) / 9
              ) AS avg_traffic
            FROM tomtom
            WHERE timestamp BETWEEN :start_ts AND :end_ts
            GROUP BY hour_ts
        """
        traffic_rows = conn.execute(
            text(traffic_query), 
            {"start_ts": start_ts, "end_ts": max_ts}
        ).fetchall()
        traffic_dict = {
            row.hour_ts: row.avg_traffic or 0
            for row in traffic_rows
        }

        # 3) aggregator for pm2.5
        env_query = """
            SELECT
              FLOOR(timestamp / 3600)*3600 AS hour_ts,
              AVG(`pm2.5`) AS avg_pm25
            FROM environment
            WHERE timestamp BETWEEN :start_ts AND :end_ts
            GROUP BY hour_ts
        """
        env_rows = conn.execute(
            text(env_query),
            {"start_ts": start_ts, "end_ts": max_ts}
        ).fetchall()
        conn.close()

        env_dict = {
            row.hour_ts: row.avg_pm25 or 0
            for row in env_rows
        }

        # 4) merge by hour_ts
        all_hours = set(traffic_dict.keys()) | set(env_dict.keys())
        merged = []
        for hour in sorted(all_hours):
            merged.append({
                "hour_ts": hour,
                "avg_traffic": round(traffic_dict.get(hour, 0), 2),
                "avg_pm25": round(env_dict.get(hour, 0), 2),
            })

        return jsonify(merged), 200

    except Exception as e:
        logging.error(f"Error comparing traffic & pm2.5: {e}")
        return jsonify({"error": str(e)}), 500

@socketio.on("add_bike")
def handle_add_bike(message):
    try:
        data = json.loads(message)
        print("Received add_bike command:", data)
        ws = create_connection(SUMO_WEBSOCKET_URL)
        ws.send(message)
        response = ws.recv()
        ws.close()
        # Emit the response back to the frontend
        socketio.emit("bike_added", response)
    except Exception as e:
        print("Error forwarding command:", e)
        socketio.emit("error", json.dumps({"message": str(e)}))
