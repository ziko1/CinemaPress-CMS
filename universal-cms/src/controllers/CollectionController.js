const Collection = require('../models/Collection');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

class CollectionController {
  async list(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const collections = await Collection.findAllWithCount(tenantId);
      ApiResponse.success(res, collections);
    } catch (error) {
      logger.error('List collections error:', error);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const { name, slug, schema, options } = req.body;

      if (!name || !slug) {
        return ApiResponse.error(res, 'Name and slug required', 400);
      }

      // Check plan limits
      const canCreate = await global.tenantService.checkPlanLimit(tenantId, 'collections');
      if (!canCreate) {
        return ApiResponse.error(res, 'Collection limit reached. Upgrade your plan.', 403);
      }

      const collection = await Collection.createWithSchema(tenantId, name, slug, schema, options);
      logger.info(`Collection created: ${slug} in tenant ${tenantId}`);
      
      ApiResponse.success(res, collection, 'Collection created', 201);
    } catch (error) {
      logger.error('Create collection error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const collection = await Collection.findById(id);

      if (!collection || collection.tenant_id !== req.tenant.id) {
        return ApiResponse.error(res, 'Collection not found', 404);
      }

      ApiResponse.success(res, collection);
    } catch (error) {
      logger.error('Get collection error:', error);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, schema, options } = req.body;

      const collection = await Collection.findById(id);
      if (!collection || collection.tenant_id !== req.tenant.id) {
        return ApiResponse.error(res, 'Collection not found', 404);
      }

      const updates = {};
      if (name) updates.name = name;
      if (schema) {
        await Collection.updateSchema(id, schema);
      }
      if (options) updates.settings = JSON.stringify(options);

      const updated = await Collection.update(id, updates);
      ApiResponse.success(res, updated);
    } catch (error) {
      logger.error('Update collection error:', error);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const collection = await Collection.findById(id);

      if (!collection || collection.tenant_id !== req.tenant.id) {
        return ApiResponse.error(res, 'Collection not found', 404);
      }

      await Collection.deleteWithRecords(id);
      logger.info(`Collection deleted: ${id}`);
      
      ApiResponse.success(res, {}, 'Collection deleted');
    } catch (error) {
      logger.error('Delete collection error:', error);
      next(error);
    }
  }

  async getSchema(req, res, next) {
    try {
      const { id } = req.params;
      const schema = await Collection.getSchema(id);

      if (!schema) {
        return ApiResponse.error(res, 'Collection not found', 404);
      }

      ApiResponse.success(res, { schema });
    } catch (error) {
      logger.error('Get schema error:', error);
      next(error);
    }
  }
}

module.exports = new CollectionController();
