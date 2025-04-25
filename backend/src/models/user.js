const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');

// In a real application, this would be a database
// For this demo, we'll use a simple JSON file
const USERS_FILE = path.join(__dirname, '../../../data/users.json');

// Ensure data directory exists
const dataDir = path.dirname(USERS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

class UserModel {
  constructor() {
    this.users = this.loadUsers();
    this.ensureDefaultAdmin();
  }

  // Ensure default admin user exists
  ensureDefaultAdmin() {
    const adminEmail = 'admin@beyondfire.cloud';
    const adminUser = this.users.find(user => user.email === adminEmail);

    if (!adminUser) {
      logger.info('Creating default admin user');

      // Hash password
      const { hash, salt } = this.hashPassword('AdminPW!');

      // Create admin user
      const admin = {
        id: crypto.randomUUID(),
        email: adminEmail,
        name: 'Admin',
        company: 'BeyondFire Cloud',
        passwordHash: hash,
        passwordSalt: salt,
        role: 'admin',
        createdAt: new Date().toISOString(),
        services: []
      };

      // Add admin to users array
      this.users.push(admin);
      this.saveUsers();

      logger.info('Default admin user created');
    }
  }

  loadUsers() {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error loading users:', error);
      return [];
    }
  }

  saveUsers() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
    } catch (error) {
      logger.error('Error saving users:', error);
    }
  }

  // Hash password with salt
  hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  // Validate password
  validatePassword(password, hash, salt) {
    const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
  }

  // Register a new user
  register(email, password, name, company = '') {
    // Check if user already exists
    if (this.users.find(user => user.email === email)) {
      return { success: false, message: 'User already exists' };
    }

    // Hash password
    const { hash, salt } = this.hashPassword(password);

    // Create user
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      company,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'user',
      createdAt: new Date().toISOString(),
      services: []
    };

    // Add user to array
    this.users.push(user);
    this.saveUsers();

    // Return user without sensitive data
    const { passwordHash, passwordSalt, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  }

  // Login user
  login(email, password) {
    // Find user
    const user = this.users.find(user => user.email === email);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Validate password
    if (!this.validatePassword(password, user.passwordHash, user.passwordSalt)) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Return user without sensitive data
    const { passwordHash, passwordSalt, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword, token };
  }

  // Get user by ID
  getUserById(id) {
    const user = this.users.find(user => user.id === id);
    if (!user) return null;

    // Return user without sensitive data
    const { passwordHash, passwordSalt, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Get user by email
  getUserByEmail(email) {
    const user = this.users.find(user => user.email === email);
    if (!user) return null;

    // Return user without sensitive data
    const { passwordHash, passwordSalt, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update user
  updateUser(id, userData) {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return { success: false, message: 'User not found' };

    // Allow role updates but not other sensitive fields
    const { email, passwordHash, passwordSalt, ...allowedUpdates } = userData;

    // Update user
    this.users[index] = { ...this.users[index], ...allowedUpdates };
    this.saveUsers();

    // Return updated user without sensitive data
    const { passwordHash: ph, passwordSalt: ps, ...userWithoutPassword } = this.users[index];
    return { success: true, user: userWithoutPassword };
  }

  // Reset user password (admin function)
  resetPassword(id, newPassword) {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return { success: false, message: 'User not found' };

    // Hash new password
    const { hash, salt } = this.hashPassword(newPassword);

    // Update user
    this.users[index].passwordHash = hash;
    this.users[index].passwordSalt = salt;
    this.saveUsers();

    return { success: true };
  }

  // Delete user (admin function)
  deleteUser(id) {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return { success: false, message: 'User not found' };

    // Remove user
    this.users.splice(index, 1);
    this.saveUsers();

    return { success: true };
  }

  // Add service to user
  addServiceToUser(userId, service) {
    const index = this.users.findIndex(user => user.id === userId);
    if (index === -1) return { success: false, message: 'User not found' };

    // Add service
    this.users[index].services.push(service);
    this.saveUsers();

    return { success: true, services: this.users[index].services };
  }

  // Get user services
  getUserServices(userId) {
    const user = this.users.find(user => user.id === userId);
    if (!user) return { success: false, message: 'User not found' };

    return { success: true, services: user.services };
  }

  // Remove service from user
  removeServiceFromUser(userId, serviceId) {
    const index = this.users.findIndex(user => user.id === userId);
    if (index === -1) return { success: false, message: 'User not found' };

    // Find service index
    const serviceIndex = this.users[index].services.findIndex(service => service.id === serviceId);
    if (serviceIndex === -1) return { success: false, message: 'Service not found' };

    // Remove service
    this.users[index].services.splice(serviceIndex, 1);
    this.saveUsers();

    return { success: true, services: this.users[index].services };
  }
}

module.exports = new UserModel();
