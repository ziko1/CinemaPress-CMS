const Tenant = require('../models/Tenant');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

class TenantController {
  async list(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const query = `
        SELECT t.*, tm.role as user_role
        FROM tenants t
        JOIN tenant_members tm ON t.id = tm.tenant_id
        WHERE tm.user_id = $1 AND tm.status = 'active'
        ORDER BY t.created_at DESC
      `;
      
      const result = await global.pool.query(query, [userId]);
      
      ApiResponse.success(res, result.rows, 'Tenants retrieved successfully');
    } catch (error) {
      logger.error('List tenants error:', error);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, subdomain, plan = 'free' } = req.body;
      const userId = req.user.userId;

      if (!name || !subdomain) {
        return ApiResponse.error(res, 'Name and subdomain required', 400);
      }

      // Check if subdomain is taken
      const existing = await Tenant.findBySubdomain(subdomain);
      if (existing) {
        return ApiResponse.error(res, 'Subdomain already taken', 409);
      }

      const tenant = await Tenant.createWithOwner(
        { name, subdomain, plan },
        userId
      );

      logger.info(`New tenant created: ${subdomain} by user ${userId}`);

      ApiResponse.success(res, tenant, 'Tenant created successfully', 201);
    } catch (error) {
      logger.error('Create tenant error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findById(id);

      if (!tenant) {
        return ApiResponse.error(res, 'Tenant not found', 404);
      }

      // Check permission
      const memberQuery = await global.pool.query(
        'SELECT * FROM tenant_members WHERE tenant_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      if (memberQuery.rows.length === 0) {
        return ApiResponse.error(res, 'Access denied', 403);
      }

      ApiResponse.success(res, tenant);
    } catch (error) {
      logger.error('Get tenant error:', error);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, settings } = req.body;

      // Check permission (owner or admin only)
      const memberQuery = await global.pool.query(
        'SELECT role FROM tenant_members WHERE tenant_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      if (memberQuery.rows.length === 0 || !['owner', 'admin'].includes(memberQuery.rows[0].role)) {
        return ApiResponse.error(res, 'Access denied', 403);
      }

      const updates = {};
      if (name) updates.name = name;
      if (settings) updates.settings = JSON.stringify(settings);

      const tenant = await Tenant.update(id, updates);

      ApiResponse.success(res, tenant, 'Tenant updated successfully');
    } catch (error) {
      logger.error('Update tenant error:', error);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Only owner can delete
      const memberQuery = await global.pool.query(
        'SELECT role FROM tenant_members WHERE tenant_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      if (memberQuery.rows.length === 0 || memberQuery.rows[0].role !== 'owner') {
        return ApiResponse.error(res, 'Only owner can delete tenant', 403);
      }

      // Soft delete - set status to deleted
      await Tenant.update(id, { status: 'deleted' });

      logger.info(`Tenant deleted: ${id}`);

      ApiResponse.success(res, {}, 'Tenant deleted successfully');
    } catch (error) {
      logger.error('Delete tenant error:', error);
      next(error);
    }
  }

  async getMembers(req, res, next) {
    try {
      const { id } = req.params;
      const members = await Tenant.getMembers(id);

      ApiResponse.success(res, members);
    } catch (error) {
      logger.error('Get members error:', error);
      next(error);
    }
  }

  async inviteMember(req, res, next) {
    try {
      const { id } = req.params;
      const { email, role = 'member' } = req.body;

      if (!email) {
        return ApiResponse.error(res, 'Email required', 400);
      }

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return ApiResponse.error(res, 'User not found. Please ask them to register first.', 404);
      }

      // Add member
      const member = await Tenant.addMember(id, user.id, role);

      logger.info(`Member invited: ${email} to tenant ${id}`);

      ApiResponse.success(res, member, 'Invitation sent successfully', 201);
    } catch (error) {
      logger.error('Invite member error:', error);
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const { id, userId } = req.params;
      const { role } = req.body;

      if (!role || !['owner', 'admin', 'editor', 'member'].includes(role)) {
        return ApiResponse.error(res, 'Invalid role', 400);
      }

      // Only owner can change roles
      const memberQuery = await global.pool.query(
        'SELECT role FROM tenant_members WHERE tenant_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      if (memberQuery.rows.length === 0 || memberQuery.rows[0].role !== 'owner') {
        return ApiResponse.error(res, 'Only owner can change roles', 403);
      }

      const member = await Tenant.updateMemberRole(id, userId, role);

      ApiResponse.success(res, member, 'Role updated successfully');
    } catch (error) {
      logger.error('Update member role error:', error);
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const { id, userId } = req.params;

      // Owner or admin can remove members
      const memberQuery = await global.pool.query(
        'SELECT role FROM tenant_members WHERE tenant_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      if (memberQuery.rows.length === 0 || !['owner', 'admin'].includes(memberQuery.rows[0].role)) {
        return ApiResponse.error(res, 'Access denied', 403);
      }

      await Tenant.removeMember(id, userId);

      ApiResponse.success(res, {}, 'Member removed successfully');
    } catch (error) {
      logger.error('Remove member error:', error);
      next(error);
    }
  }

  async getSettings(req, res, next) {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findById(id);

      if (!tenant) {
        return ApiResponse.error(res, 'Tenant not found', 404);
      }

      ApiResponse.success(res, {
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        settings: typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings
      });
    } catch (error) {
      logger.error('Get settings error:', error);
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const { id } = req.params;
      const settings = req.body;

      const tenant = await Tenant.update(id, {
        settings: JSON.stringify(settings)
      });

      ApiResponse.success(res, tenant.settings, 'Settings updated');
    } catch (error) {
      logger.error('Update settings error:', error);
      next(error);
    }
  }

  async addDomain(req, res, next) {
    try {
      const { id } = req.params;
      const { domain } = req.body;

      if (!domain) {
        return ApiResponse.error(res, 'Domain required', 400);
      }

      const result = await global.pool.query(
        'INSERT INTO domains (tenant_id, domain, status) VALUES ($1, $2, $3) RETURNING *',
        [id, domain, 'pending']
      );

      ApiResponse.success(res, result.rows[0], 'Domain added. Please verify DNS settings.', 201);
    } catch (error) {
      logger.error('Add domain error:', error);
      next(error);
    }
  }

  async removeDomain(req, res, next) {
    try {
      const { id, domainId } = req.params;

      await global.pool.query(
        'DELETE FROM domains WHERE id = $1 AND tenant_id = $2',
        [domainId, id]
      );

      ApiResponse.success(res, {}, 'Domain removed');
    } catch (error) {
      logger.error('Remove domain error:', error);
      next(error);
    }
  }
}

module.exports = new TenantController();
