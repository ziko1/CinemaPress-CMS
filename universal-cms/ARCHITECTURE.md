# 🏗️ UNIVERSAL CMS - SAAS PLATFORM ARCHITECTURE

## System Overview
Enterprise-grade multi-tenant SaaS CMS platform with no-code builder, AI capabilities, and global scalability.

---

## 📁 DIRECTORY STRUCTURE

```
universal-cms/
├── core/                      # Core CMS Engine
│   ├── engine.js             # Main CMS engine (CRUD, events, validation)
│   ├── schema-builder.js     # Dynamic schema construction
│   ├── field-types.js        # 30+ field type definitions
│   ├── plugin-system.js      # Plugin architecture & hooks
│   ├── localization.js       # i18n system (250+ languages)
│   ├── tenant-manager.js     # Multi-tenancy isolation
│   ├── subscription-engine.js # Billing & plan limits
│   └── ai-service.js         # AI integration layer
│
├── api/                       # API Layer
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── cms.js            # CMS CRUD operations
│   │   ├── builder.js        # Page builder API
│   │   ├── billing.js        # Stripe integration
│   │   ├── ai.js             # AI generation endpoints
│   │   └── webhooks.js       # Webhook handlers
│   ├── middleware/
│   │   ├── auth.js           # JWT validation
│   │   ├── tenant.js         # Tenant isolation
│   │   ├── rate-limit.js     # API rate limiting
│   │   └── usage-tracker.js  # Usage metering
│   └── graphql/
│       ├── schema.js         # GraphQL schema
│       └── resolvers.js      # GraphQL resolvers
│
├── admin/                     # Admin Panel (Vue 3 + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── builder/      # Drag & Drop builder components
│   │   │   ├── cms/          # CMS management UI
│   │   │   ├── billing/      # Subscription management
│   │   │   └── analytics/    # Dashboard charts
│   │   ├── views/
│   │   ├── stores/           # Pinia state management
│   │   ├── composables/      # Vue composables
│   │   └── locales/          # Admin translations
│   ├── public/
│   └── index.html
│
├── workers/                   # Background Workers
│   ├── queue-worker.js       # BullMQ job processor
│   ├── email-worker.js       # Email sending
│   ├── image-worker.js       # Image optimization
│   └── ai-worker.js          # AI processing jobs
│
├── services/                  # Business Logic Services
│   ├── stripe-service.js     # Payment processing
│   ├── email-service.js      # Transactional emails
│   ├── storage-service.js    # S3 file management
│   ├── seo-service.js        # SEO optimization
│   └── analytics-service.js  # Traffic tracking
│
├── models/                    # Database Models
│   ├── Tenant.js             # Tenant workspace
│   ├── User.js               # User accounts
│   ├── Subscription.js       # Billing subscriptions
│   ├── Collection.js         # CMS collections
│   ├── Document.js           # CMS documents
│   ├── Page.js               # Built pages
│   ├── Component.js          # Reusable components
│   ├── Plugin.js             # Installed plugins
│   └── UsageLog.js           # Usage tracking
│
├── scripts/                   # Utility Scripts
│   ├── init-saas.js          # Platform initialization
│   ├── migrate-db.js         # Database migrations
│   ├── seed-data.js          # Demo data seeding
│   └── build-themes.js       # Theme compilation
│
├── themes/                    # Theme System
│   ├── default/              # Default theme
│   ├── ecommerce/            # E-commerce theme
│   ├── blog/                 # Blog theme
│   └── portfolio/            # Portfolio theme
│
├── plugins/                   # Plugin System
│   ├── marketplace/          # Marketplace plugins
│   ├── seo-booster/          # SEO enhancement
│   ├── analytics-pro/        # Advanced analytics
│   └── form-builder/         # Form builder plugin
│
├── storage/                   # File Storage
│   ├── uploads/              # User uploads
│   ├── cache/                # Cached assets
│   └── backups/              # Database backups
│
├── config/                    # Configuration
│   ├── database.js           # DB connection config
│   ├── redis.js              # Redis config
│   ├── stripe.js             # Stripe config
│   ├── openai.js             # AI config
│   └── app.js                # App settings
│
├── tests/                     # Test Suite
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
│
├── docs/                      # Documentation
│   ├── api.md                # API documentation
│   ├── plugins.md            # Plugin development guide
│   └── deployment.md         # Deployment instructions
│
├── .env.example              # Environment variables template
├── .dockerignore             # Docker ignore rules
├── docker-compose.yml        # Docker orchestration
├── Dockerfile                # Container definition
├── package.json              # Dependencies & scripts
├── server.js                 # Main server entry point
├── index.js                  # Module exports
└── README.md                 # Project overview
```

