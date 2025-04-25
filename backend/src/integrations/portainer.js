const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../utils/config');

class PortainerService {
  constructor() {
    // Stelle sicher, dass die URL kein abschließendes Schrägstrich hat
    this.baseURL = config.portainer.url.endsWith('/')
      ? config.portainer.url.slice(0, -1)
      : config.portainer.url;
    this.token = null;

    logger.info(`Portainer URL: ${this.baseURL}`);
  }

  async authenticate() {
    try {
      logger.info(`Authenticating with Portainer at ${this.baseURL}`);
      logger.info(`Using username: ${config.portainer.username}`);

      // Direkte Authentifizierung mit dem Standard-JSON-Format (lowercase)
      // Dies funktioniert mit Portainer 2.27.4
      const response = await axios.post(`${this.baseURL}/api/auth`, {
        username: config.portainer.username,
        password: config.portainer.password
      });

      this.token = response.data.jwt;
      logger.info('Portainer authentication successful');
      return this.token;
    } catch (error) {
      logger.error('Portainer authentication failed:', error.message);
      if (error.response) {
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to authenticate with Portainer');
    }
  }

  // Get authentication headers
  async getAuthHeaders() {
    if (!this.token) {
      await this.authenticate();
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // List all stacks
  async listStacks() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/api/stacks`, { headers });
      return response.data;
    } catch (error) {
      logger.error('Failed to list stacks:', error.message);
      throw new Error('Failed to list Portainer stacks');
    }
  }

  // Get stack details
  async getStack(stackId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/api/stacks/${stackId}`, { headers });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get stack ${stackId}:`, error.message);
      throw new Error(`Failed to get Portainer stack ${stackId}`);
    }
  }

  // Check if a stack with the given name already exists
  async stackExists(name) {
    try {
      logger.info(`Checking if stack exists: ${name}`);

      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/api/stacks`, { headers });

      // Check if any stack has the same name
      const existingStack = response.data.find(stack => stack.Name === name);

      if (existingStack) {
        logger.info(`Stack with name ${name} already exists with ID: ${existingStack.Id}`);
        return true;
      }

      logger.info(`No stack found with name: ${name}`);
      return false;
    } catch (error) {
      logger.error(`Failed to check if stack exists: ${name}`, error.message);
      // If we can't check, assume it doesn't exist
      return false;
    }
  }

  // Create a new stack
  async createStack(name, composeFileContent) {
    try {
      logger.info(`Creating stack: ${name}`);

      const headers = await this.getAuthHeaders();
      logger.info('Got authentication headers');

      // Prüfen, ob ein Stack mit diesem Namen bereits existiert
      const stackExists = await this.stackExists(name);
      if (stackExists) {
        throw new Error(`A stack with the name '${name}' already exists. Please choose a different name.`);
      }

      // Prüfen, ob die Endpunkte erreichbar sind
      let endpointId = 1; // Standard-Endpunkt-ID
      try {
        const endpointsResponse = await axios.get(`${this.baseURL}/api/endpoints`, { headers });
        logger.info(`Found ${endpointsResponse.data.length || 0} endpoints`);

        // Suche nach dem lokalen Endpunkt
        const localEndpoint = endpointsResponse.data.find(endpoint => endpoint.Name === 'local');
        if (localEndpoint) {
          endpointId = localEndpoint.Id;
          logger.info(`Using local endpoint with ID: ${endpointId}`);
        } else if (endpointsResponse.data.length > 0) {
          endpointId = endpointsResponse.data[0].Id;
          logger.info(`No local endpoint found. Using first endpoint with ID: ${endpointId}`);
        }
      } catch (endpointsError) {
        logger.error('Failed to get endpoints:', endpointsError.message);
        logger.info(`Using default endpoint ID: ${endpointId}`);
      }

      // Stack erstellen mit der korrekten Methode für Portainer 2.27.4
      logger.info(`Using endpoint ID: ${endpointId}`);
      logger.info(`Creating stack with name: ${name}`);
      logger.info(`Compose file content:\n${composeFileContent}`);

      try {
        const response = await axios.post(
          `${this.baseURL}/api/stacks/create/standalone/string?endpointId=${endpointId}`,
          {
            name,
            stackFileContent: composeFileContent
          },
          { headers }
        );
        return response.data;
      } catch (postError) {
        logger.error(`Error in POST request: ${postError.message}`);
        if (postError.response) {
          logger.error(`Status: ${postError.response.status}`);
          logger.error(`Data: ${JSON.stringify(postError.response.data)}`);

          // Try a different API endpoint for older Portainer versions
          logger.info('Trying alternative API endpoint for older Portainer versions...');
          const altResponse = await axios.post(
            `${this.baseURL}/api/stacks?type=1&method=string&endpointId=${endpointId}`,
            {
              Name: name,
              StackFileContent: composeFileContent
            },
            { headers }
          );
          return altResponse.data;
        } else {
          throw postError;
        }
      }
    } catch (error) {
      logger.error(`Failed to create stack ${name}:`, error.message);
      if (error.response) {
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to create Portainer stack ${name}: ${error.message}`);
    }
  }

  // Update an existing stack
  async updateStack(stackId, composeFileContent) {
    try {
      logger.info(`Updating stack: ${stackId}`);

      const headers = await this.getAuthHeaders();
      logger.info('Got authentication headers');

      // Prüfen, ob die Endpunkte erreichbar sind
      let endpointId = 1; // Standard-Endpunkt-ID
      try {
        const endpointsResponse = await axios.get(`${this.baseURL}/api/endpoints`, { headers });
        logger.info(`Found ${endpointsResponse.data.length || 0} endpoints`);

        // Suche nach dem lokalen Endpunkt
        const localEndpoint = endpointsResponse.data.find(endpoint => endpoint.Name === 'local');
        if (localEndpoint) {
          endpointId = localEndpoint.Id;
          logger.info(`Using local endpoint with ID: ${endpointId}`);
        } else if (endpointsResponse.data.length > 0) {
          endpointId = endpointsResponse.data[0].Id;
          logger.info(`No local endpoint found. Using first endpoint with ID: ${endpointId}`);
        }
      } catch (endpointsError) {
        logger.error('Failed to get endpoints:', endpointsError.message);
        logger.info(`Using default endpoint ID: ${endpointId}`);
      }

      // Stack aktualisieren mit der korrekten Methode für Portainer 2.27.4
      logger.info(`Using endpoint ID: ${endpointId}`);
      const response = await axios.put(
        `${this.baseURL}/api/stacks/${stackId}?endpointId=${endpointId}`,
        {
          stackFileContent: composeFileContent
        },
        { headers }
      );

      logger.info(`Stack updated: ${stackId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update stack ${stackId}:`, error.message);
      if (error.response) {
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to update Portainer stack ${stackId}: ${error.message}`);
    }
  }

  // Get volumes for a stack
  async getStackVolumes(stackId) {
    try {
      logger.info(`Getting volumes for stack: ${stackId}`);

      const headers = await this.getAuthHeaders();

      // Get endpoint ID
      let endpointId = 1; // Default endpoint ID
      try {
        const endpointsResponse = await axios.get(`${this.baseURL}/api/endpoints`, { headers });
        const localEndpoint = endpointsResponse.data.find(endpoint => endpoint.Name === 'local');
        if (localEndpoint) {
          endpointId = localEndpoint.Id;
        } else if (endpointsResponse.data.length > 0) {
          endpointId = endpointsResponse.data[0].Id;
        }
      } catch (error) {
        logger.error('Failed to get endpoints:', error.message);
      }

      // Get stack details to find volume names
      try {
        const stackResponse = await axios.get(`${this.baseURL}/api/stacks/${stackId}?endpointId=${endpointId}`, { headers });
        const stackName = stackResponse.data.Name;

        // Get all volumes
        const volumesResponse = await axios.get(`${this.baseURL}/api/endpoints/${endpointId}/docker/volumes`, { headers });

        // Filter volumes that belong to this stack
        // Volumes created by docker-compose typically have names like: stackname_volumename
        const stackVolumes = volumesResponse.data.Volumes.filter(volume =>
          volume.Name.startsWith(`${stackName}_`) ||
          volume.Labels && volume.Labels['com.docker.compose.project'] === stackName
        );

        logger.info(`Found ${stackVolumes.length} volumes for stack ${stackName}`);
        return stackVolumes;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          logger.warn(`Stack ${stackId} not found, cannot get volumes`);
          return [];
        }
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to get volumes for stack ${stackId}:`, error.message);
      return [];
    }
  }

  // Delete volumes for a stack
  async deleteStackVolumes(stackId) {
    try {
      const volumes = await this.getStackVolumes(stackId);
      if (volumes.length === 0) {
        logger.info(`No volumes found for stack ${stackId}`);
        return true;
      }

      const headers = await this.getAuthHeaders();

      // Get endpoint ID
      let endpointId = 1; // Default endpoint ID
      try {
        const endpointsResponse = await axios.get(`${this.baseURL}/api/endpoints`, { headers });
        const localEndpoint = endpointsResponse.data.find(endpoint => endpoint.Name === 'local');
        if (localEndpoint) {
          endpointId = localEndpoint.Id;
        } else if (endpointsResponse.data.length > 0) {
          endpointId = endpointsResponse.data[0].Id;
        }
      } catch (error) {
        logger.error('Failed to get endpoints:', error.message);
      }

      // Delete each volume
      for (const volume of volumes) {
        try {
          logger.info(`Deleting volume: ${volume.Name}`);
          await axios.delete(`${this.baseURL}/api/endpoints/${endpointId}/docker/volumes/${volume.Name}`, { headers });
          logger.info(`Volume ${volume.Name} deleted successfully`);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            logger.warn(`Volume ${volume.Name} not found, it may have been already deleted`);
          } else {
            logger.error(`Failed to delete volume ${volume.Name}:`, error.message);
          }
        }
      }

      return true;
    } catch (error) {
      logger.error(`Failed to delete volumes for stack ${stackId}:`, error.message);
      return false;
    }
  }

  // Delete a stack
  async deleteStack(stackId) {
    try {
      logger.info(`Deleting stack: ${stackId}`);

      const headers = await this.getAuthHeaders();
      logger.info('Got authentication headers');

      // Prüfen, ob die Endpunkte erreichbar sind
      let endpointId = 1; // Standard-Endpunkt-ID
      try {
        const endpointsResponse = await axios.get(`${this.baseURL}/api/endpoints`, { headers });
        logger.info(`Found ${endpointsResponse.data.length || 0} endpoints`);

        // Suche nach dem lokalen Endpunkt
        const localEndpoint = endpointsResponse.data.find(endpoint => endpoint.Name === 'local');
        if (localEndpoint) {
          endpointId = localEndpoint.Id;
          logger.info(`Using local endpoint with ID: ${endpointId}`);
        } else if (endpointsResponse.data.length > 0) {
          endpointId = endpointsResponse.data[0].Id;
          logger.info(`No local endpoint found. Using first endpoint with ID: ${endpointId}`);
        }
      } catch (endpointsError) {
        logger.error('Failed to get endpoints:', endpointsError.message);
        logger.info(`Using default endpoint ID: ${endpointId}`);
      }

      // Check if stack exists before deleting
      try {
        await axios.get(`${this.baseURL}/api/stacks/${stackId}?endpointId=${endpointId}`, { headers });
        logger.info(`Stack ${stackId} exists, proceeding with deletion`);
      } catch (checkError) {
        if (checkError.response && checkError.response.status === 404) {
          logger.warn(`Stack ${stackId} not found, it may have been already deleted`);
          return true; // Consider it successfully deleted if it doesn't exist
        }
        // For other errors, continue with deletion attempt
        logger.warn(`Error checking stack existence: ${checkError.message}`);
      }

      // Stack löschen mit der korrekten Methode für Portainer 2.27.4
      // Füge den Parameter 'removeVolumes=true' hinzu, um auch die Volumes zu löschen
      logger.info(`Using endpoint ID: ${endpointId}`);
      logger.info('Deleting stack with associated volumes');
      await axios.delete(`${this.baseURL}/api/stacks/${stackId}?endpointId=${endpointId}&removeVolumes=true`, { headers });

      logger.info(`Stack deleted: ${stackId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete stack ${stackId}:`, error.message);
      if (error.response) {
        logger.error(`Status: ${error.response.status}`);
        logger.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to delete Portainer stack ${stackId}: ${error.message}`);
    }
  }
}

module.exports = new PortainerService();