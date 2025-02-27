# Use an official Ubuntu image as the base
FROM ubuntu:20.04

# Disable interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Update package lists and install SUMO and its tools
RUN apt-get update && \
    apt-get install -y sumo sumo-tools && \
    rm -rf /var/lib/apt/lists/*

# Exposing ports
EXPOSE 8800

# Default command 
CMD ["sumo", "--version"]