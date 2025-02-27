# Use the official Node.js image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Increase memory limit for the build step
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build the React application
#RUN npm run build

# Expose the port the app runs on
EXPOSE 5173

# Start the React application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]