---

## 🏛️ ARCHITECTURAL LAYERS

### 1. Presentation Layer
- **Admin Panel**: Vue 3 SPA with real-time builder
- **Public Sites**: SSR/SSG rendered sites (Next.js compatible)
- **API**: REST + GraphQL endpoints

### 2. Application Layer
- **CMS Engine**: Core content management logic
- **Builder Engine**: Drag & drop page construction
- **Auth System**: JWT + OAuth + RBAC
- **Billing Engine**: Subscription & usage tracking

### 3. Domain Layer
- **Multi-Tenancy**: Workspace isolation
- **Collections**: Dynamic schema management
- **Plugins**: Extensible hook system
- **AI Services**: Content generation

### 4. Infrastructure Layer
- **Database**: PostgreSQL (primary) + MongoDB (optional)
- **Cache**: Redis (sessions, caching, queues)
- **Storage**: S3-compatible object storage
- **Queue**: BullMQ for background jobs

---

## 🔐 MULTI-TENANCY MODEL

### Isolation Strategy
```javascript
// Logical isolation via tenant_id
{
  _id: "doc_123",
  tenant_id: "tenant_abc",
  collection: "posts",
  data: { ... }
}

// Database-level separation (Enterprise)
// Each tenant gets dedicated schema
```

### Tenant Resources
- Custom domains
- SSL certificates
- Storage quotas
- API rate limits
- Team members

---

## 💳 BILLING ARCHITECTURE

### Subscription Flow
1. User selects plan (Free/Pro/Business/Enterprise)
2. Stripe Checkout session created
3. Webhook confirms payment
4. Subscription activated in DB
5. Limits enforced via middleware

### Usage Tracking
```javascript
// Track API calls, storage, bandwidth
await UsageLog.create({
  tenant_id: 'tenant_abc',
  metric: 'api_calls',
  value: 1,
  timestamp: new Date()
});

// Check limits before processing
if (usage > plan.limit) {
  throw new UsageLimitError('Plan limit exceeded');
}
```

---

## 🔌 PLUGIN SYSTEM

### Plugin Lifecycle
1. **Install**: Download & validate plugin
2. **Activate**: Register hooks, routes, fields
3. **Run**: Execute on events (beforeSave, afterPublish)
4. **Update**: Seamless version upgrades
5. **Uninstall**: Cleanup data & hooks

### Hook Types
- `beforeCreate`, `afterCreate`
- `beforeUpdate`, `afterUpdate`
- `beforeDelete`, `afterDelete`
- `onRequest`, `onResponse`
- `onPublish`, `onUnpublish`

---

## 🤖 AI INTEGRATION

### AI Services
- **Content Generation**: Articles, product descriptions
- **Page Builder**: Generate pages from prompts
- **Translation**: Auto-translate content
- **Design Suggestions**: Layout improvements
- **SEO Optimization**: Meta tags, keywords

### Credit System
```javascript
// AI credits per plan
const plans = {
  free: { ai_credits: 10 },
  pro: { ai_credits: 100 },
  business: { ai_credits: 1000 },
  enterprise: { ai_credits: 'unlimited' }
};
```

---

## 🚀 DEPLOYMENT STRATEGY

### Development
```bash
npm run dev:all  # Run API, Admin, Workers concurrently
```

### Production (Docker)
```bash
docker-compose up -d
```

### Scaling (Kubernetes)
- Horizontal pod autoscaling
- Database read replicas
- Redis cluster
- CDN for static assets

---

## 📊 MONITORING & OBSERVABILITY

### Metrics Tracked
- API response times
- Error rates
- Tenant usage patterns
- Revenue metrics (MRR, ARR)
- AI credit consumption

### Logging Stack
- Winston for structured logging
- ELK Stack for log aggregation
- Prometheus + Grafana for metrics
- Sentry for error tracking

---

## 🔒 SECURITY MEASURES

1. **Authentication**: JWT + Refresh tokens
2. **Authorization**: RBAC with granular permissions
3. **Data Isolation**: Tenant-level access control
4. **Rate Limiting**: Per-tenant, per-IP limits
5. **Input Validation**: Zod schemas for all inputs
6. **XSS Protection**: Sanitize HTML content
7. **CSRF Protection**: Token-based validation
8. **SQL Injection**: Parameterized queries
9. **DDoS Protection**: Cloudflare integration
10. **Encryption**: AES-256 at rest, TLS in transit

---

This architecture supports billion-dollar scale with modular design, clear separation of concerns, and enterprise-grade security.
