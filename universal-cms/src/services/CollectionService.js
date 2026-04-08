/**
 * Collection Service - Dynamic CMS collections management
 * Handles schema creation, CRUD operations, and versioning
 */

const { v4: uuidv4 } = require('uuid');

class CollectionService {
  constructor(pool) {
    this.pool = pool;
    this.allowedFieldTypes = [
      'text', 'number', 'boolean', 'date', 'datetime', 'email', 'url',
      'richtext', 'markdown', 'json', 'image', 'gallery', 'file', 'video',
      'relation', 'repeater', 'computed', 'seo', 'location', 'color'
    ];
  }

  /**
   * Create a new collection
   */
  async createCollection(tenantId, data, userId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const collectionId = uuidv4();
      const slug = this.generateSlug(data.name);
      
      // Validate schema
      const validatedSchema = this.validateSchema(data.schema || []);
      
      // Add default fields (id, created_at, updated_at)
      const fullSchema = [
        ...validatedSchema,
        { name: '_created_at', type: 'datetime', hidden: true },
        { name: '_updated_at', type: 'datetime', hidden: true },
        { name: '_published_at', type: 'datetime', hidden: true },
        { name: '_status', type: 'text', hidden: true }
      ];
      
      const result = await client.query(`
        INSERT INTO collections (
          id, tenant_id, name, slug, description, icon, 
          schema, settings, is_published, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        collectionId,
        tenantId,
        data.name,
        slug,
        data.description || null,
        data.icon || 'document',
        JSON.stringify(fullSchema),
        JSON.stringify(data.settings || {}),
        data.is_published || false,
        userId
      ]);
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get collection by ID
   */
  async getCollection(collectionId, tenantId) {
    const result = await this.pool.query(`
      SELECT * FROM collections
      WHERE id = $1 AND tenant_id = $2
    `, [collectionId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const collection = result.rows[0];
    collection.schema = typeof collection.schema === 'string' 
      ? JSON.parse(collection.schema) 
      : collection.schema;
    collection.settings = typeof collection.settings === 'string'
      ? JSON.parse(collection.settings)
      : collection.settings;
    
    return collection;
  }

  /**
   * Get all collections for tenant
   */
  async getCollections(tenantId, options = {}) {
    const { published_only = false, limit = 100, offset = 0 } = options;
    
    const query = `
      SELECT * FROM collections
      WHERE tenant_id = $1
        ${published_only ? "AND is_published = TRUE" : ""}
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.pool.query(query, [tenantId, limit, offset]);
    
    return result.rows.map(row => ({
      ...row,
      schema: typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
    }));
  }

  /**
   * Update collection
   */
  async updateCollection(collectionId, tenantId, data) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (data.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(data.name);
    }
    
    if (data.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(data.description);
    }
    
    if (data.icon !== undefined) {
      fields.push(`icon = $${index++}`);
      values.push(data.icon);
    }
    
    if (data.schema !== undefined) {
      const validatedSchema = this.validateSchema(data.schema);
      fields.push(`schema = $${index++}::jsonb`);
      values.push(JSON.stringify(validatedSchema));
    }
    
    if (data.settings !== undefined) {
      fields.push(`settings = $${index++}::jsonb`);
      values.push(JSON.stringify(data.settings));
    }
    
    if (data.is_published !== undefined) {
      fields.push(`is_published = $${index++}`);
      values.push(data.is_published);
    }
    
    if (fields.length === 0) {
      return await this.getCollection(collectionId, tenantId);
    }
    
    values.push(collectionId, tenantId);
    
    const result = await this.pool.query(`
      UPDATE collections
      SET ${fields.join(', ')}, version = version + 1, updated_at = NOW()
      WHERE id = $${index} AND tenant_id = $${index + 1}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const collection = result.rows[0];
    collection.schema = typeof collection.schema === 'string' 
      ? JSON.parse(collection.schema) 
      : collection.schema;
    
    return collection;
  }

  /**
   * Delete collection
   */
  async deleteCollection(collectionId, tenantId) {
    const result = await this.pool.query(`
      DELETE FROM collections
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [collectionId, tenantId]);
    
    return result.rows.length > 0;
  }

