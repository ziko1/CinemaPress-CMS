# 🚀 DEPLOYMENT GUIDE - Universal CMS SaaS Platform

Complete guide for deploying the Universal CMS Platform to production.

---

## 📋 Prerequisites

- **Server**: Ubuntu 20.04+ or Debian 11+ (4GB RAM minimum, 2 CPU cores)
- **Domain**: Custom domain with DNS access
- **SSL Certificate**: Let's Encrypt or commercial certificate
- **Database**: PostgreSQL 14+ (managed or self-hosted)
- **Redis**: Redis 6+ (managed or self-hosted)
- **Storage**: S3-compatible storage (AWS S3, DigitalOcean Spaces, MinIO)

---

## 🐳 Docker Deployment (Recommended)

### Step 1: Clone & configure

```bash
# Clone repository
git clone https://github.com/universal-cms/platform.git
cd platform

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Step 2: Update Critical Variables

```env
# Production Database (use managed service for production)
DATABASE_URL=postgresql://user:password@db.example.com:5432/universal_cms

# Production Redis (use managed service)
REDIS_URL=redis://redis.example.com:6379

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -hex 32)

# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=your-production-bucket

# OpenAI
OPENAI_API_KEY=sk-...

# Application
NODE_ENV=production
APP_URL=https://your-domain.com
```

### Step 3: Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f api

# Verify health
curl http://localhost:3000/health
```

### Step 4: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt update && sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/universal-cms
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # API Proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3000/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /path/to/platform/storage/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Root
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: Enable SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Step 6: Enable Nginx Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/universal-cms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## ☸️ Kubernetes Deployment (Enterprise)

### Step 1: Create Namespace

```bash
kubectl create namespace universal-cms
```

### Step 2: Create Secrets

```bash
# Database secret
kubectl create secret generic db-credentials \
  --from-literal=username=cms_user \
  --from-literal=password=$(openssl rand -base64 32) \
  -n universal-cms

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=$(openssl rand -hex 32) \
  -n universal-cms

# Stripe secrets
kubectl create secret generic stripe-secrets \
  --from-literal=secret-key=sk_live_... \
  --from-literal=webhook-secret=whsec_... \
  -n universal-cms
```

### Step 3: Deploy Manifests

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Step 4: Setup Auto-Scaling

```bash
# Horizontal Pod Autoscaler
kubectl autoscale deployment universal-cms-api \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n universal-cms
```

---

## 🌩️ Cloud Provider Deployments

### AWS Deployment

#### Option 1: ECS Fargate (Serverless Containers)

```bash
# Install AWS CLI and ECS CLI
npm install -g ecs-cli

# Configure ECS
ecs-cli configure --region us-east-1 --access-key $AWS_ACCESS_KEY_ID --secret-key $AWS_SECRET_ACCESS_KEY --cluster universal-cms

# Deploy
ecs-cli compose --file docker-compose.yml service up --cluster-config universal-cms --deployment-max-percent 200 --deployment-min-healthy-percent 100
```

#### Option 2: Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker-18.04 universal-cms-platform --region us-east-1

# Create environment
eb create production-env

# Deploy
eb deploy
```

### DigitalOcean Deployment

#### Using App Platform

1. Connect GitHub repository
2. Select `Dockerfile` as source
3. Configure environment variables
4. Add managed database (PostgreSQL)
5. Add managed Redis
6. Deploy

### Google Cloud Platform

#### Using Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT-ID/universal-cms

# Deploy to Cloud Run
gcloud run deploy universal-cms \
  --image gcr.io/PROJECT-ID/universal-cms \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=...,REDIS_URL=...
```

---

## 🗄️ Database Setup

### Managed PostgreSQL (Recommended)

**AWS RDS:**
```bash
aws rds create-db-instance \
  --db-instance-identifier universal-cms-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15 \
  --master-username cms_admin \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 100 \
  --storage-type gp2 \
  --backup-retention-period 7 \
  --multi-az
```

**DigitalOcean Managed DB:**
```bash
doctl databases create universal-cms-db --engine pg --version 15 --size db-s-2vcpu-4gb --region nyc1
```

### Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE universal_cms;
CREATE USER cms_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE universal_cms TO cms_user;
\\c universal_cms
GRANT ALL ON SCHEMA public TO cms_user;
EOF
```

---

## 🔧 Post-Deployment Tasks

### 1. Run Migrations

```bash
docker-compose exec api npm run migrate
```

### 2. Seed Initial Data (Optional)

```bash
docker-compose exec api npm run seed
```

### 3. Create First Admin User

```bash
docker-compose exec api node scripts/create-admin.js
```

### 4. Configure Stripe Webhooks

```bash
# Get webhook endpoint
https://your-domain.com/api/billing/webhook

# Configure in Stripe Dashboard
# Events to subscribe:
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed
```

### 5. Setup Monitoring

**Install Prometheus & Grafana:**
```bash
docker-compose -f monitoring/docker-compose.yml up -d
```

**Configure Sentry:**
```env
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
```

### 6. Setup Backups

**Automated Database Backups:**
```bash
# Create backup script
cat > /usr/local/bin/backup-cms.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="universal_cms_$DATE.sql.gz"
pg_dump $DATABASE_URL | gzip > /backups/$BACKUP_FILE
aws s3 cp /backups/$BACKUP_FILE s3://your-backup-bucket/
find /backups -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-cms.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-cms.sh" | crontab -
```

---

## 📊 Performance Optimization

### 1. Enable CDN

```env
CDN_ENABLED=true
CDN_URL=https://cdn.your-domain.com
```

**Cloudflare Configuration:**
- Cache static assets
- Enable Auto Minify
- Enable Brotli compression
- Configure Page Rules for caching

### 2. Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_collection ON documents(collection_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);

-- Analyze tables
ANALYZE;
```

### 3. Redis Caching

```javascript
// Cache frequently accessed data
const cache = await redis.get(`tenant:${tenantId}:collections`);
if (cache) return JSON.parse(cache);

// Set with TTL
await redis.setex(`tenant:${tenantId}:collections`, 3600, JSON.stringify(collections));
```

---

## 🔐 Security Hardening

### 1. Firewall Configuration

```bash
# UFW firewall
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### 2. Fail2Ban Installation

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Security Headers

Already configured in Nginx config above.

### 4. Regular Updates

```bash
# Weekly updates
sudo apt update && sudo apt upgrade -y
```

---

## 🆘 Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker-compose logs api
docker-compose restart api
```

**Database connection error:**
```bash
# Test connection
docker-compose exec api psql $DATABASE_URL
```

**High memory usage:**
```bash
# Check memory
docker stats

# Scale down workers
docker-compose up -d --scale worker=1
```

**SSL certificate issues:**
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## 📞 Support

For deployment assistance:
- **Documentation**: https://docs.universal-cms.io
- **Email**: support@universal-cms.io
- **Discord**: https://discord.gg/universal-cms

---

**Congratulations! Your Universal CMS Platform is now live! 🎉**
