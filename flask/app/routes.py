from flask import Blueprint, jsonify
from app.handlers import get_latest_environment_data
from app.handlers import get_latest_traffic_data
from app.handlers import get_latest_noise_data

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

# Route to get the latest traffic data
@routes.route('/api/traffic/latest', methods=['GET'])
def get_latest_traffic():
    return get_latest_traffic_data()

# Route to get the latest noise pollution data
@routes.route('/api/noise/latest', methods=['GET'])
def get_latest_noise():
    return get_latest_noise_data()