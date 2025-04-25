const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const logger = require('../utils/logger');

const execPromise = util.promisify(exec);

class DirectDeploymentService {
  async deployService(bookingId, composeContent) {
    try {
      logger.info(`Starting deployment for service ${bookingId}`);
      
      // Create directory for service
      const serviceDir = path.join(__dirname, '../../../data', `service-${bookingId}`);
      if (!fs.existsSync(serviceDir)) {
        fs.mkdirSync(serviceDir, { recursive: true });
      }
      
      // Create log file path
      const logFilePath = path.join(serviceDir, 'deployment.log');
      
      // Initialize log file
      const timestamp = new Date().toISOString();
      fs.writeFileSync(logFilePath, `[${timestamp}] Starting deployment for service ${bookingId}\n`);
      
      // Write docker-compose file
      const composeFilePath = path.join(serviceDir, 'docker-compose.yml');
      fs.writeFileSync(composeFilePath, composeContent);
      
      // Log compose content
      fs.appendFileSync(logFilePath, `[${timestamp}] Docker-compose file written to ${composeFilePath}\n`);
      fs.appendFileSync(logFilePath, `[${timestamp}] Compose content:\n${composeContent}\n`);
      
      // Check if Docker is installed
      try {
        const { stdout, stderr } = await execPromise('docker info');
        if (stderr) {
          logger.warn(`Docker-compose stderr: ${stderr}`);
          fs.appendFileSync(logFilePath, `[${timestamp}] Docker-compose stderr:\n${stderr}\n`);
        }
      } catch (dockerError) {
        console.error('Docker command failed:', dockerError.message);
        logger.error('Docker command failed:', dockerError.message);
        
        // Append to log file
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logFilePath, `[${timestamp}] Docker command failed: ${dockerError.message}\n`);

        // Try an alternative approach using docker compose (with a space)
        try {
          console.log('Trying alternative docker compose command...');
          logger.info('Trying alternative docker compose command...');
          
          const { stdout, stderr } = await execPromise(`cd ${serviceDir} && docker compose up -d`);
          
          if (stderr) {
            logger.warn(`Docker compose stderr: ${stderr}`);
            fs.appendFileSync(logFilePath, `[${timestamp}] Docker compose stderr:\n${stderr}\n`);
          }
        } catch (dockerComposeError) {
          console.error('Docker compose command failed:', dockerComposeError.message);
          logger.error('Docker compose command failed:', dockerComposeError.message);
          
          // Append to log file
          const timestamp = new Date().toISOString();
          fs.appendFileSync(logFilePath, `[${timestamp}] Docker compose command failed: ${dockerComposeError.message}\n`);
          
          throw dockerComposeError;
        }
      }
      
      // Create DNS record
      // This would be handled by the Cloudflare integration
      
      return { success: true, message: 'Service deployed successfully' };
    } catch (error) {
      logger.error(`Deployment failed: ${error.message}`);
      return { success: false, message: `Deployment failed: ${error.message}` };
    }
  }
  
  async getServiceLogs(bookingId) {
    try {
      const serviceDir = path.join(__dirname, '../../../data', `service-${bookingId}`);
      const logFilePath = path.join(serviceDir, 'deployment.log');
      
      if (!fs.existsSync(logFilePath)) {
        return [];
      }
      
      const logContent = fs.readFileSync(logFilePath, 'utf8');
      const logLines = logContent.split('\n').filter(line => line.trim());
      
      return logLines.map(line => {
        return {
          source: 'direct',
          message: line
        };
      });
    } catch (error) {
      logger.error(`Failed to get logs for service ${bookingId}: ${error.message}`);
      return [];
    }
  }
}

module.exports = new DirectDeploymentService();
