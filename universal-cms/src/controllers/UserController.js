import { asyncHandler } from '../middleware/error.middleware.js';
import User from '../models/User.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

class UserController {
  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return ApiResponse.error(res, 404, 'User not found');
    }

    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    };

    ApiResponse.success(res, 200, 'Profile retrieved', profile);
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    const { name, avatar } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.update(req.user.userId, updates);

    logger.info(`User ${req.user.userId} updated profile`);

    ApiResponse.success(res, 200, 'Profile updated', {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    });
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ApiResponse.error(res, 400, 'Current and new password required');
    }

    const user = await User.findById(req.user.userId);
    
    // Verify current password
    const isValid = await require('bcryptjs').compare(currentPassword, user.password);
    if (!isValid) {
      return ApiResponse.error(res, 401, 'Current password is incorrect');
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.update(user.id, { password: hashedPassword });

    logger.info(`User ${user.id} changed password`);

    ApiResponse.success(res, 200, 'Password changed successfully');
  }

  /**
   * Get user's tenants
   */
  static async getTenants(req, res) {
    const Tenant = (await import('../models/Tenant.js')).default;
    
    const tenants = await Tenant.getUserTenants(req.user.userId);

    ApiResponse.success(res, 200, 'Tenants retrieved', {
      count: tenants.length,
      data: tenants.map(t => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        plan: t.plan,
        role: t.role,
      })),
    });
  }
}

export default UserController;
