# Use a lightweight Python image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first to leverage Docker caching
COPY requirements.txt .

# Install dependencies 
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code into the container
COPY . .

# Exposing ports used by SUMO-Web3D:
# - Port 5000 for the HTTP server
# - Port 5678 for WebSocket connections
EXPOSE 5000
EXPOSE 5678

# Run the SUMO-Web3D tool by executing the main Python script
CMD ["python", "sumo_web3d/sumo_web3d.py"]