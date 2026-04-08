/**
 * Schema Builder - Конструктор схем даних
 * Дозволяє створювати, валідувати та модифікувати схеми типів контенту
 */

class SchemaBuilder {
  constructor(cms) {
    this.cms = cms;
    this.schemaTemplates = new Map();
    this.fieldPresets = new Map();
    
    this.initPresets();
  }

  /**
   * Ініціалізація пресетів полів
   */
  initPresets() {
    // Пресет для SEO полів
    this.fieldPresets.set('seo', [
      { name: 'metaTitle', type: 'text', label: 'Meta Title', maxLength: 60 },
      { name: 'metaDescription', type: 'textarea', label: 'Meta Description', maxLength: 160 },
      { name: 'metaKeywords', type: 'tags', label: 'Meta Keywords' },
      { name: 'ogImage', type: 'image', label: 'Open Graph Image' },
      { name: 'slug', type: 'slug', label: 'URL Slug', fromField: 'title' }
    ]);

    // Пресет для публікацій
    this.fieldPresets.set('publishable', [
      { name: 'status', type: 'select', label: 'Status', options: ['draft', 'published', 'archived'], default: 'draft' },
      { name: 'publishedAt', type: 'datetime', label: 'Published At' },
      { name: 'scheduledFor', type: 'datetime', label: 'Schedule For' },
      { name: 'expiresAt', type: 'datetime', label: 'Expires At' }
    ]);

    // Пресет для авторства
    this.fieldPresets.set('authorship', [
      { name: 'author', type: 'relation', label: 'Author', target: 'user' },
      { name: 'createdAt', type: 'datetime', label: 'Created At', autoGenerate: true },
      { name: 'updatedAt', type: 'datetime', label: 'Updated At', autoUpdate: true }
    ]);

    // Пресет для медіа
    this.fieldPresets.set('media', [
      { name: 'featuredImage', type: 'image', label: 'Featured Image' },
      { name: 'gallery', type: 'gallery', label: 'Image Gallery' },
      { name: 'video', type: 'video', label: 'Video' },
      { name: 'attachments', type: 'files', label: 'Attachments' }
    ]);

    // Пресет для локалізації
    this.fieldPresets.set('localized', [
      { name: 'locale', type: 'select', label: 'Language', options: this.cms.config.locales },
      { name: 'translations', type: 'multirelation', label: 'Translations', target: 'self' }
    ]);
  }

