const bcrypt = require('bcrypt');
const { query } = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async find(where = {}, options = {}) {
    const { limit = 100, offset = 0, orderBy = 'created_at', order = 'DESC' } = options;
    
    let sql = `SELECT * FROM ${this.tableName}`;
    const values = [];
    const conditions = [];
    
    Object.keys(where).forEach((key, index) => {
      if (where[key] !== undefined && where[key] !== null) {
        conditions.push(`${key} = $${index + 1}`);
        values.push(where[key]);
      }
    });
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY ${orderBy} ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);
    
    const result = await query(sql, values);
    return result.rows;
  }

  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(sql, values);
    return result.rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    
    const result = await query(sql, [...values, id]);
    return result.rows[0];
  }

  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  async count(where = {}) {
    let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const values = [];
    const conditions = [];
    
    Object.keys(where).forEach((key, index) => {
      if (where[key] !== undefined && where[key] !== null) {
        conditions.push(`${key} = $${index + 1}`);
        values.push(where[key]);
      }
    });
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const result = await query(sql, values);
    return parseInt(result.rows[0].total, 10);
  }
}

module.exports = BaseModel;
