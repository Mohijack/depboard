const dotenv = require('dotenv');

// Load environment variables from .env file if not in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  portainer: {
    url: process.env.PORTAINER_URL,
    username: process.env.PORTAINER_USERNAME,
    password: process.env.PORTAINER_PASSWORD
  },
  
  cloudflare: {
    // Temporarily disabled
    apiToken: null, // process.env.CLOUDFLARE_API_TOKEN,
    zoneId: null // process.env.CLOUDFLARE_ZONE_ID
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-dev-secret',
    expiresIn: '24h'
  },
  
  server: {
    ip: process.env.SERVER_IP
  }
};
