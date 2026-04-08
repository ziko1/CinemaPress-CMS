# Universal SaaS CMS Platform

> **The last CMS you'll ever need.**  
> Combining Webflow's builder, WordPress's flexibility, Shopify's commerce, Framer's design, Zapier's automation, and Notion's data structure.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-2.0.0--saas-blue)](https://github.com/universal-cms/platform)

---

## 🚀 Features

### 💼 SaaS Business Model
- **Multi-Tier Subscriptions**: Free, Pro ($29/mo), Business ($99/mo), Enterprise (Custom)
- **Stripe Integration**: Automated billing, invoices, trials, coupons
- **Usage-Based Billing**: Track API calls, storage, bandwidth
- **Multi-Tenancy**: Isolated workspaces with custom domains
- **Marketplace**: Sell templates & plugins (70/30 revenue split)

### 🎨 No-Code Builder
- **Drag & Drop Editor**: Absolute positioning + Flexbox/Grid
- **Real-Time Preview**: Desktop, Tablet, Mobile views
- **Dynamic Data Binding**: Connect UI to CMS collections
- **Visual Logic Builder**: If/Then workflows without code
- **Reusable Components**: Build once, use everywhere

### 📝 Advanced CMS
- **Unlimited Collections**: Custom content types
- **Rich Field Types**: 30+ types (text, image, gallery, relations, repeater, computed)
- **Version Control**: Full history with rollback
- **Draft/Publish Workflow**: Schedule content releases
- **Media Library**: Optimized image/video management

### 🌍 Global Localization
- **250+ Languages**: Complete i18n coverage
- **Auto-Translation**: AI-powered bulk translation
- **RTL Support**: Native right-to-left layouts
- **Localized SEO**: Hreflang tags, regional URLs

### 🔍 Max-Level SEO
- **SSR/SSG**: Server-side rendering & static generation
- **Auto Meta Tags**: Intelligent metadata generation
- **Structured Data**: JSON-LD for rich snippets
- **Performance**: Core Web Vitals optimized
- **Image Optimization**: WebP/AVIF conversion

### 🤖 AI-Powered
- **AI Page Generator**: Create pages from text prompts
- **Content Assistant**: SEO articles, product descriptions
- **Auto-Translation**: Neural machine translation
- **Design Suggestions**: AI-driven layout improvements
- **Smart Automation**: Workflow recommendations

### 🔒 Enterprise Security
- **Authentication**: JWT, OAuth, SSO
- **RBAC**: Granular role-based access control
- **Rate Limiting**: Per-tenant API limits
- **Data Encryption**: AES-256 at rest, TLS in transit
- **Compliance**: GDPR, CCPA ready

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Presentation Layer                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Admin Panel │  │  Public Sites│  │  API/GraphQL│ │
│  │  (Vue 3)    │  │  (SSR/SSG)   │  │  (REST)     │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                 Application Layer                    │
│  ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐  │
│  │   CMS    │ │ Builder │ │  Auth  │ │ Billing  │  │
│  │  Engine  │ │ Engine  │ │ System │ │  Engine  │  │
│  └──────────┘ └─────────┘ └────────┘ └──────────┘  │
└─────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────┐
│                  Infrastructure                      │
│  ┌──────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐  │
│  │PostgreSQL│ │  Redis  │ │   S3   │ │  BullMQ  │  │
│  │          │ │ (Cache) │ │(Storage)│ │ (Queue)  │  │
│  └──────────┘ └─────────┘ └────────┘ └──────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- npm >= 9.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/universal-cms/platform.git
cd platform

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Initialize database
npm run migrate

# Seed demo data (optional)
npm run seed

# Start development server
npm run dev:all
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/universal_cms
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...

# AI Services
OPENAI_API_KEY=sk-...

# Storage (S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=universal-cms-storage
AWS_REGION=us-east-1

# Email (SMTP)
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@...
SMTP_PASS=...

# App Settings
APP_URL=http://localhost:3000
ADMIN_URL=http://localhost:3000/admin
NODE_ENV=development
```

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start API server
npm run dev:admin        # Start admin panel (Vite)
npm run dev:worker       # Start background worker
npm run dev:all          # Run all services concurrently

# Production
npm start                # Start production server
npm run build            # Build admin panel & themes

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed demo data

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run end-to-end tests

# Maintenance
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
```

---

## 💳 Pricing Tiers

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|----------|------------|
| **Price** | $0 | $29/mo | $99/mo | Custom |
| **Projects** | 1 | 5 | 20 | Unlimited |
| **Storage** | 100MB | 10GB | 100GB | Unlimited |
| **Bandwidth** | 1GB/mo | 100GB/mo | 1TB/mo | Unlimited |
| **API Calls** | 1K/day | 100K/day | 1M/day | Unlimited |
| **Custom Domain** | ❌ | ✅ | ✅ | ✅ |
| **Team Members** | 1 | 3 | 10 | Unlimited |
| **AI Credits** | 10/mo | 100/mo | 1000/mo | Unlimited |
| **Support** | Community | Email | Priority | 24/7 Dedicated |
| **Watermark** | ✅ | ❌ | ❌ | ❌ |

---

## 📁 Project Structure

```
universal-cms/
├── core/               # Core CMS engine
├── api/                # REST & GraphQL APIs
├── admin/              # Vue 3 admin panel
├── workers/            # Background job processors
├── services/           # Business logic services
├── models/             # Database models
├── scripts/            # Utility scripts
├── themes/             # Theme templates
├── plugins/            # Plugin system
├── config/             # Configuration files
└── tests/              # Test suite
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

---

## 🔌 Plugin System

Extend the platform with custom plugins:

```javascript
// Example plugin
export default {
  name: 'seo-booster',
  version: '1.0.0',
  
  hooks: {
    async beforePublish({ document, collection }) {
      // Auto-generate meta tags
      document.meta = await generateSEO(document);
    },
    
    async afterCreate({ document }) {
      // Send notification
      await sendEmail('New content published!');
    }
  },
  
  routes: [
    {
      path: '/api/seo/analyze',
      method: 'POST',
      handler: analyzeSEO
    }
  ]
};
```

---

## 🤖 AI Examples

### Generate Page from Prompt
```javascript
const page = await ai.generatePage({
  prompt: "Create a landing page for a coffee shop with menu, about us, and contact form",
  style: "modern",
  colors: ["#6F4E37", "#F5F5DC", "#FFFFFF"]
});

await cms.pages.create(page);
```

### Auto-Translate Content
```javascript
const translations = await ai.translate({
  content: document,
  sourceLang: 'en',
  targetLangs: ['uk', 'de', 'fr', 'es']
});
```

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests (requires Playwright)
npm run test:e2e

# Coverage report
npm test -- --coverage
```

---

## 📖 Documentation

- [Architecture Guide](./ARCHITECTURE.md)
- [SaaS Vision](./SAAS_VISION.md)
- [Localization](./LOCALIZATION.md)
- [API Reference](./docs/api.md)
- [Plugin Development](./docs/plugins.md)
- [Deployment](./docs/deployment.md)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vue 3, Vite, Element Plus |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL, MongoDB (optional) |
| **Cache** | Redis |
| **Queue** | BullMQ |
| **API** | REST + GraphQL |
| **Storage** | S3-compatible |
| **AI** | OpenAI GPT-4 |
| **Payments** | Stripe |
| **Email** | Nodemailer + SMTP |

---

## 🚀 Deployment

### Docker (Recommended)

```bash
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

### Manual

See [Deployment Guide](./docs/deployment.md)

---

## 📊 Roadmap

- [x] Phase 1: Core CMS & Multi-tenancy
- [x] Phase 2: Localization (250+ languages)
- [ ] Phase 3: No-Code Builder (Q2 2024)
- [ ] Phase 4: Stripe Billing (Q2 2024)
- [ ] Phase 5: AI Features (Q3 2024)
- [ ] Phase 6: Marketplace (Q3 2024)
- [ ] Phase 7: Enterprise Scaling (Q4 2024)

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

### Ways to Contribute
- Report bugs
- Suggest features
- Submit pull requests
- Write documentation
- Create plugins/themes
- Translate the platform

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 👥 Team

Built with ❤️ by the Universal CMS Team

- Lead Architect: [@yourname](https://github.com/yourname)
- Core Contributors: [List contributors]

---

## 📞 Support

- **Documentation**: https://docs.universal-cms.io
- **Community Forum**: https://community.universal-cms.io
- **Discord**: https://discord.gg/universal-cms
- **Twitter**: [@UniversalCMS](https://twitter.com/UniversalCMS)
- **Email**: support@universal-cms.io

---

## 🙏 Acknowledgments

Inspired by:
- Webflow (Visual Builder)
- WordPress (CMS Flexibility)
- Shopify (E-commerce)
- Framer (Design Tools)
- Zapier (Automation)
- Notion (Data Structure)

Made better. Made simpler. Made universal.
