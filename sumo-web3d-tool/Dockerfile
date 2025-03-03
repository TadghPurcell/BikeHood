# Build the frontend bundle using Node
FROM node:14 as builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn webpack

# Use an official SUMO image as the base
FROM ghcr.io/eclipse-sumo/sumo:latest

# Installing dependencies
RUN apt-get update && apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Set SUMO_HOME
ENV SUMO_HOME=/usr/share/sumo

# Copy project files 
COPY . .

# Copy the built static assets from the builder stage
COPY --from=builder /app/sumo_web3d/static/ /app/sumo_web3d/static/

# Upgrade pip and install Python dependencies
RUN pip3 install --upgrade pip && pip3 install --no-cache-dir -r requirements.txt

EXPOSE 5000
EXPOSE 5678

CMD ["python3", "sumo_web3d/sumo_web3d.py"]