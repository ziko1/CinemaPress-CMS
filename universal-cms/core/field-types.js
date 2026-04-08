/**
 * Field Types - Система типів полів
 * Визначає всі доступні типи полів та їх поведінку
 */

class FieldTypes {
  constructor() {
    this.types = new Map();
    this.validators = new Map();
    this.transformers = new Map();
    
    this.initBaseTypes();
  }

  /**
   * Ініціалізація базових типів полів
   */
  initBaseTypes() {
    // Текстові поля
    this.register('text', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        const trimmed = value.trim();
        
        if (field.minLength && trimmed.length < field.minLength) {
          throw new Error(`Minimum length is ${field.minLength}`);
        }
        
        if (field.maxLength && trimmed.length > field.maxLength) {
          throw new Error(`Maximum length is ${field.maxLength}`);
        }
        
        if (field.pattern) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(trimmed)) {
            throw new Error('Value does not match pattern');
          }
        }
        
        return field.transform === 'lowercase' ? trimmed.toLowerCase() :
               field.transform === 'uppercase' ? trimmed.toUpperCase() :
               trimmed;
      },
      
      sanitize: (value) => {
        return value.replace(/[<>]/g, '');
      }
    });

    this.register('textarea', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        if (field.maxLength && value.length > field.maxLength) {
          throw new Error(`Maximum length is ${field.maxLength}`);
        }
        
        return value;
      }
    });

    this.register('slug', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        let slug = value.toLowerCase();
        
        if (field.transliterate !== false) {
          slug = this.transliterate(slug);
        }
        
        slug = slug.replace(/[^a-z0-9]+/g, field.separator || '-');
        slug = slug.replace(/^-|-$/g, '');
        
        return slug;
      },
      
      process: async (value, field, context) => {
        if (!value && field.fromField) {
          const sourceValue = context.data[field.fromField];
          if (sourceValue) {
            return this.types.get('slug').validate(sourceValue, field);
          }
        }
        return value;
      }
    });

    this.register('email', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error('Invalid email address');
        }
        
        return value.toLowerCase().trim();
      }
    });

    this.register('url', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        try {
          new URL(value);
          return value;
        } catch {
          throw new Error('Invalid URL');
        }
      }
    });

    // Числові поля
    this.register('number', {
      validate: async (value, field) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(num)) {
          throw new Error('Value must be a number');
        }
        
        if (field.min !== undefined && num < field.min) {
          throw new Error(`Minimum value is ${field.min}`);
        }
        
        if (field.max !== undefined && num > field.max) {
          throw new Error(`Maximum value is ${field.max}`);
        }
        
        if (field.precision !== undefined) {
          return parseFloat(num.toFixed(field.precision));
        }
        
        return num;
      }
    });

    this.register('integer', {
      validate: async (value, field) => {
        const num = await this.types.get('number').validate(value, field);
        
        if (!Number.isInteger(num)) {
          throw new Error('Value must be an integer');
        }
        
        return num;
      }
    });

    this.register('float', {
      validate: async (value, field) => {
        return this.types.get('number').validate(value, { ...field, precision: field.precision || 2 });
      }
    });

    // Булеві поля
    this.register('boolean', {
      validate: async (value, field) => {
        if (typeof value === 'boolean') {
          return value;
        }
        
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (['true', '1', 'yes', 'on'].includes(lower)) {
            return true;
          }
          if (['false', '0', 'no', 'off'].includes(lower)) {
            return false;
          }
        }
        
        if (typeof value === 'number') {
          return value !== 0;
        }
        
        throw new Error('Value must be a boolean');
      }
    });

    // Дати
    this.register('date', {
      validate: async (value, field) => {
        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        
        if (field.min && date < new Date(field.min)) {
          throw new Error('Date is too early');
        }
        
        if (field.max && date > new Date(field.max)) {
          throw new Error('Date is too late');
        }
        
        return date.toISOString().split('T')[0];
      }
    });

    this.register('datetime', {
      validate: async (value, field) => {
        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
          throw new Error('Invalid datetime');
        }
        
        if (field.min && date < new Date(field.min)) {
          throw new Error('Datetime is too early');
        }
        
        if (field.max && date > new Date(field.max)) {
          throw new Error('Datetime is too late');
        }
        
        return date.toISOString();
      }
    });

    this.register('time', {
      validate: async (value, field) => {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        
        if (!timeRegex.test(value)) {
          throw new Error('Invalid time format (HH:MM expected)');
        }
        
        return value;
      }
    });

    // Вибір
    this.register('select', {
      validate: async (value, field) => {
        const options = field.options.map(o => typeof o === 'object' ? o.value : o);
        
        if (field.multiple) {
          if (!Array.isArray(value)) {
            throw new Error('Value must be an array');
          }
          
          for (const val of value) {
            if (!options.includes(val)) {
              throw new Error(`Invalid option: ${val}`);
            }
          }
          
          return value;
        }
        
        if (value === null || value === '') {
          return field.clearable ? null : value;
        }
        
        if (!options.includes(value)) {
          throw new Error(`Invalid option: ${value}`);
        }
        
        return value;
      }
    });

    this.register('multiselect', {
      validate: async (value, field) => {
        return this.types.get('select').validate(value, { ...field, multiple: true });
      }
    });

    this.register('tags', {
      validate: async (value, field) => {
        if (typeof value === 'string') {
          return value.split(',').map(t => t.trim()).filter(t => t);
        }
        
        if (Array.isArray(value)) {
          return value.map(t => String(t).trim()).filter(t => t);
        }
        
        throw new Error('Value must be a string or array');
      }
    });

    // Rich Text
    this.register('richtext', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        if (field.maxLength && value.length > field.maxLength) {
          throw new Error(`Maximum length is ${field.maxLength}`);
        }
        
        // Санітизація HTML буде виконана окремо
        return value;
      },
      
      sanitize: (value) => {
        // Проста санітизація HTML (вирізання небезпечних тегів)
        return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
      }
    });

    this.register('markdown', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        return value;
      },
      
      process: async (value, field, context) => {
        // Тут може бути конвертація Markdown в HTML
        return value;
      }
    });

    // Медіа
    this.register('image', {
      validate: async (value, field) => {
        if (typeof value === 'string') {
          // URL зображення
          return { url: value };
        }
        
        if (typeof value === 'object' && value !== null) {
          return {
            url: value.url,
            alt: value.alt || '',
            width: value.width,
            height: value.height,
            size: value.size,
            format: value.format
          };
        }
        
        throw new Error('Invalid image value');
      }
    });

    this.register('gallery', {
      validate: async (value, field) => {
        if (!Array.isArray(value)) {
          throw new Error('Value must be an array');
        }
        
        if (field.minItems && value.length < field.minItems) {
          throw new Error(`Minimum ${field.minItems} items required`);
        }
        
        if (field.maxItems && value.length > field.maxItems) {
          throw new Error(`Maximum ${field.maxItems} items allowed`);
        }
        
        const validated = [];
        for (const item of value) {
          validated.push(await this.types.get('image').validate(item, {}));
        }
        
        return validated;
      }
    });

    this.register('video', {
      validate: async (value, field) => {
        if (typeof value === 'string') {
          return { url: value };
        }
        
        if (typeof value === 'object' && value !== null) {
          return {
            url: value.url,
            thumbnail: value.thumbnail,
            duration: value.duration,
            provider: value.provider
          };
        }
        
        throw new Error('Invalid video value');
      }
    });

    this.register('file', {
      validate: async (value, field) => {
        if (typeof value === 'string') {
          return { url: value };
        }
        
        if (typeof value === 'object' && value !== null) {
          return {
            url: value.url,
            name: value.name,
            size: value.size,
            type: value.type
          };
        }
        
        throw new Error('Invalid file value');
      }
    });

    this.register('files', {
      validate: async (value, field) => {
        if (!Array.isArray(value)) {
          throw new Error('Value must be an array');
        }
        
        const validated = [];
        for (const item of value) {
          validated.push(await this.types.get('file').validate(item, {}));
        }
        
        return validated;
      }
    });

    // Відношення
    this.register('relation', {
      validate: async (value, field) => {
        if (value === null || value === '') {
          return null;
        }
        
        if (typeof value === 'string' || typeof value === 'number') {
          return { id: value };
        }
        
        if (typeof value === 'object' && value.id) {
          return value;
        }
        
        throw new Error('Invalid relation value');
      }
    });

    this.register('multirelation', {
      validate: async (value, field) => {
        if (!Array.isArray(value)) {
          throw new Error('Value must be an array');
        }
        
        const validated = [];
        for (const item of value) {
          validated.push(await this.types.get('relation').validate(item, field));
        }
        
        return validated;
      }
    });

    // Складені типи
    this.register('object', {
      validate: async (value, field) => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error('Value must be an object');
        }
        
        return value;
      }
    });

    this.register('repeater', {
      validate: async (value, field) => {
        if (!Array.isArray(value)) {
          throw new Error('Value must be an array');
        }
        
        if (field.minItems && value.length < field.minItems) {
          throw new Error(`Minimum ${field.minItems} items required`);
        }
        
        if (field.maxItems && value.length > field.maxItems) {
          throw new Error(`Maximum ${field.maxItems} items allowed`);
        }
        
        return value;
      }
    });

    this.register('tabs', {
      validate: async (value, field) => {
        if (typeof value !== 'object' || value === null) {
          throw new Error('Value must be an object');
        }
        
        return value;
      }
    });

    // Спеціальні типи
    this.register('json', {
      validate: async (value, field) => {
        if (typeof value === 'object') {
          return value;
        }
        
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            throw new Error('Invalid JSON');
          }
        }
        
        throw new Error('Value must be a valid JSON');
      }
    });

    this.register('code', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        return {
          code: value,
          language: field.language || 'javascript'
        };
      }
    });

    this.register('color', {
      validate: async (value, field) => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        
        // Перевірка hex кольору
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (hexRegex.test(value)) {
          return value;
        }
        
        // Перевірка rgb/rgba
        const rgbRegex = /^rgba?\(\d{1,3},\s*\d{1,3},\s*\d{1,3}(,\s*[0-9.]+)?\)$/;
        if (rgbRegex.test(value)) {
          return value;
        }
        
        throw new Error('Invalid color format');
      }
    });

    this.register('computed', {
      validate: async (value, field) => {
        return value;
      },
      
      process: async (value, field, context) => {
        if (field.compute && typeof field.compute === 'function') {
          return await field.compute(context.data, context);
        }
        return value;
      }
    });

    this.register('conditional', {
      validate: async (value, field) => {
        return value;
      }
    });
  }

  /**
   * Реєстрація типу поля
   */
  register(name, implementation) {
    this.types.set(name, implementation);
    return this;
  }

  /**
   * Отримання типу поля
   */
  get(name) {
    return this.types.get(name);
  }

  /**
   * Перевірка наявності типу
   */
  has(name) {
    return this.types.has(name);
  }

  /**
   * Отримання всіх типів
   */
  getAll() {
    return Array.from(this.types.keys());
  }

  /**
   * Ініціалізація
   */
  async init() {
    // Можна додати додаткову ініціалізацію
  }

  /**
   * Транслітерація тексту
   */
  transliterate(text) {
    const ukToEn = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd',
      'е': 'e', 'є': 'ie', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i',
      'ї': 'yi', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
      'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ь': '', 'ю': 'iu', 'я': 'ia', ' ': '-', '_': '-'
    };

    return text.toLowerCase().split('').map(char => {
      return ukToEn[char] || char;
    }).join('');
  }
}

module.exports = FieldTypes;
