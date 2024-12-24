from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import text
import logging

# Initialize SQLAlchemy instance
db = SQLAlchemy()

def connect_db(app):
    """
    Sets up the connection to the MySQL database using SQLAlchemy.
    """
    try:
        # Bind the app with SQLAlchemy
        db.init_app(app)

        # Test the connection
        with app.app_context():
            with db.engine.connect() as connection: 
                connection.execute(text("SELECT 1"))  

        logging.info("Database connection established successfully!")
        return db

    except Exception as e:
        logging.error(f"Error connecting to the database: {e}")
        raise e
