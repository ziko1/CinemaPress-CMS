const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Collection extends BaseModel {
  constructor() {
    super('collections');
  }

  async findBySlug(tenantId, slug) {
    const sql = 'SELECT * FROM collections WHERE tenant_id = $1 AND slug = $2';
    const result = await query(sql, [tenantId, slug]);
    return result.rows[0] || null;
  }

  async findAllWithCount(tenantId) {
    const sql = `
      SELECT c.*, COUNT(r.id) as record_count
      FROM collections c
      LEFT JOIN records r ON c.id = r.collection_id
      WHERE c.tenant_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  async createWithSchema(tenantId, name, slug, schema, options = {}) {
    // Validate schema structure
    if (!Array.isArray(schema)) {
      throw new Error('Schema must be an array of field definitions');
    }

    // Check for required fields
    const hasNameField = schema.some(f => f.name === 'name' || f.name === 'title');
    if (!hasNameField && !options.skipValidation) {
      throw new Error('Schema must include a "name" or "title" field');
    }

    return this.create({
      tenant_id: tenantId,
      name,
      slug,
      schema: JSON.stringify(schema),
      is_published: options.isPublished || false,
      settings: JSON.stringify(options.settings || {})
    });
  }

  async updateSchema(id, newSchema) {
    if (!Array.isArray(newSchema)) {
      throw new Error('Schema must be an array of field definitions');
    }

    return this.update(id, {
      schema: JSON.stringify(newSchema),
      updated_at: new Date()
    });
  }

  async getSchema(id) {
    const collection = await this.findById(id);
    if (!collection) return null;
    
    try {
      return typeof collection.schema === 'string' 
        ? JSON.parse(collection.schema) 
        : collection.schema;
    } catch (e) {
      return [];
    }
  }

  async validateRecord(collectionId, recordData) {
    const schema = await this.getSchema(collectionId);
    if (!schema) throw new Error('Collection not found');

    const errors = [];
    
    for (const field of schema) {
      const value = recordData[field.name];
      
      // Required check
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field "${field.name}" is required`);
        continue;
      }

      // Type validation
      if (value !== undefined && value !== null) {
        switch (field.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Field "${field.name}" must be a number`);
            }
            break;
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`Field "${field.name}" must be a valid email`);
            }
            break;
          case 'url':
            try {
              new URL(value);
            } catch {
              errors.push(`Field "${field.name}" must be a valid URL`);
            }
            break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async deleteWithRecords(id) {
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete all records first
      await client.query('DELETE FROM records WHERE collection_id = $1', [id]);
      
      // Delete collection
      await client.query('DELETE FROM collections WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new Collection();
