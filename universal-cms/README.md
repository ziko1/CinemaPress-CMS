# Universal No-Code CMS

Універсальна система управління контентом з акцентом на no-code підхід для будь-яких задач.

## Архітектура

```
universal-cms/
├── core/                  # Ядро CMS
│   ├── engine.js          # Основний рушій
│   ├── schema-builder.js  # Конструктор схем даних
│   ├── field-types.js     # Типи полів
│   └── plugin-system.js   # Система плагінів
├── admin/                 # Адмін-панель
│   ├── builder/           # Візуальний конструктор
│   ├── dashboard/         # Панель керування
│   └── components/        # UI компоненти
├── api/                   # REST/GraphQL API
│   ├── content.js         # Ендпоінти контенту
│   ├── schema.js          # Ендпоінти схем
│   └── media.js           # Робота з медіа
├── storage/               # Системи зберігання
│   ├── database.js        # Абстракція БД
│   ├── cache.js           # Кешування
│   └── filesystem.js      # Файлова система
├── themes/                # Теми оформлення
│   └── default/           # Тема за замовчуванням
└── plugins/               # Плагіни
    ├── seo/               # SEO оптимізація
    ├── forms/             # Форми
    └── analytics/         # Аналітика
```

## Основні принципи

### 1. No-Code Конструктор
- Візуальне створення типів контенту
- Drag-and-drop інтерфейс
- Миттєвий попередній перегляд
- Гаряче перезавантаження змін

### 2. Універсальні Типи Контенту
Будь-який тип контенту визначається через схему:

```json
{
  "name": "product",
  "label": "Товар",
  "fields": [
    {
      "name": "title",
      "type": "text",
      "required": true,
      "validation": {"minLength": 3, "maxLength": 200}
    },
    {
      "name": "description",
      "type": "richtext",
      "localized": true
    },
    {
      "name": "price",
      "type": "number",
      "currency": "UAH"
    },
    {
      "name": "images",
      "type": "media",
      "multiple": true
    },
    {
      "name": "category",
      "type": "relation",
      "target": "category"
    }
  ]
}
```

### 3. Гнучка Система Полів

#### Базові типи:
- `text` - текстові поля
- `number` - числові значення
- `boolean` - булеві значення
- `date` / `datetime` - дати
- `email` - email адреси
- `url` - URL посилання

#### Спеціальні типи:
- `richtext` - багатий текст (WYSIWYG)
- `markdown` - Markdown редактор
- `code` - редактор коду
- `json` - JSON редактор
- `color` - вибір кольору
- `icon` - вибір іконки

#### Медіа типи:
- `image` - зображення
- `video` - відео
- `audio` - аудіо
- `file` - файли
- `gallery` - галерея

#### Відносини:
- `relation` - зв'язок з іншим типом
- `multirelation` - множинний зв'язок
- `nested` - вкладені структури

#### Користувацькі:
- `repeater` - повторювані групи полів
- `tabs` - вкладки для групування
- `conditional` - умовні поля
- `computed` - обчислювані поля

### 4. Автоматичне API

Для кожного типу контенту автоматично генерується:

```javascript
// REST API
GET    /api/content/{type}          // Список
POST   /api/content/{type}          // Створити
GET    /api/content/{type}/{id}     // Отримати
PUT    /api/content/{type}/{id}     // Оновити
DELETE /api/content/{type}/{id}     // Видалити

// GraphQL
query {
  products(filter: {category: "electronics"}) {
    id
    title
    price
  }
}
```

### 5. Система Шаблонів

