from flask import Blueprint, jsonify, request
from app.handlers import get_latest_environment_data
from app.handlers import get_latest_traffic_data
from app.handlers import get_latest_noise_data
from app.handlers import get_historical_traffic_data
from app.handlers import get_historical_environment_data
from app.handlers import get_most_recent_hourly_pm25_average
from app.handlers import get_most_recent_daily_pm25_average
from app.handlers import get_historical_hourly_pm25_average
from app.handlers import get_historical_daily_pm25_average
from app.handlers import get_environment_data_past_24h
from app.handlers import get_noise_data_past_24h
from app.handlers import get_traffic_data_past_24h
from app.handlers import traffic_roads_hourly
from app.handlers import traffic_one_road_hourly
from app.handlers import compare_traffic_noise
from app.handlers import compare_traffic_pm25
from datetime import datetime

# Create a Blueprint for the API routes
routes = Blueprint('routes', __name__)

# Health check endpoint
@routes.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({"message": "pong"}), 200

# Route to get the latest environment data
@routes.route('/api/environment/latest', methods=['GET'])
def get_latest_environment():
    return get_latest_environment_data()

@routes.route('/api/environment/historical', methods=['GET'])
def get_historical_environment():
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    
    # Validate input times
    if not start_time or not end_time:
        return jsonify({"error": "Start and end times are required"}), 400
    
    # Convert string times to Unix timestamps
    try:
        start_timestamp = int(start_time)
        end_timestamp = int(end_time)
    except ValueError:
        return jsonify({"error": "Invalid timestamp. Use Unix timestamp (seconds since epoch)"}), 400
    
    # Call the historical environment data handler function
    from app.handlers import get_historical_environment_data
    return get_historical_environment_data(start_timestamp, end_timestamp)

@routes.route("/api/environment/24h", methods=["GET"])
def environment_24h():
    return get_environment_data_past_24h()

# Route to get the latest traffic data
@routes.route('/api/traffic/latest', methods=['GET'])
def get_latest_traffic():
    return get_latest_traffic_data()

# Route to get historical traffic data
@routes.route('/api/traffic/historical', methods=['GET'])
def get_historical_traffic_data():
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    
    # Validate input times
    if not start_time or not end_time:
        return jsonify({"error": "Start and end times are required"}), 400
    
    # Convert string times to Unix timestamps
    try:
        start_timestamp = int(start_time)
        end_timestamp = int(end_time)
    except ValueError:
        return jsonify({"error": "Invalid timestamp. Use Unix timestamp (seconds since epoch)"}), 400
    
    # Call the historical traffic data handler function
    from app.handlers import get_historical_traffic_data
    return get_historical_traffic_data(start_timestamp, end_timestamp)

@routes.route("/api/traffic/24h", methods=["GET"])
def traffic_24h():
    return get_traffic_data_past_24h()

@routes.route("/api/traffic/roads/hourly", methods=["GET"])
def aggregate_traffic():
    return traffic_roads_hourly()

@routes.route("/api/traffic/one_road/<road_name>", methods=["GET"])
def single_road(road_name):
    return traffic_one_road_hourly(road_name)

@routes.route("/api/compare/traffic_noise", methods=["GET"])
def compare_t_n():
    return compare_traffic_noise()

@routes.route("/api/compare/traffic_pm25", methods=["GET"])
def compare_t_pm():
    return compare_traffic_pm25()

# Route to get the latest noise pollution data
@routes.route('/api/noise/latest', methods=['GET'])
def get_latest_noise():
    return get_latest_noise_data()

@routes.route("/api/noise/24h", methods=["GET"])
def noise_24h():
    return get_noise_data_past_24h()

@routes.route('/api/environment/hourly-average-pm25', methods=['GET'])
def recent_hourly_pm25():
    return get_most_recent_hourly_pm25_average()

@routes.route('/api/environment/daily-average-pm25', methods=['GET'])
def recent_daily_pm25():
    return get_most_recent_daily_pm25_average()

# Route to get historical hourly PM2.5 average
@routes.route('/api/environment/historical/hourly-average-pm25', methods=['GET'])
def historical_hourly_pm25():
    timestamp = request.args.get('timestamp')
    
    # Validate input timestamp
    if not timestamp:
        return jsonify({"error": "Timestamp is required"}), 400
    
    try:
        timestamp = int(timestamp)
    except ValueError:
        return jsonify({"error": "Invalid timestamp. Use Unix timestamp (seconds since epoch)"}), 400

    return get_historical_hourly_pm25_average(timestamp)

# Route to get historical daily PM2.5 average
@routes.route('/api/environment/historical/daily-average-pm25', methods=['GET'])
def historical_daily_pm25():
    timestamp = request.args.get('timestamp')
    
    # Validate input timestamp
    if not timestamp:
        return jsonify({"error": "Timestamp is required"}), 400
    
    try:
        timestamp = int(timestamp)
    except ValueError:
        return jsonify({"error": "Invalid timestamp. Use Unix timestamp (seconds since epoch)"}), 400

    return get_historical_daily_pm25_average(timestamp)