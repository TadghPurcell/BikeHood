from flask import Flask
from flask_cors import CORS
from config import get_config
from app.database import connect_db
from app.routes import routes  

def create_app():
    # Initialize Flask app
    app = Flask(__name__)
    app.config.from_object(get_config())

    # Enable CORS
    cors_config = {
    "origins": ["http://localhost:3000", "http://localhost:5173"], 
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "allow_headers": ["Content-Type", "Authorization"]
}

    CORS(app, resources={r"/*": cors_config})

    # Initialize database connection
    connect_db(app)

    # Register routes Blueprint
    app.register_blueprint(routes)

    return app

