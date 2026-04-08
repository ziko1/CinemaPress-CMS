const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, fullName, tenantName, subdomain } = req.body;

      // Validate input
      if (!email || !password || !tenantName || !subdomain) {
        return ApiResponse.error(res, 'Missing required fields', 400);
      }

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return ApiResponse.error(res, 'User already exists', 409);
      }

      // Create user
      const user = await User.createWithPassword({
        email,
        password,
        full_name: fullName || email.split('@')[0]
      });

      // Create tenant with owner
      const tenant = await Tenant.createWithOwner(
        { name: tenantName, subdomain, plan: 'free' },
        user.id
      );

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`New user registered: ${email}, Tenant: ${subdomain}`);

      ApiResponse.success(res, {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain
        },
        token
      }, 'Registration successful');
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.error(res, 'Email and password required', 400);
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return ApiResponse.error(res, 'Invalid credentials', 401);
      }

      const isValid = await User.verifyPassword(password, user.password);
      if (!isValid) {
        return ApiResponse.error(res, 'Invalid credentials', 401);
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Get user's tenants
      const tenantsQuery = await global.pool.query(
        'SELECT t.* FROM tenants t JOIN tenant_members tm ON t.id = tm.tenant_id WHERE tm.user_id = $1 AND tm.status = $2',
        [user.id, 'active']
      );

      logger.info(`User logged in: ${email}`);

      ApiResponse.success(res, {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        },
        tenants: tenantsQuery.rows,
        token
      }, 'Login successful');
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return ApiResponse.error(res, 'Email required', 400);
      }

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return ApiResponse.success(res, {}, 'If the email exists, a reset link has been sent');
      }

      const token = await User.generateResetToken(user.id);
      
      // TODO: Send email with reset link
      // await EmailService.sendPasswordReset(user.email, token);

      logger.info(`Password reset requested for: ${email}`);

      ApiResponse.success(res, {}, 'If the email exists, a reset link has been sent');
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return ApiResponse.error(res, 'Token and new password required', 400);
      }

      const user = await User.findByResetToken(token);
      if (!user) {
        return ApiResponse.error(res, 'Invalid or expired token', 400);
      }

      await User.updatePassword(user.id, newPassword);
      await User.clearResetToken(user.id);

      logger.info(`Password reset completed for: ${user.email}`);

      ApiResponse.success(res, {}, 'Password updated successfully');
    } catch (error) {
      logger.error('Reset password error:', error);
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await User.findByIdWithTenant(req.user.userId, req.tenant.id);
      
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      ApiResponse.success(res, {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.tenant_role
      });
    } catch (error) {
      logger.error('Get me error:', error);
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { fullName, avatar } = req.body;
      const updates = {};

      if (fullName) updates.full_name = fullName;
      if (avatar) updates.avatar_url = avatar;

      const user = await User.update(req.user.userId, updates);

      ApiResponse.success(res, {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url
      }, 'Profile updated');
    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }
}

module.exports = new AuthController();
