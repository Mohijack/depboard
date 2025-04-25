const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

// In a real application, this would be a database
// For this demo, we'll use a simple JSON file
const SERVICES_FILE = path.join(__dirname, '../../../data/services.json');
const BOOKINGS_FILE = path.join(__dirname, '../../../data/bookings.json');

// Ensure data directory exists
const dataDir = path.dirname(SERVICES_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize services file if it doesn't exist
if (!fs.existsSync(SERVICES_FILE)) {
  // Create some default services
  const defaultServices = [
    {
      id: 'fe2-docker',
      name: 'FE2 - Feuerwehr Einsatzleitsystem',
      description: 'Alamos FE2 - Professionelles Einsatzleitsystem für Feuerwehren',
      price: 19.99,
      image: 'alamosgmbh/fe2:latest',
      resources: {
        cpu: 2,
        memory: '2GB',
        storage: '10GB'
      },
      composeTemplate: `version: '3'
services:
  fe2_database:
    image: mongo:4.4.29
    ports:
      - 27017
    volumes:
      - fe2_db_data:/data/db
    restart: unless-stopped

  fe2_app:
    image: alamosgmbh/fe2:2.36.100
    environment:
      - FE2_EMAIL={{FE2_EMAIL}}
      - FE2_PASSWORD={{FE2_PASSWORD}}
      - FE2_ACTIVATION_NAME=fe2_{{UNIQUE_ID}}
      - FE2_IP_MONGODB=fe2_database
      - FE2_PORT_MONGODB=27017
    ports:
      - 83
    volumes:
      - fe2_logs:/Logs
      - fe2_config:/Config
    restart: unless-stopped
    depends_on:
      - fe2_database

  fe2_nginx:
    image: nginx:alpine
    ports:
      - "{{PORT}}:80"
    environment:
      - NGINX_HOST=localhost
    command: sh -c "echo 'server { listen 80; location / { proxy_pass http://fe2_app:83; } }' > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
    restart: unless-stopped
    depends_on:
      - fe2_app

volumes:
  fe2_db_data:
  fe2_logs:
  fe2_config:
`
    }
  ];

  fs.writeFileSync(SERVICES_FILE, JSON.stringify(defaultServices, null, 2));
}

// Initialize bookings file if it doesn't exist
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
}

class DockerServiceModel {
  constructor() {
    this.services = this.loadServices();
    this.bookings = this.loadBookings();
  }

  loadServices() {
    try {
      const data = fs.readFileSync(SERVICES_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error loading services:', error);
      return [];
    }
  }

  loadBookings() {
    try {
      const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error loading bookings:', error);
      return [];
    }
  }

  saveBookings() {
    try {
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(this.bookings, null, 2));
    } catch (error) {
      logger.error('Error saving bookings:', error);
    }
  }

  // Get all available services
  getAllServices() {
    return this.services;
  }

  // Get service by ID
  getServiceById(id) {
    return this.services.find(service => service.id === id);
  }

  // Check if a domain is already in use
  isDomainInUse(domain) {
    return this.bookings.some(booking => booking.domain === domain);
  }

  // Book a service
  bookService(userId, serviceId, customDomain, customName, licenseInfo = {}) {
    const service = this.getServiceById(serviceId);
    if (!service) {
      return { success: false, message: 'Service not found' };
    }

    // Generate a unique port number between 10000 and 20000
    const port = Math.floor(Math.random() * 10000) + 10000;

    // Generate a unique subdomain if not provided
    let subdomain = customDomain || `${serviceId}-${crypto.randomBytes(3).toString('hex')}`;
    let domain = `${subdomain}.beyondfire.cloud`;

    // Check if the domain is already in use
    if (customDomain) {
      if (this.isDomainInUse(domain)) {
        return { success: false, message: `Die Domain '${domain}' wird bereits verwendet. Bitte wählen Sie eine andere Subdomain.` };
      }
    } else {
      // If auto-generated, ensure it's unique
      let attempts = 0;
      while (this.isDomainInUse(domain) && attempts < 5) {
        subdomain = `${serviceId}-${crypto.randomBytes(3).toString('hex')}`;
        domain = `${subdomain}.beyondfire.cloud`;
        attempts++;
      }

      if (this.isDomainInUse(domain)) {
        return { success: false, message: 'Konnte keine eindeutige Domain generieren. Bitte versuchen Sie es später erneut.' };
      }
    }

    // Validate license information for FE2 service
    if (serviceId === 'fe2-docker') {
      if (!licenseInfo.email) {
        return { success: false, message: 'FE2 E-Mail-Adresse ist erforderlich' };
      }
      if (!licenseInfo.password) {
        return { success: false, message: 'FE2 Passwort ist erforderlich' };
      }
    }

    // Create booking
    const booking = {
      id: crypto.randomUUID(),
      userId,
      serviceId,
      serviceName: service.name,
      customName: customName || service.name,
      domain,
      port,
      status: 'pending', // pending, active, suspended
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      stackId: null, // Will be set when deployed
      dnsRecordId: null, // Will be set when DNS is configured
      licenseInfo: serviceId === 'fe2-docker' ? {
        email: licenseInfo.email,
        password: licenseInfo.password
      } : null
    };

    // Add booking
    this.bookings.push(booking);
    this.saveBookings();

    return { success: true, booking };
  }

