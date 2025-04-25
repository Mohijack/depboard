const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../utils/config');

class CloudflareService {
  constructor() {
    this.baseURL = 'https://api.cloudflare.com/client/v4';
    this.zoneId = config.cloudflare.zoneId;
    this.headers = {
      'Authorization': `Bearer ${config.cloudflare.apiToken}`,
      'Content-Type': 'application/json'
    };
    this.enabled = false; // Temporarily disabled
  }

  // Check if Cloudflare is enabled
  isEnabled() {
    return this.enabled && this.zoneId && config.cloudflare.apiToken;
  }

  // Create a DNS record
  async createDNSRecord(name, content, type = 'A', proxied = true) {
    if (!this.isEnabled()) {
      logger.info('Cloudflare integration is disabled. Skipping DNS record creation.');
      return { success: false, disabled: true };
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/zones/${this.zoneId}/dns_records`,
        {
          type,
          name,
          content,
          proxied
        },
        { headers: this.headers }
      );

      logger.info(`DNS record created: ${name}`);
      return { success: true, result: response.data.result };
    } catch (error) {
      logger.error('Failed to create DNS record:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Delete a DNS record
  async deleteDNSRecord(recordId) {
    if (!this.isEnabled()) {
      logger.info('Cloudflare integration is disabled. Skipping DNS record deletion.');
      return { success: false, disabled: true };
    }

    try {
      await axios.delete(
        `${this.baseURL}/zones/${this.zoneId}/dns_records/${recordId}`,
        { headers: this.headers }
      );

      logger.info(`DNS record deleted: ${recordId}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete DNS record:', error.message);
      return { success: false, error: error.message };
    }
  }

  // List DNS records
  async listDNSRecords() {
    if (!this.isEnabled()) {
      logger.info('Cloudflare integration is disabled. Skipping DNS records listing.');
      return { success: false, disabled: true };
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/zones/${this.zoneId}/dns_records`,
        { headers: this.headers }
      );

      return { success: true, records: response.data.result };
    } catch (error) {
      logger.error('Failed to list DNS records:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CloudflareService();
