import { asyncHandler } from '../middleware/error.middleware.js';
import Page from '../models/Page.js';
import ApiResponse from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';

class PageController {
  /**
   * Get all pages for tenant
   */
  static async getPages(req, res) {
    const { status, limit = 20, offset = 0 } = req.query;
    
    const filters = { tenantId: req.tenant.id };
    if (status) filters.status = status;

    const pages = await Page.find(filters, { limit: parseInt(limit), offset: parseInt(offset) });
    const total = await Page.count(filters);

    ApiResponse.success(res, 200, 'Pages retrieved', {
      count: pages.length,
      total,
      data: pages,
    });
  }

  /**
   * Get page by ID or slug
   */
  static async getPage(req, res) {
    const { id } = req.params;
    
    const page = await Page.findByIdOrSlug(id, req.tenant.id);
    
    if (!page) {
      return ApiResponse.error(res, 404, 'Page not found');
    }

    ApiResponse.success(res, 200, 'Page retrieved', page);
  }

  /**
   * Create new page
   */
  static async createPage(req, res) {
    const { title, slug, template, content, seo } = req.body;

    const pageData = {
      tenantId: req.tenant.id,
      title,
      slug,
      template: template || 'default',
      content: content || { components: [] },
      seo: seo || {},
      status: 'draft',
      createdBy: req.user.userId,
    };

    const page = await Page.create(pageData);

    logger.info(`Page created: ${page.id} by user ${req.user.userId}`);

    ApiResponse.success(res, 201, 'Page created', page);
  }

  /**
   * Update page
   */
  static async updatePage(req, res) {
    const { id } = req.params;
    const updates = req.body;

    // Remove immutable fields
    delete updates.tenantId;
    delete updates.createdBy;

    const page = await Page.update(id, {
      ...updates,
      updatedBy: req.user.userId,
    });

    logger.info(`Page updated: ${page.id} by user ${req.user.userId}`);

    ApiResponse.success(res, 200, 'Page updated', page);
  }

  /**
   * Publish page
   */
  static async publishPage(req, res) {
    const { id } = req.params;

    const page = await Page.update(id, {
      status: 'published',
      publishedAt: new Date(),
      publishedBy: req.user.userId,
    });

    logger.info(`Page published: ${page.id}`);

    ApiResponse.success(res, 200, 'Page published', page);
  }

  /**
   * Unpublish page
   */
  static async unpublishPage(req, res) {
    const { id } = req.params;

    const page = await Page.update(id, {
      status: 'draft',
    });

    logger.info(`Page unpublished: ${page.id}`);

    ApiResponse.success(res, 200, 'Page unpublished', page);
  }

  /**
   * Delete page
   */
  static async deletePage(req, res) {
    const { id } = req.params;

    await Page.delete(id);

    logger.info(`Page deleted: ${id}`);

    ApiResponse.success(res, 200, 'Page deleted');
  }

  /**
   * Get page versions
   */
  static async getVersions(req, res) {
    const { id } = req.params;

    const versions = await Page.getVersions(id);

    ApiResponse.success(res, 200, 'Versions retrieved', {
      count: versions.length,
      data: versions,
    });
  }

  /**
   * Restore page version
   */
  static async restoreVersion(req, res) {
    const { id, versionId } = req.params;

    const page = await Page.restoreVersion(id, versionId);

    logger.info(`Page version restored: ${id}, version: ${versionId}`);

    ApiResponse.success(res, 200, 'Version restored', page);
  }
}

export default PageController;