  /**
   * Створення нової схеми
   */
  create(name, options = {}) {
    const schema = {
      name,
      label: options.label || this.humanizeName(name),
      description: options.description || '',
      icon: options.icon || 'document',
      singleton: options.singleton || false,
      draftable: options.draftable !== false,
      localized: options.localized || false,
      timestamps: options.timestamps !== false,
      fields: [],
      indexes: options.indexes || [],
      permissions: options.permissions || {},
      workflows: options.workflows || null,
      templates: options.templates || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return schema;
  }

  /**
   * Додавання групи полів до схеми
   */
  addFields(schema, fields) {
    schema.fields = [...schema.fields, ...fields];
    return this;
  }

  /**
   * Додавання пресету полів
   */
  addPreset(schema, presetName) {
    const preset = this.fieldPresets.get(presetName);
    if (!preset) {
      throw new Error(`Preset "${presetName}" not found`);
    }
    
    schema.fields = [...schema.fields, ...preset];
    return this;
  }

  /**
   * Створення поля
   */
  field(name, type, options = {}) {
    const field = {
      name,
      type,
      label: options.label || this.humanizeName(name),
      required: options.required || false,
      unique: options.unique || false,
      hidden: options.hidden || false,
      readonly: options.readonly || false,
      disabled: options.disabled || false,
      defaultValue: options.default,
      placeholder: options.placeholder || '',
      helpText: options.help || '',
      validation: options.validation || {},
      localized: options.localized || false,
      translatable: options.translatable || false,
      conditional: options.conditional || null,
      computed: options.computed || null,
      ...options
    };

    // Очищення непотрібних властивостей
    delete field.default;
    delete field.help;

    return field;
  }

  /**
   * Тектове поле
   */
  text(name, options = {}) {
    return this.field(name, 'text', {
      minLength: options.minLength,
      maxLength: options.maxLength,
      pattern: options.pattern,
      transform: options.transform,
      ...options
    });
  }

  /**
   * Числове поле
   */
  number(name, options = {}) {
    return this.field(name, 'number', {
      min: options.min,
      max: options.max,
      step: options.step,
      precision: options.precision,
      currency: options.currency,
      unit: options.unit,
      ...options
    });
  }

  /**
   * Поле з багатим текстом
   */
  richtext(name, options = {}) {
    return this.field(name, 'richtext', {
      toolbar: options.toolbar || ['bold', 'italic', 'link', 'image', 'heading', 'list'],
      maxLength: options.maxLength,
      ...options
    });
  }

  /**
   * Поле вибору (select)
   */
  select(name, options = {}) {
    return this.field(name, 'select', {
      options: options.options || [],
      multiple: options.multiple || false,
      clearable: options.clearable !== false,
      ...options
    });
  }

  /**
   * Поле відношення
   */
  relation(name, target, options = {}) {
    return this.field(name, 'relation', {
      target,
      multiple: false,
      displayField: options.displayField || 'title',
      filter: options.filter,
      ...options
    });
  }

  /**
   * Поле множинного відношення
   */
  multirelation(name, target, options = {}) {
    return this.field(name, 'multirelation', {
      target,
      displayField: options.displayField || 'title',
      filter: options.filter,
      orderable: options.orderable !== false,
      ...options
    });
  }

  /**
   * Поле медіа (зображення)
   */
  image(name, options = {}) {
    return this.field(name, 'image', {
      accept: options.accept || 'image/*',
      maxSize: options.maxSize,
      minWidth: options.minWidth,
      minHeight: options.minHeight,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      aspectRatio: options.aspectRatio,
      crop: options.crop,
      thumbnails: options.thumbnails,
      ...options
    });
  }

  /**
   * Галерея зображень
   */
  gallery(name, options = {}) {
    return this.field(name, 'gallery', {
      minItems: options.minItems,
      maxItems: options.maxItems,
      orderable: options.orderable !== false,
      ...options
    });
  }

  /**
   * Повторювана група полів (repeater)
   */
  repeater(name, fields, options = {}) {
    return this.field(name, 'repeater', {
      fields,
      minItems: options.minItems,
      maxItems: options.maxItems,
      collapsible: options.collapsible !== false,
      orderable: options.orderable !== false,
      ...options
    });
  }

  /**
   * Вкладки для групування полів
   */
  tabs(name, tabs, options = {}) {
    return this.field(name, 'tabs', {
      tabs,
      defaultTab: options.defaultTab,
      ...options
    });
  }

  /**
   * Поле URL slug
   */
  slug(name, options = {}) {
    return this.field(name, 'slug', {
      fromField: options.fromField,
      separator: options.separator || '-',
      lowercase: options.lowercase !== false,
      transliterate: options.transliterate !== false,
      unique: options.unique !== false,
      ...options
    });
  }

  /**
   * JSON поле
   */
  json(name, options = {}) {
    return this.field(name, 'json', {
      schema: options.schema,
      editor: options.editor || 'code',
      validate: options.validate,
      ...options
    });
  }

  /**
   * Обчислюване поле
   */
  computed(name, computeFn, options = {}) {
    return this.field(name, 'computed', {
      compute: computeFn,
      dependencies: options.dependencies || [],
      cache: options.cache !== false,
      ...options
    });
  }

  /**
   * Умовне поле
   */
  conditional(name, field, condition, options = {}) {
    return {
      ...field,
      name,
      conditional: {
        field: condition.field,
        operator: condition.operator,
        value: condition.value
      }
    };
  }

  /**
   * Валідація схеми
   */
  validate(schema) {
    const errors = [];

    // Перевірка обов'язкових властивостей
    if (!schema.name) {
      errors.push('Schema must have a name');
    }

    if (!schema.fields || !Array.isArray(schema.fields)) {
      errors.push('Schema must have fields array');
    }

    // Перевірка унікальності імен полів
    if (schema.fields) {
      const fieldNames = new Set();
      for (const field of schema.fields) {
        if (!field.name) {
          errors.push('All fields must have a name');
          continue;
        }

        if (fieldNames.has(field.name)) {
          errors.push(`Duplicate field name: ${field.name}`);
        }
        fieldNames.add(field.name);

        // Перевірка типу поля
        if (!this.cms.fieldTypes.get(field.type)) {
          errors.push(`Unknown field type: ${field.type} in field ${field.name}`);
        }

        // Перевірка відношень
        if (['relation', 'multirelation'].includes(field.type)) {
          if (!field.target) {
            errors.push(`Relation field ${field.name} must have a target`);
          }
        }

        // Перевірка repeater
        if (field.type === 'repeater') {
          if (!field.fields || !Array.isArray(field.fields)) {
            errors.push(`Repeater field ${field.name} must have fields array`);
          }
        }
      }
    }

    // Перевірка циклічних відношень
    this.checkCircularRelations(schema);

    if (errors.length > 0) {
      const error = new Error('Schema validation failed');
      error.errors = errors;
      throw error;
    }

    return schema;
  }

  /**
   * Перевірка на циклічні відношення
   */
  checkCircularRelations(schema, visited = new Set()) {
    if (visited.has(schema.name)) {
      return false;
    }

    visited.add(schema.name);

    for (const field of schema.fields || []) {
      if (['relation', 'multirelation'].includes(field.type) && field.target) {
        const targetSchema = this.cms.getSchema(field.target);
        if (targetSchema) {
          if (targetSchema.name === schema.name) {
            // Самореферентне відношення - це ОК
            continue;
          }
          if (this.checkCircularRelations(targetSchema, new Set(visited))) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Перетворення назви в людино-читабельний формат
   */
  humanizeName(name) {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Реєстрація шаблону схеми
   */
  registerTemplate(name, template) {
    this.schemaTemplates.set(name, template);
    return this;
  }

  /**
   * Створення схеми з шаблону
   */
  fromTemplate(templateName, name, options = {}) {
    const template = this.schemaTemplates.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    const schema = typeof template === 'function' 
      ? template(name, options) 
      : { ...template, name };

    return schema;
  }

  /**
   * Отримання доступних пресетів
   */
  getPresets() {
    return Array.from(this.fieldPresets.keys());
  }

  /**
   * Отримання доступних шаблонів
   */
  getTemplates() {
    return Array.from(this.schemaTemplates.keys());
  }

  /**
   * Експорт схеми в JSON
   */
  toJSON(schema) {
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Імпорт схеми з JSON
   */
  fromJSON(json) {
    try {
      const schema = typeof json === 'string' ? JSON.parse(json) : json;
      return this.validate(schema);
    } catch (error) {
      throw new Error('Invalid JSON schema');
    }
  }
}

module.exports = SchemaBuilder;
