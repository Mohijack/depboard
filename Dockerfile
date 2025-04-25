# Build stage for frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Final stage with backend and frontend
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Copy frontend build from frontend-build stage
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# Create logs directory
RUN mkdir -p logs
# Create data directory
RUN mkdir -p data

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "backend/src/index.js"]
