const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Page extends BaseModel {
  constructor() {
    super('pages');
  }

  async findBySlug(tenantId, slug) {
    const sql = `
      SELECT p.*, u.email as author_email
      FROM pages p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.tenant_id = $1 AND p.slug = $2
      ORDER BY p.created_at DESC
      LIMIT 1
    `;
    const result = await query(sql, [tenantId, slug]);
    return result.rows[0] || null;
  }

  async findAllPublished(tenantId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const sql = `
      SELECT p.*, u.email as author_email
      FROM pages p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.tenant_id = $1 AND p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [tenantId, limit, offset]);
    return result.rows;
  }

  async createWithContent(tenantId, title, slug, content, options = {}) {
    return this.create({
      tenant_id: tenantId,
      title,
      slug,
      content: JSON.stringify(content), // Builder JSON structure
      status: options.status || 'draft',
      template: options.template || 'default',
      author_id: options.authorId,
      seo_data: JSON.stringify(options.seoData || {}),
      settings: JSON.stringify(options.settings || {})
    });
  }

  async updateContent(id, newContent, options = {}) {
    const updates = {
      content: JSON.stringify(newContent),
      updated_at: new Date()
    };

    if (options.status) updates.status = options.status;
    if (options.seoData) updates.seo_data = JSON.stringify(options.seoData);

    return this.update(id, updates);
  }

  async getContent(id) {
    const page = await this.findById(id);
    if (!page) return null;
    
    try {
      return typeof page.content === 'string' 
        ? JSON.parse(page.content) 
        : page.content;
    } catch (e) {
      return {};
    }
  }

  async getSeoData(id) {
    const page = await this.findById(id);
    if (!page) return null;
    
    try {
      return typeof page.seo_data === 'string' 
        ? JSON.parse(page.seo_data) 
        : page.seo_data;
    } catch (e) {
      return {};
    }
  }

  async publish(id, options = {}) {
    const updates = {
      status: 'published',
      published_at: new Date()
    };

    if (options.publishedAt) updates.published_at = options.publishedAt;

    return this.update(id, updates);
  }

  async unpublish(id) {
    return this.update(id, {
      status: 'draft',
      published_at: null
    });
  }

  async getVersionHistory(id) {
    const sql = `
      SELECT * FROM page_versions
      WHERE page_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const result = await query(sql, [id]);
    return result.rows;
  }

  async createVersion(pageId, userId, content, changeDescription) {
    const sql = `
      INSERT INTO page_versions (page_id, user_id, content, change_description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await query(sql, [pageId, userId, JSON.stringify(content), changeDescription]);
    return result.rows[0];
  }

  async restoreVersion(versionId) {
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');

      // Get version data
      const versionResult = await client.query(
        'SELECT * FROM page_versions WHERE id = $1',
        [versionId]
      );
      const version = versionResult.rows[0];

      if (!version) throw new Error('Version not found');

      // Update page content
      await client.query(
        'UPDATE pages SET content = $1, updated_at = NOW() WHERE id = $2',
        [version.content, version.page_id]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteWithVersions(id) {
    const client = await global.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete versions first
      await client.query('DELETE FROM page_versions WHERE page_id = $1', [id]);
      
      // Delete page
      await client.query('DELETE FROM pages WHERE id = $1', [id]);
      
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

module.exports = new Page();
