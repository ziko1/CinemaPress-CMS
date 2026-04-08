/**
 * Universal No-Code CMS - Core Engine
 * Основний рушій системи управління контентом
 */

const EventEmitter = require('events');
const SchemaBuilder = require('./schema-builder');
const FieldTypes = require('./field-types');
const PluginSystem = require('./plugin-system');
const LocalizationSystem = require('./localization');

class CMSEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      site: config.site || {},
      database: config.database || {},
      storage: config.storage || {},
      cache: config.cache || {},
      locales: config.locales || ['uk'],
      defaultLocale: config.defaultLocale || 'uk'
    };
    
    this.schemas = new Map();
    this.contentTypes = new Map();
    this.plugins = new PluginSystem(this);
    this.schemaBuilder = new SchemaBuilder(this);
    this.fieldTypes = new FieldTypes();
    this.localization = new LocalizationSystem();
    
    this.middleware = [];
    this.hooks = new Map();
  }

  /**
   * Ініціалізація CMS
   */
  async init() {
    await this.emitAsync('before:init');
    
    // Ініціалізація типів полів
    await this.fieldTypes.init();
    
    // Ініціалізація локалізації
    await this.localization.init({
      defaultLocale: this.config.defaultLocale,
      supportedLocales: this.config.locales,
      translations: this.config.translations
    });
    
    // Завантаження схем
    await this.loadSchemas();
    
    // Ініціалізація плагінів
    await this.plugins.init();
    
    await this.emitAsync('after:init');
    
    return this;
  }

  /**
   * Реєстрація типу контенту
   */
  registerType(schema) {
    const validatedSchema = this.schemaBuilder.validate(schema);
    this.schemas.set(validatedSchema.name, validatedSchema);
    
    // Створення CRUD операцій для типу
    this.createCRUDOperations(validatedSchema);
    
    this.emit('type:registered', validatedSchema);
    
    return this;
  }

  /**
   * Отримання схеми за назвою
   */
  getSchema(name) {
    return this.schemas.get(name);
  }

  /**
   * Отримання всіх схем
   */
  getSchemas() {
    return Array.from(this.schemas.values());
  }

  /**
   * Видалення схеми
   */
  removeSchema(name) {
    const removed = this.schemas.delete(name);
    if (removed) {
      this.emit('type:removed', name);
    }
    return removed;
  }

  /**
   * Створення CRUD операцій для типу контенту
   */
  createCRUDOperations(schema) {
    const typeName = schema.name;
    
    this.contentTypes.set(typeName, {
      // Створення запису
      create: async (data, context = {}) => {
        await this.emitAsync('content:beforeCreate', { type: typeName, data, context });
        
        const validatedData = await this.validateData(schema, data);
        const processedData = await this.processFields(schema, validatedData, 'create');
        
        const result = await this.saveToDatabase(typeName, processedData);
        
        await this.emitAsync('content:afterCreate', { type: typeName, data: result, context });
        
        return result;
      },

      // Читання запису
      read: async (id, context = {}) => {
        await this.emitAsync('content:beforeRead', { type: typeName, id, context });
        
        const result = await this.getFromDatabase(typeName, id);
        
        if (!result) {
          throw new Error(`Content with id ${id} not found`);
        }
        
        await this.emitAsync('content:afterRead', { type: typeName, data: result, context });
        
        return result;
      },

      // Оновлення запису
      update: async (id, data, context = {}) => {
        await this.emitAsync('content:beforeUpdate', { type: typeName, id, data, context });
        
        const existing = await this.getFromDatabase(typeName, id);
        if (!existing) {
          throw new Error(`Content with id ${id} not found`);
        }
        
        const validatedData = await this.validateData(schema, data, true);
        const mergedData = { ...existing, ...validatedData };
        const processedData = await this.processFields(schema, mergedData, 'update');
        
        const result = await this.updateInDatabase(typeName, id, processedData);
        
        await this.emitAsync('content:afterUpdate', { type: typeName, data: result, context });
        
        return result;
      },

      // Видалення запису
      delete: async (id, context = {}) => {
        await this.emitAsync('content:beforeDelete', { type: typeName, id, context });
        
        const existing = await this.getFromDatabase(typeName, id);
        if (!existing) {
          throw new Error(`Content with id ${id} not found`);
        }
        
        await this.deleteFromDatabase(typeName, id);
        
        await this.emitAsync('content:afterDelete', { type: typeName, id, context });
        
        return true;
      },

      // Список записів з фільтрацією
      list: async (options = {}) => {
        await this.emitAsync('content:beforeList', { type: typeName, options });
        
        const {
          filter = {},
          sort = { createdAt: -1 },
          page = 1,
          limit = 20,
          populate = []
        } = options;
        
        const result = await this.listFromDatabase(typeName, {
          filter,
          sort,
          page,
          limit,
          populate
        });
        
        await this.emitAsync('content:afterList', { type: typeName, result, options });
        
        return result;
      }
    });
  }

  /**
   * Валідація даних відповідно до схеми
   */
  async validateData(schema, data, isUpdate = false) {
    const errors = [];
    const validatedData = {};

    for (const field of schema.fields) {
      const value = data[field.name];
      
      // Перевірка required
      if (field.required && !isUpdate && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `Field "${field.name}" is required`
        });
        continue;
      }

      // Пропуск необов'язкових полів без значення
      if (value === undefined || value === null) {
        if (field.default !== undefined) {
          validatedData[field.name] = field.default;
        }
        continue;
      }

      // Валідація типу поля
      const fieldType = this.fieldTypes.get(field.type);
      if (!fieldType) {
        errors.push({
          field: field.name,
          message: `Unknown field type "${field.type}"`
        });
        continue;
      }

      try {
        validatedData[field.name] = await fieldType.validate(value, field);
      } catch (error) {
        errors.push({
          field: field.name,
          message: error.message
        });
      }
    }

    if (errors.length > 0) {
      const validationError = new Error('Validation failed');
      validationError.errors = errors;
      throw validationError;
    }

    return validatedData;
  }

  /**
   * Обробка полів (трансформація, обчислення тощо)
   */
  async processFields(schema, data, operation) {
    const processedData = { ...data };

    for (const field of schema.fields) {
      const fieldType = this.fieldTypes.get(field.type);
      if (fieldType && fieldType.process) {
        processedData[field.name] = await fieldType.process(
          processedData[field.name],
          field,
          { data: processedData, operation, schema }
        );
      }
    }

    return processedData;
  }

  /**
   * Еміт події з підтримкою async хуків
   */
  async emitAsync(event, payload) {
    const listeners = this.listeners(event);
    await Promise.all(listeners.map(fn => fn(payload)));
    
    // Виконання хуків плагінів
    await this.plugins.executeHooks(event, payload);
  }

  /**
   * Реєстрація middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Виконання middleware
   */
  async runMiddleware(context) {
    let index = 0;
    
    const next = async () => {
      if (index >= this.middleware.length) return;
      
      const middleware = this.middleware[index++];
      await middleware(context, next);
    };
    
    await next();
  }

  /**
   * Завантаження схем з бази даних або файлів
   */
  async loadSchemas() {
    // TODO: Імплементація завантаження схем
    this.emit('schemas:loaded');
  }

  /**
   * Збереження в базу даних
   */
  async saveToDatabase(type, data) {
    // TODO: Імплементація через database adapter
    const id = Date.now().toString();
    const record = {
      _id: id,
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return record;
  }

  /**
   * Отримання з бази даних
   */
  async getFromDatabase(type, id) {
    // TODO: Імплементація через database adapter
    return null;
  }

  /**
   * Оновлення в базі даних
   */
  async updateInDatabase(type, id, data) {
    // TODO: Імплементація через database adapter
    return {
      ...data,
      updatedAt: new Date()
    };
  }

  /**
   * Видалення з бази даних
   */
  async deleteFromDatabase(type, id) {
    // TODO: Імплементація через database adapter
    return true;
  }

  /**
   * Отримання списку з бази даних
   */
  async listFromDatabase(type, options) {
    // TODO: Імплементація через database adapter
    return {
      data: [],
      pagination: {
        page: options.page,
        limit: options.limit,
        total: 0,
        pages: 0
      }
    };
  }

  /**
   * Отримання доступних операцій для типу
   */
  getContentTypeOperations(typeName) {
    return this.contentTypes.get(typeName);
  }

  /**
   * Експорт конфігурації
   */
  exportConfig() {
    return {
      config: this.config,
      schemas: this.getSchemas().map(s => ({
        ...s,
        fields: s.fields.map(f => ({
          name: f.name,
          type: f.type,
          label: f.label,
          required: f.required,
          localized: f.localized,
          validation: f.validation
        }))
      }))
    };
  }

  /**
   * Імпорт конфігурації
   */
  importConfig(config) {
    if (config.config) {
      this.config = { ...this.config, ...config.config };
    }
    
    if (config.schemas) {
      config.schemas.forEach(schema => this.registerType(schema));
    }
    
    return this;
  }
}

module.exports = CMSEngine;
