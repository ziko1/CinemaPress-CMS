import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class AuthService {
  /**
   * Register new user
   */
  static async register({ email, password, name, tenantName }) {
    try {
      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user and tenant in transaction
      const userData = {
        email,
        password: hashedPassword,
        name,
        role: 'owner',
      };

      const user = await User.create(userData);
      
      // Create default tenant
      const tenantData = {
        name: tenantName || `${name}'s Project`,
        subdomain: tenantName ? tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-') : `user-${user.id}`,
        ownerId: user.id,
        plan: 'free',
      };

      const tenant = await Tenant.create(tenantData);

      // Add user to tenant as owner
      await Tenant.addMember(tenant.id, user.id, 'owner');

      // Generate JWT
      const token = this.generateToken(user, tenant);

      logger.info(`New user registered: ${email}, Tenant: ${tenant.subdomain}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: tenant.plan,
        },
        token,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login({ email, password, tenantId }) {
    try {
      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Get tenant
      let tenant;
      if (tenantId) {
        tenant = await Tenant.findById(tenantId);
        if (!tenant) {
          throw new Error('Tenant not found');
        }
      } else {
        // Get user's first tenant
        const tenants = await Tenant.getUserTenants(user.id);
        tenant = tenants[0];
        if (!tenant) {
          throw new Error('No tenant associated with this user');
        }
      }

      // Check if user is member of tenant
      const isMember = await Tenant.isMember(tenant.id, user.id);
      if (!isMember) {
        throw new Error('User is not a member of this tenant');
      }

      // Generate JWT
      const token = this.generateToken(user, tenant);

      logger.info(`User logged in: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: tenant.plan,
        },
        token,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  static generateToken(user, tenant) {
    const payload = {
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
      tenantSubdomain: tenant.subdomain,
      role: user.role,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn || '7d',
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(token, tenantId) {
    try {
      const decoded = this.verifyToken(token);
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const tenant = await Tenant.findById(tenantId || decoded.tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Generate new token
      const newToken = this.generateToken(user, tenant);

      return { token: newToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return { success: true, message: 'If the email exists, a reset link will be sent' };
      }

      // Generate reset token
      const resetToken = await User.generateResetToken(user.id);
      
      // TODO: Send email with reset link
      logger.info(`Password reset requested for ${email}. Token: ${resetToken}`);

      return {
        success: true,
        message: 'If the email exists, a reset link will be sent',
        resetToken, // Remove in production, send via email
      };
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(token, newPassword) {
    try {
      // Verify reset token
      const user = await User.verifyResetToken(token);
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await User.update(user.id, { 
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });

      logger.info(`Password reset successful for ${user.email}`);

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }
}

export default AuthService;
