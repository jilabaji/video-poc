# Use Node.js v22 (LTS) as base image
FROM node:22-bookworm-slim

# Install FFmpeg and HandBrake
RUN apt-get update && \
    apt-get install -y ffmpeg handbrake-cli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm i

# Copy project files
COPY . .

# Build client
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]