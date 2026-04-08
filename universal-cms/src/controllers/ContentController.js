const ContentService = require('../services/ContentService');
const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/ApiResponse');

class ContentController {
  /**
   * Отримати записи колекції з фільтрацією, сортуванням та пагінацією
   */
  async getRecords(req, res, next) {
    try {
      const { collectionId } = req.params;
      const { page = 1, limit = 20, sort, filter, status = 'published' } = req.query;
      
      const tenantId = req.tenant.id;

      const result = await ContentService.getRecords({
        tenantId,
        collectionId,
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        filter: filter ? JSON.parse(filter) : {},
        status
      });

      return ApiResponse.success(res, 'Records retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Отримати один запис по ID
   */
  async getRecordById(req, res, next) {
    try {
      const { collectionId, id } = req.params;
      const tenantId = req.tenant.id;

      const record = await ContentService.getRecordById(tenantId, collectionId, id);

      if (!record) {
        return ApiResponse.error(res, 'Record not found', 404);
      }

      return ApiResponse.success(res, 'Record retrieved successfully', record);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Створити новий запис
   */
  async createRecord(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.error(res, 'Validation failed', 400, errors.array());
      }

      const { collectionId } = req.params;
      const data = req.body;
      const tenantId = req.tenant.id;
      const userId = req.user.id;

      const record = await ContentService.createRecord({
        tenantId,
        collectionId,
        data,
        userId,
        status: data.status || 'draft'
      });

      return ApiResponse.success(res, 'Record created successfully', record, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Оновити існуючий запис
   */
  async updateRecord(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.error(res, 'Validation failed', 400, errors.array());
      }

      const { collectionId, id } = req.params;
      const data = req.body;
      const tenantId = req.tenant.id;
      const userId = req.user.id;

      const record = await ContentService.updateRecord({
        tenantId,
        collectionId,
        id,
        data,
        userId
      });

      if (!record) {
        return ApiResponse.error(res, 'Record not found', 404);
      }

      return ApiResponse.success(res, 'Record updated successfully', record);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Видалити запис
   */
  async deleteRecord(req, res, next) {
    try {
      const { collectionId, id } = req.params;
      const tenantId = req.tenant.id;

      const deleted = await ContentService.deleteRecord(tenantId, collectionId, id);

      if (!deleted) {
        return ApiResponse.error(res, 'Record not found', 404);
      }

      return ApiResponse.success(res, 'Record deleted successfully', null, 204);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Опублікувати чернетку
   */
  async publishRecord(req, res, next) {
    try {
      const { collectionId, id } = req.params;
      const tenantId = req.tenant.id;
      const userId = req.user.id;

      const record = await ContentService.publishRecord(tenantId, collectionId, id, userId);

      if (!record) {
        return ApiResponse.error(res, 'Record not found', 404);
      }

      return ApiResponse.success(res, 'Record published successfully', record);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContentController();
