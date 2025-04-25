const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
if (!fs.existsSync(path.join(__dirname, '../../logs'))) {
  fs.mkdirSync(path.join(__dirname, '../../logs'), { recursive: true });
}

// Write startup log to file directly (in case logger module fails)
fs.writeFileSync(
  path.join(__dirname, '../../logs/startup.log'),
  `Server starting at ${new Date().toISOString()}\n`,
  { flag: 'a' }
);

try {
  // Load configuration and modules
  const logger = require('./utils/logger');
  const config = require('./utils/config');

  // Log startup information
  logger.info('Starting BeyondFire Cloud API server');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Load remaining modules
  const routes = require('./routes');
  const cloudflareService = require('./integrations/cloudflare');

  const app = express();
  const PORT = config.port || 3000;

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  // Log Cloudflare status on startup
  if (!cloudflareService.isEnabled()) {
    logger.info('Cloudflare integration is disabled');
  }

  // Basic health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api', routes);

  // Serve static frontend files
  app.use(express.static(path.join(__dirname, '../../frontend/build')));

  // For any other request, send the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });

  // Error handling
  app.use((err, req, res, next) => {
    logger.error('API Error:', err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.nodeEnv === 'development' ? err.message : undefined
    });
  });

  // Start server
  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    logger.error('Server error:', error);
    fs.writeFileSync(
      path.join(__dirname, '../../logs/server-error.log'),
      `Server error at ${new Date().toISOString()}: ${error.message}\n${error.stack}\n`,
      { flag: 'a' }
    );
  });

} catch (error) {
  // Write error to file directly (in case logger module fails)
  fs.writeFileSync(
    path.join(__dirname, '../../logs/startup-error.log'),
    `Startup error at ${new Date().toISOString()}: ${error.message}\n${error.stack}\n`,
    { flag: 'a' }
  );
  console.error('Startup error:', error);
  process.exit(1);
}
