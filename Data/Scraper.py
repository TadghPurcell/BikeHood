import requests
import pymysql
from datetime import datetime
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)

# Set up your API tokens and endpoints using environment variables
class Config:
    AQI_TOKEN = os.getenv('AQI_TOKEN')
    AQI_URL = f'https://api.waqi.info/feed/@13365/?token={AQI_TOKEN}'  # Blanchardstown
    FORECAST_API_KEY = os.getenv('FORECAST_API_KEY')
    LAT = '53.3498'  # Latitude for Dublin, Ireland
    LON = '-6.2603'  # Longitude for Dublin, Ireland
    FORECAST_URL = f'https://api.openweathermap.org/data/3.0/onecall?lat={LAT}&lon={LON}&appid={FORECAST_API_KEY}'
    TOMTOM_API_KEY = os.getenv('TOMTOM_API_KEY')
    TOMTOM_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"

# MySQL database connection settings
db_config = {
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': int(os.getenv('DB_PORT')),
    'database': os.getenv('DB_NAME', 'bikehood'),
    #Comment this out when running on local machine
    'ssl': {'ca': '/etc/ssl/ca-certificate.crt'}  
}

# Coordinates list for traffic data
coordinates_list = [
    (53.392862, -6.441783, 'Ongar_Distributor_Road'),
    (53.394976, -6.444193, 'Littleplace_Castleheaney_Distributor_Road_South'),
    (53.395872, -6.441064, 'Main_Street'),
    (53.394084, -6.438794, 'The_Mall'),
    (53.391115, -6.439771, 'Station_Road'),
    (53.391576, -6.436851, 'Ongar_Distributor_Road_East'),
    (53.392969, -6.445409, 'Ongar_Barnhill_Distributor_Road'),
    (53.396809, -6.442519, 'Littleplace_Castleheaney_Distributor_Road_North'),
    (53.395994, -6.438525, 'The_Avenue')
]

class DatabaseManager:
    """Class to manage database connections and operations."""
    
    def __init__(self, config):
        self.config = config
        self.connection = self.establish_connection()

    def establish_connection(self):
        """Establish a connection to the MySQL database."""
        try:
            connection = pymysql.connect(
                host=self.config['host'],
                user=self.config['user'],
                password=self.config['password'],
                database=self.config['database'],
                port=self.config['port'],
                #Comment this out when running on local machine
                ssl=self.config['ssl']
            )
            logging.info("Connected to MySQL database")
            return connection
        except pymysql.MySQLError as err:
            logging.error(f"Database connection error: {err}")
            return None

    def insert_traffic_data(self, timestamp, traffic_data):
        """Insert traffic data into the MySQL database."""
        columns = ", ".join([f"`{road}`" for road in traffic_data.keys()])
        placeholders = ", ".join(["%s"] * len(traffic_data))
        sql_query = f"INSERT INTO tomtom (timestamp, {columns}) VALUES (%s, {placeholders})"

        try:
            cursor = self.connection.cursor()
            values = (timestamp, *traffic_data.values())
            cursor.execute(sql_query, values)
            self.connection.commit()
            logging.info(f"Traffic data inserted successfully at {datetime.fromtimestamp(timestamp)}")
        except pymysql.MySQLError as err:
            logging.error(f"Error inserting traffic data: {err}")
            self.connection.rollback()

    def insert_air_quality_data(self, timestamp, data, forecast_data=None):
        """Insert PM2.5 and forecast data into the MySQL database."""
        if data:
            city = data.get('city', {}).get('name', 'Unknown Location')
            pm25 = data.get('iaqi', {}).get('pm25', {}).get('v', None)

            if pm25 is None:
                logging.warning("PM2.5 data not available.")
                return

            values = (
                timestamp,
                city,
                pm25,
            )

            if forecast_data:
                values += (
                    forecast_data.get('temp', None),
                    forecast_data.get('weather', None),
                    forecast_data.get('wind_speed', None),
                    forecast_data.get('rain', None)
                )
            else:
                values += (None, None, None, None)

            sql_query = """
            INSERT INTO environment (timestamp, location, `pm2.5`, temperature, weather, wind_speed, rain)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """

            try:
                cursor = self.connection.cursor()
                cursor.execute(sql_query, values)
                self.connection.commit()
                logging.info(f"Data for {city} inserted successfully.")
            except pymysql.MySQLError as err:
                logging.error(f"Error inserting air quality data: {err}")
                self.connection.rollback()

class DataFetcher:
    """Class to fetch data from APIs."""
    
    def __init__(self):
        self.air_quality_data = None
        self.current_weather_data = None

    def fetch_air_quality(self):
        """Fetch air quality data from the API."""
        try:
            response = requests.get(Config.AQI_URL)
            response.raise_for_status()
            data = response.json()
            if data['status'] == 'ok':
                self.air_quality_data = data['data']
            else:
                logging.error("Air quality data retrieval error: Unknown status.")
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching air quality data: {e}")

    def fetch_current_weather(self):
        """Fetch current hour's weather data."""
        try:
            response = requests.get(Config.FORECAST_URL)
            response.raise_for_status()
            forecast_data = response.json()
            if 'hourly' in forecast_data:
                most_recent_hour_data = forecast_data['hourly'][0]
                self.current_weather_data = self.parse_weather_entry(most_recent_hour_data)
            else:
                logging.info("No hourly data found in the response.")
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching current weather data: {e}")

    @staticmethod
    def parse_weather_entry(entry):
        """Parse a weather entry and return structured data."""
        temp = entry['temp'] - 273.15  # Convert Kelvin to Celsius
        return {
            'temp': temp,
            'weather': entry['weather'][0]['description'],
            'wind_speed': entry['wind_speed'],
            'rain': float(entry.get('rain', {}).get('1h', 0.0)),
        }

    def fetch_traffic_data(self):
        """Fetch traffic data for each road."""
        traffic_data = {}
        for lat, lon, road_name in coordinates_list:
            logging.info(f"Fetching traffic data for {road_name} at coordinates ({lat}, {lon})...")
            params = {
                'point': f'{lat},{lon}',
                'unit': 'KMPH',
                'key': Config.TOMTOM_API_KEY
            }
            response = requests.get(Config.TOMTOM_URL, params=params)
            if response.status_code == 200:
                data = response.json()
                flow_data = data.get('flowSegmentData', {})
                current_speed = flow_data.get('currentSpeed', 0)
                traffic_data[road_name] = current_speed
            else:
                logging.warning(f"Error fetching data for point ({lat}, {lon}): {response.status_code}")
                traffic_data[road_name] = None
        return traffic_data

def main():
    # Establish database connection
    db_manager = DatabaseManager(db_config)
    current_timestamp = int(datetime.now().timestamp())

    # Create an instance of DataFetcher
    data_fetcher = DataFetcher()

    # Fetch air quality and weather data
    data_fetcher.fetch_air_quality()
    data_fetcher.fetch_current_weather()

    # Insert air quality data into the database
    if data_fetcher.air_quality_data:
        db_manager.insert_air_quality_data(current_timestamp, data_fetcher.air_quality_data, data_fetcher.current_weather_data)

    # Fetch and insert traffic data into the database
    traffic_data = data_fetcher.fetch_traffic_data()
    db_manager.insert_traffic_data(current_timestamp, traffic_data)

    # Close the database connection
    if db_manager.connection and db_manager.connection.open:
        db_manager.connection.close()
        logging.info("MySQL connection closed.")

if __name__ == "__main__":
    main()