```javascript
// Template Engine з підтримкою змінних
{
  "templates": {
    "product-card": `
      <div class="product">
        <img src="{{product.image}}" alt="{{product.title}}">
        <h3>{{product.title}}</h3>
        <p class="price">{{product.price | currency}}</p>
        {{#if product.sale}}
          <span class="badge">Sale!</span>
        {{/if}}
      </div>
    `,
    "listing": `
      <div class="listing">
        {{#each items}}
          {{> product-card product=this}}
        {{/each}}
        {{pagination}}
      </div>
    `
  }
}
```

### 6. Workflow та Права Доступу

```json
{
  "roles": {
    "admin": {
      "permissions": ["*"]
    },
    "editor": {
      "permissions": {
        "content:*": ["read", "create", "update"],
        "content:published": ["delete"]
      }
    },
    "author": {
      "permissions": {
        "content:own": ["read", "create", "update", "delete"]
      }
    }
  },
  "workflows": {
    "article": {
      "stages": ["draft", "review", "approved", "published"],
      "transitions": {
        "draft": ["review"],
        "review": ["draft", "approved"],
        "approved": ["published", "draft"],
        "published": ["draft"]
      }
    }
  }
}
```

### 7. Локалізація

```json
{
  "locales": ["uk", "en", "ru"],
  "defaultLocale": "uk",
  "fields": {
    "title": {
      "localized": true,
      "fallback": "uk"
    }
  }
}
```

### 8. SEO Оптимізація

Автоматична генерація:
- Meta тегів
- Open Graph даних
- Schema.org розмітки
- Sitemap.xml
- Robots.txt

```json
{
  "seo": {
    "autoGenerate": true,
    "patterns": {
      "title": "{{item.title}} | {{site.name}}",
      "description": "{{item.excerpt}}",
      "canonical": "{{site.url}}/{{item.slug}}"
    }
  }
}
```

### 9. Кешування та Продуктивність

```javascript
{
  "cache": {
    "enabled": true,
    "strategy": "redis",
    "ttl": 3600,
    "invalidation": {
      "onUpdate": true,
      "onPublish": true,
      "scheduled": "0 */6 * * *"
    }
  }
}
```

### 10. Розширюваність

```javascript
// Plugin API
cms.plugin({
  name: 'my-plugin',
  version: '1.0.0',
  
  hooks: {
    'content:beforeSave': async (data, context) => {
      // Модифікація даних перед збереженням
    },
    'content:afterSave': async (data, context) => {
      // Дії після збереження
    },
    'api:beforeResponse': async (response, context) => {
      // Модифікація відповіді
    }
  },
  
  routes: {
    'GET /api/custom': async (req, res) => {
      // Custom endpoint
    }
  },
  
  adminPages: {
    '/settings': './pages/settings.vue'
  }
});
```

## Приклади Використання

### 1. Інтернет-магазин

```json
{
  "types": [
    {
      "name": "product",
      "fields": [
        {"name": "title", "type": "text"},
        {"name": "slug", "type": "slug"},
        {"name": "description", "type": "richtext"},
        {"name": "price", "type": "number"},
        {"name": "comparePrice", "type": "number"},
        {"name": "sku", "type": "text"},
        {"name": "inventory", "type": "number"},
        {"name": "images", "type": "gallery"},
        {"name": "variants", "type": "repeater"},
        {"name": "category", "type": "relation", "target": "category"},
        {"name": "tags", "type": "multirelation", "target": "tag"}
      ]
    },
    {
      "name": "order",
      "fields": [
        {"name": "number", "type": "text"},
        {"name": "customer", "type": "relation", "target": "customer"},
        {"name": "items", "type": "repeater"},
        {"name": "total", "type": "number"},
        {"name": "status", "type": "select"},
        {"name": "shippingAddress", "type": "object"}
      ]
    }
  ]
}
```

### 2. Новинний Портал

```json
{
  "types": [
    {
      "name": "article",
      "fields": [
        {"name": "title", "type": "text"},
        {"name": "subtitle", "type": "text"},
        {"name": "content", "type": "richtext"},
        {"name": "coverImage", "type": "image"},
        {"name": "author", "type": "relation", "target": "author"},
        {"name": "category", "type": "relation", "target": "category"},
        {"name": "tags", "type": "multirelation", "target": "tag"},
        {"name": "publishedAt", "type": "datetime"},
        {"name": "featured", "type": "boolean"}
      ]
    }
  ]
}
```

### 3. Корпоративний Сайт

```json
{
  "types": [
    {
      "name": "page",
      "fields": [
        {"name": "title", "type": "text"},
        {"name": "slug", "type": "slug"},
        {"name": "blocks", "type": "repeater", "types": [
          "hero", "text", "image", "gallery", "video", 
          "features", "testimonials", "cta", "faq"
        ]}
      ]
    },
    {
      "name": "employee",
      "fields": [
        {"name": "name", "type": "text"},
        {"name": "position", "type": "text"},
        {"name": "photo", "type": "image"},
        {"name": "bio", "type": "richtext"},
        {"name": "socialLinks", "type": "repeater"}
      ]
    }
  ]
}
```

## Швидкий Старт

```bash
# Встановлення
npm install universal-cms

# Ініціалізація проекту
npx ucms init my-project

# Запуск адмін-панелі
npx ucms admin

# Запуск API сервера
npx ucms serve

# Build для продакшену
npx ucms build
```

## Конфігурація

```javascript
// cms.config.js
export default {
  site: {
    name: 'My Site',
    url: 'https://example.com',
    locales: ['uk', 'en']
  },
  
  database: {
    type: 'postgresql',
    connection: process.env.DATABASE_URL
  },
  
  storage: {
    type: 's3',
    bucket: 'my-bucket',
    region: 'eu-west-1'
  },
  
  cache: {
    enabled: true,
    type: 'redis',
    url: process.env.REDIS_URL
  },
  
  plugins: [
    '@ucms/plugin-seo',
    '@ucms/plugin-forms',
    '@ucms/plugin-analytics'
  ]
}
```

## Безпека

- JWT автентифікація
- RBAC (Role-Based Access Control)
- Rate limiting
- CORS налаштування
- XSS захист
- CSRF токени
- SQL injection prevention
- Input валідація

## Deployment

Підтримувані платформи:
- Docker / Docker Compose
- Kubernetes
- Vercel
- Netlify
- AWS Lambda
- Google Cloud Run
- Heroku
- DigitalOcean App Platform

## Ліцензія

MIT