  // Get booking by ID
  getBookingById(id) {
    return this.bookings.find(booking => booking.id === id);
  }

  // Get all bookings for a user
  getUserBookings(userId) {
    return this.bookings.filter(booking => booking.userId === userId);
  }

  // Update booking status
  updateBookingStatus(id, status, stackId = null, dnsRecordId = null) {
    const index = this.bookings.findIndex(booking => booking.id === id);
    if (index === -1) {
      return { success: false, message: 'Booking not found' };
    }

    // Update booking
    this.bookings[index].status = status;
    if (stackId) this.bookings[index].stackId = stackId;
    if (dnsRecordId) this.bookings[index].dnsRecordId = dnsRecordId;

    this.saveBookings();

    return { success: true, booking: this.bookings[index] };
  }

  // Delete booking
  deleteBooking(id) {
    const index = this.bookings.findIndex(booking => booking.id === id);
    if (index === -1) {
      return { success: false, message: 'Booking not found' };
    }

    // Remove booking from array
    this.bookings.splice(index, 1);

    // Save updated bookings
    this.saveBookings();

    return { success: true, message: 'Booking deleted successfully' };
  }

  // Generate docker-compose file for a booking
  generateComposeFile(bookingId) {
    const booking = this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }

    const service = this.getServiceById(booking.serviceId);
    if (!service) {
      return { success: false, message: 'Service not found' };
    }

    // Replace placeholders in template
    let composeContent = service.composeTemplate
      .replace(/{{PORT}}/g, booking.port)
      .replace(/{{DOMAIN}}/g, booking.domain);

    // Special handling for FE2 service
    if (booking.serviceId === 'fe2-docker') {
      // Generate a unique ID for the FE2 instance
      const uniqueId = booking.id.substring(0, 8);

      // Replace FE2-specific placeholders
      composeContent = composeContent
        .replace(/{{UNIQUE_ID}}/g, uniqueId)
        .replace(/{{FE2_EMAIL}}/g, booking.licenseInfo?.email || 'philipp.dasilva@e.bosch.com')
        .replace(/{{FE2_PASSWORD}}/g, booking.licenseInfo?.password || 'PG1hQcUIDLxY');

      // Create HTML directory and file
      try {
        const htmlDir = './html';
        if (!fs.existsSync(htmlDir)) {
          fs.mkdirSync(htmlDir, { recursive: true });
        }

        // Create a custom HTML file that looks like FE2
        const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FE2 - Feuerwehr Einsatzleitsystem</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
        }
        .header {
            background-color: #c00000;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
        }
        .content {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            min-height: 500px;
        }
        .info-box {
            background-color: #e6f7ff;
            border-left: 4px solid #1890ff;
            padding: 15px;
            margin-bottom: 20px;
        }
        .service-info {
            margin-top: 30px;
            border: 1px solid #ddd;
            padding: 20px;
        }
        .service-info h2 {
            margin-top: 0;
            color: #c00000;
        }
        .service-info table {
            width: 100%;
            border-collapse: collapse;
        }
        .service-info table th, .service-info table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
        .service-info table th {
            background-color: #f5f5f5;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">FE2 - Feuerwehr Einsatzleitsystem</div>
        <div>BeyondFire Cloud</div>
    </div>

    <div class="content">
        <div class="info-box">
            <p><strong>Hinweis:</strong> Dies ist eine Platzhalterseite für das FE2-Einsatzleitsystem. Das tatsächliche FE2-System konnte nicht korrekt bereitgestellt werden.</p>
        </div>

        <div class="service-info">
            <h2>Service-Informationen</h2>
            <table>
                <tr>
                    <th>Service-ID</th>
                    <td>${booking.serviceId}</td>
                </tr>
                <tr>
                    <th>Name</th>
                    <td>${booking.customName}</td>
                </tr>
                <tr>
                    <th>Domain</th>
                    <td>${booking.domain}</td>
                </tr>
                <tr>
                    <th>Port</th>
                    <td>${booking.port}</td>
                </tr>
                <tr>
                    <th>Status</th>
                    <td>Aktiv</td>
                </tr>
                <tr>
                    <th>Erstellt am</th>
                    <td>${new Date(booking.createdAt).toLocaleString()}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="footer">
        <p>&copy; ${new Date().getFullYear()} BeyondFire Cloud - FE2 Einsatzleitsystem</p>
    </div>
</body>
</html>
`;

        // Write the HTML file
        fs.writeFileSync(`${htmlDir}/index.html`, htmlContent);
        logger.info(`Created custom HTML file for booking ${bookingId}`);
      } catch (error) {
        logger.error(`Failed to create HTML file for booking ${bookingId}:`, error);
      }

      logger.info(`Creating FE2 service for booking ${bookingId} with unique ID ${uniqueId}`);
    }

    return { success: true, composeContent };
  }
}

module.exports = new DockerServiceModel();
