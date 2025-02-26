# Use a lightweight Python image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code (run.py, config.py, and the app folder)
COPY . .

# Expose the port your Flask app runs on (adjust if needed)
EXPOSE 8080

# Run the application using run.py as the entry point
CMD ["python", "run.py"]