  /**
   * Create item in collection
   */
  async createItem(collectionId, tenantId, data, userId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get collection to validate data against schema
      const collection = await this.getCollection(collectionId, tenantId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Validate data against schema
      const validatedData = this.validateItemData(data, collection.schema);
      
      const itemId = uuidv4();
      const now = new Date();
      
      // Add system fields
      const fullData = {
        ...validatedData,
        _created_at: now,
        _updated_at: now,
        _status: data.status || 'draft'
      };
      
      if (data.published === true) {
        fullData._published_at = now;
      }
      
      const result = await client.query(`
        INSERT INTO collection_items (
          id, collection_id, tenant_id, data, status, 
          published_at, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        itemId,
        collectionId,
        tenantId,
        JSON.stringify(fullData),
        fullData._status,
        fullData._published_at || null,
        userId,
        userId
      ]);
      
      await client.query('COMMIT');
      
      const item = result.rows[0];
      item.data = typeof item.data === 'string' 
        ? JSON.parse(item.data) 
        : item.data;
      
      return item;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get items from collection
   */
  async getItems(collectionId, tenantId, options = {}) {
    const {
      status = 'published',
      limit = 20,
      offset = 0,
      sort = 'created_at',
      order = 'DESC',
      filters = {}
    } = options;
    
    let whereClause = 'WHERE collection_id = $1 AND tenant_id = $2';
    const params = [collectionId, tenantId];
    let paramIndex = 3;
    
    // Status filter
    if (status !== 'all') {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    // Custom filters (simple key-value)
    for (const [key, value] of Object.entries(filters)) {
      whereClause += ` AND data->>'${key}' = $${paramIndex++}`;
      params.push(value);
    }
    
    // Sorting
    const validSorts = ['created_at', 'updated_at', 'published_at'];
    const sortBy = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const query = `
      SELECT * FROM collection_items
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);
    
    const result = await this.pool.query(query, params);
    
    return result.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));
  }

  /**
   * Get single item by ID
   */
  async getItem(itemId, tenantId) {
    const result = await this.pool.query(`
      SELECT ci.*, c.slug as collection_slug
      FROM collection_items ci
      JOIN collections c ON ci.collection_id = c.id
      WHERE ci.id = $1 AND ci.tenant_id = $2
    `, [itemId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const item = result.rows[0];
    item.data = typeof item.data === 'string' 
      ? JSON.parse(item.data) 
      : item.data;
    
    return item;
  }

  /**
   * Update item
   */
  async updateItem(itemId, tenantId, data, userId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current item
      const currentItem = await this.getItem(itemId, tenantId);
      if (!currentItem) {
        throw new Error('Item not found');
      }
      
      // Get collection for validation
      const collection = await this.getCollection(currentItem.collection_id, tenantId);
      
      // Merge and validate data
      const mergedData = { ...currentItem.data, ...data };
      const validatedData = this.validateItemData(mergedData, collection.schema);
      
      // Update system fields
      validatedData._updated_at = new Date();
      validatedData._status = data.status || currentItem.data._status;
      
      if (data.published === true && !currentItem.data._published_at) {
        validatedData._published_at = new Date();
      }
      
      // Save version before update
      await client.query(`
        INSERT INTO collection_item_versions (item_id, version, data, created_by)
        VALUES ($1, $2, $3, $4)
      `, [
        itemId,
        currentItem.version,
        JSON.stringify(currentItem.data),
        userId
      ]);
      
      // Update item
      const result = await client.query(`
        UPDATE collection_items
        SET data = $1, status = $2, published_at = $3, 
            updated_by = $4, version = version + 1, updated_at = NOW()
        WHERE id = $5 AND tenant_id = $6
        RETURNING *
      `, [
        JSON.stringify(validatedData),
        validatedData._status,
        validatedData._published_at || null,
        userId,
        itemId,
        tenantId
      ]);
      
      await client.query('COMMIT');
      
      const item = result.rows[0];
      item.data = typeof item.data === 'string' 
        ? JSON.parse(item.data) 
        : item.data;
      
      return item;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete item
   */
  async deleteItem(itemId, tenantId) {
    const result = await this.pool.query(`
      DELETE FROM collection_items
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [itemId, tenantId]);
    
    return result.rows.length > 0;
  }

  /**
   * Publish item
   */
  async publishItem(itemId, tenantId) {
    const result = await this.pool.query(`
      UPDATE collection_items
      SET status = 'published', published_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [itemId, tenantId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const item = result.rows[0];
    item.data = typeof item.data === 'string' 
      ? JSON.parse(item.data) 
      : item.data;
    
    return item;
  }

  /**
   * Get item versions
   */
  async getItemVersions(itemId, limit = 10) {
    const result = await this.pool.query(`
      SELECT * FROM collection_item_versions
      WHERE item_id = $1
      ORDER BY version DESC
      LIMIT $2
    `, [itemId, limit]);
    
    return result.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));
  }

  /**
   * Restore item from version
   */
  async restoreItemVersion(itemId, versionNumber, userId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get version
      const versionResult = await client.query(`
        SELECT * FROM collection_item_versions
        WHERE item_id = $1 AND version = $2
      `, [itemId, versionNumber]);
      
      if (versionResult.rows.length === 0) {
        throw new Error('Version not found');
      }
      
      const version = versionResult.rows[0];
      const versionData = typeof version.data === 'string' 
        ? JSON.parse(version.data) 
        : version.data;
      
      // Restore data
      await client.query(`
        UPDATE collection_items
        SET data = $1, version = version + 1, updated_by = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [JSON.stringify(versionData), userId, itemId]);
      
      await client.query('COMMIT');
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate schema definition
   */
  validateSchema(schema) {
    if (!Array.isArray(schema)) {
      throw new Error('Schema must be an array');
    }
    
    return schema.map(field => {
      if (!field.name || !field.type) {
        throw new Error('Each field must have name and type');
      }
      
      if (!this.allowedFieldTypes.includes(field.type)) {
        throw new Error(`Invalid field type: ${field.type}`);
      }
      
      return {
        name: field.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        type: field.type,
        label: field.label || field.name,
        required: field.required || false,
        hidden: field.hidden || false,
        validation: field.validation || {},
        default: field.default,
        options: field.options
      };
    });
  }

  /**
   * Validate item data against schema
   */
  validateItemData(data, schema) {
    const validated = {};
    
    for (const field of schema) {
      const value = data[field.name];
      
      // Check required
      if (field.required && (value === undefined || value === null)) {
        throw new Error(`Field ${field.name} is required`);
      }
      
      // Skip if no value and not required
      if (value === undefined || value === null) {
        continue;
      }
      
      // Type validation (simplified)
      switch (field.type) {
        case 'number':
          validated[field.name] = Number(value);
          break;
        case 'boolean':
          validated[field.name] = Boolean(value);
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error(`Invalid email: ${value}`);
          }
          validated[field.name] = value;
          break;
        case 'url':
          try {
            new URL(value);
            validated[field.name] = value;
          } catch {
            throw new Error(`Invalid URL: ${value}`);
          }
          break;
        default:
          validated[field.name] = value;
      }
    }
    
    return validated;
  }

  /**
   * Generate URL-friendly slug
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

module.exports = CollectionService;
