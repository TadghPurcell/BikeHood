import os
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
def load_env_variables(file_path=".env"):
    try:
        load_dotenv(file_path)  
        logging.info("Environment variables loaded successfully!")
    except Exception as e:
        logging.error(f"Error loading .env file: {e}")
        raise e

# Call the function to load environment variables
load_env_variables()

# Defining the Config class for Flask application settings
class Config:
    # General Settings
    DEBUG = os.getenv("DEBUG", False)  
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")  # Security key for sessions

    # Database Settings
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", 5432)
    DB_USER = os.getenv("DB_USER", "user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
    DB_NAME = os.getenv("DB_NAME", "database_name")
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False  

    # CORS Settings (Optional)
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")  

# Development-specific configurations
class DevelopmentConfig(Config):
    DEBUG = True  

# Production-specific configurations
class ProductionConfig(Config):
    DEBUG = False  

# Function to dynamically select the configuration
def get_config():
    env = os.getenv("FLASK_ENV", "development")
    if env == "production":
        return ProductionConfig()
    return DevelopmentConfig()
