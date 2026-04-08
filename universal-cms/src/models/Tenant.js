const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Tenant extends BaseModel {
  constructor() {
    super('tenants');
  }

  async findBySubdomain(subdomain) {
    const sql = 'SELECT * FROM tenants WHERE subdomain = $1 AND status = $2';
    const result = await query(sql, [subdomain, 'active']);
    return result.rows[0] || null;
  }

  async findByCustomDomain(domain) {
    const sql = `
      SELECT t.* FROM tenants t
      JOIN domains d ON t.id = d.tenant_id
      WHERE d.domain = $1 AND d.status = 'active' AND t.status = 'active'
    `;
    const result = await query(sql, [domain]);
    return result.rows[0] || null;
  }

  async createWithOwner(data, ownerId) {
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');

      // Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, subdomain, plan, status, settings)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.name, data.subdomain, data.plan || 'free', 'active', JSON.stringify(data.settings || {})]
      );
      const tenant = tenantResult.rows[0];

      // Add owner as member
      await client.query(
        `INSERT INTO tenant_members (tenant_id, user_id, role, status)
         VALUES ($1, $2, $3, $4)`,
        [tenant.id, ownerId, 'owner', 'active']
      );

      await client.query('COMMIT');
      return tenant;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMembers(tenantId) {
    const sql = `
      SELECT u.id, u.email, u.full_name, tm.role, tm.status, tm.joined_at
      FROM tenant_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.tenant_id = $1
      ORDER BY tm.role DESC, u.email ASC
    `;
    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  async addMember(tenantId, userId, role = 'member') {
    const sql = `
      INSERT INTO tenant_members (tenant_id, user_id, role, status)
      VALUES ($1, $2, $3, 'pending')
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = $3, status = 'pending'
      RETURNING *
    `;
    const result = await query(sql, [tenantId, userId, role]);
    return result.rows[0];
  }

  async updateMemberRole(tenantId, userId, role) {
    const sql = `
      UPDATE tenant_members
      SET role = $3
      WHERE tenant_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await query(sql, [tenantId, userId, role]);
    return result.rows[0];
  }

  async removeMember(tenantId, userId) {
    const sql = `
      DELETE FROM tenant_members
      WHERE tenant_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await query(sql, [tenantId, userId]);
    return result.rows[0];
  }

  async checkPlanLimit(tenantId, feature) {
    const tenant = await this.findById(tenantId);
    if (!tenant) return false;

    const planLimits = {
      free: { collections: 5, storage: 104857600, pages: 10 }, // 100MB
      pro: { collections: 50, storage: 10737418240, pages: 100 }, // 10GB
      business: { collections: 500, storage: 107374182400, pages: 1000 }, // 100GB
      enterprise: { collections: -1, storage: -1, pages: -1 } // Unlimited
    };

    const limits = planLimits[tenant.plan] || planLimits.free;
    const limit = limits[feature];

    // -1 means unlimited
    if (limit === -1) return true;

    // Check current usage
    let count = 0;
    if (feature === 'collections') {
      const res = await query('SELECT COUNT(*) as total FROM collections WHERE tenant_id = $1', [tenantId]);
      count = parseInt(res.rows[0].total, 10);
    } else if (feature === 'pages') {
      const res = await query('SELECT COUNT(*) as total FROM pages WHERE tenant_id = $1', [tenantId]);
      count = parseInt(res.rows[0].total, 10);
    }

    return count < limit;
  }

  async getUsage(tenantId) {
    const queries = {
      collections: 'SELECT COUNT(*) as total FROM collections WHERE tenant_id = $1',
      pages: 'SELECT COUNT(*) as total FROM pages WHERE tenant_id = $1',
      records: `
        SELECT SUM(count) as total FROM (
          SELECT COUNT(*) as count FROM records r
          JOIN collections c ON r.collection_id = c.id
          WHERE c.tenant_id = $1
        ) as sub
      `,
      media: 'SELECT SUM(size) as total FROM media_files WHERE tenant_id = $1'
    };

    const usage = {};
    for (const [key, sql] of Object.entries(queries)) {
      const result = await query(sql, [tenantId]);
      usage[key] = parseInt(result.rows[0].total || 0, 10);
    }

    return usage;
  }
}

module.exports = new Tenant();
