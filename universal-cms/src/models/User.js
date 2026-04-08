const bcrypt = require('bcrypt');
const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0] || null;
  }

  async findByIdWithTenant(userId, tenantId) {
    const sql = `
      SELECT u.*, tm.role as tenant_role
      FROM users u
      LEFT JOIN tenant_members tm ON u.id = tm.user_id AND tm.tenant_id = $2
      WHERE u.id = $1
    `;
    const result = await query(sql, [userId, tenantId]);
    return result.rows[0] || null;
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  async createWithPassword(userData) {
    const { password, ...rest } = userData;
    const hashedPassword = await this.hashPassword(password);
    return this.create({ ...rest, password: hashedPassword });
  }

  async updatePassword(id, newPassword) {
    const hashedPassword = await this.hashPassword(newPassword);
    return this.update(id, { password: hashedPassword });
  }

  async generateResetToken(id) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expiresAt, id]
    );

    return token;
  }

  async findByResetToken(token) {
    const sql = `
      SELECT * FROM users 
      WHERE reset_token = $1 
      AND reset_token_expires > NOW()
    `;
    const result = await query(sql, [token]);
    return result.rows[0] || null;
  }

  async clearResetToken(id) {
    await query(
      'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
      [id]
    );
  }
}

module.exports = new User();
