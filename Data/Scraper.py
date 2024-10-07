import requests
import mysql.connector
from datetime import datetime
import logging
import os
from dotenv import load_dotenv
import ssl

# Set up detailed logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables from .env file
logging.info("Loading environment variables from .env file...")
load_dotenv()

# Check if environment variables are correctly loaded
required_env_vars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'AQI_TOKEN', 'FORECAST_API_KEY', 'TOMTOM_API_KEY']
for var in required_env_vars:
    value = os.getenv(var)
    if value:
        logging.info(f"Environment variable {var} loaded successfully.")
    else:
        logging.warning(f"Environment variable {var} is missing or not loaded correctly!")

# Create an SSL context for secure database connections
try:
    logging.info("Creating SSL context for secure connection...")
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ssl_context.verify_mode = ssl.CERT_REQUIRED
    ssl_context.check_hostname = True
    ssl_cert_path = '/etc/ssl/ca-certificate.crt'

    # Check if the SSL certificate file exists
    if os.path.isfile(ssl_cert_path):
        ssl_context.load_verify_locations(ssl_cert_path)
        logging.info(f"SSL certificate loaded from {ssl_cert_path}.")
    else:
        logging.error(f"SSL certificate file not found at {ssl_cert_path}. Please check the path.")
except Exception as e:
    logging.error(f"Failed to create SSL context: {e}")

# MySQL database connection settings
db_config = {
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT'),
    'database': os.getenv('DB_NAME', 'bikehood'),
    'ssl_context': ssl_context  # Use the SSLContext object for secure connection
}

class DatabaseManager:
    """Class to manage database connections and operations."""
    
    def __init__(self, config):
        self.config = config
        self.connection = self.establish_connection()

    def establish_connection(self):
        """Establish a connection to the MySQL database."""
        try:
            logging.info("Attempting to connect to the MySQL database...")
            connection = mysql.connector.connect(**self.config)
            logging.info("Successfully connected to the MySQL database.")
            return connection
        except mysql.connector.Error as err:
            logging.error(f"Database connection error: {err}")
            return None
        except Exception as e:
            logging.error(f"Unexpected error during database connection: {e}")
            return None

    def insert_data(self, table_name, timestamp, data):
        """Generic method to insert data into a specified table."""
        if not self.connection:
            logging.error("No active database connection. Cannot insert data.")
            return

        columns = ", ".join([f"`{key}`" for key in data.keys()])
        placeholders = ", ".join(["%s"] * len(data))
        sql_query = f"INSERT INTO {table_name} (timestamp, {columns}) VALUES (%s, {placeholders})"

        try:
            cursor = self.connection.cursor()
            values = (timestamp, *data.values())
            logging.info(f"Inserting data into {table_name}: {values}")
            cursor.execute(sql_query, values)
            self.connection.commit()
            logging.info(f"Data inserted successfully into {table_name} at {datetime.fromtimestamp(timestamp)}")
        except mysql.connector.Error as err:
            logging.error(f"Error inserting data into {table_name}: {err}")
            self.connection.rollback()
        except Exception as e:
            logging.error(f"Unexpected error while inserting data into {table_name}: {e}")

def main():
    # Establish database connection
    db_manager = DatabaseManager(db_config)
    current_timestamp = int(datetime.now().timestamp())

    # Insert test data to validate connection (for debugging purposes)
    if db_manager.connection:
        test_data = {'test_column': 1}
        db_manager.insert_data('test_table', current_timestamp, test_data)
    else:
        logging.error("Failed to establish a database connection.")

    # Close the database connection
    if db_manager.connection and db_manager.connection.is_connected():
        db_manager.connection.close()
        logging.info("MySQL connection closed.")

if __name__ == "__main__":
    main()
