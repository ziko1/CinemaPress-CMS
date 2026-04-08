const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Subscription extends BaseModel {
  constructor() {
    super('subscriptions');
  }

  async findByTenantId(tenantId) {
    const sql = `
      SELECT * FROM subscriptions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await query(sql, [tenantId]);
    return result.rows[0] || null;
  }

  async findActiveByTenantId(tenantId) {
    const sql = `
      SELECT * FROM subscriptions
      WHERE tenant_id = $1 AND status IN ('active', 'trialing')
      ORDER BY current_period_end DESC
      LIMIT 1
    `;
    const result = await query(sql, [tenantId]);
    return result.rows[0] || null;
  }

  async createOrUpdate(tenantId, stripeData) {
    const existing = await this.findByTenantId(tenantId);

    if (existing) {
      return this.update(existing.id, {
        stripe_subscription_id: stripeData.stripeSubscriptionId || existing.stripe_subscription_id,
        stripe_customer_id: stripeData.stripeCustomerId || existing.stripe_customer_id,
        plan: stripeData.plan || existing.plan,
        status: stripeData.status || existing.status,
        current_period_start: stripeData.currentPeriodStart || existing.current_period_start,
        current_period_end: stripeData.currentPeriodEnd || existing.current_period_end,
        cancel_at_period_end: stripeData.cancelAtPeriodEnd !== undefined 
          ? stripeData.cancelAtPeriodEnd 
          : existing.cancel_at_period_end,
        updated_at: new Date()
      });
    } else {
      return this.create({
        tenant_id: tenantId,
        stripe_subscription_id: stripeData.stripeSubscriptionId,
        stripe_customer_id: stripeData.stripeCustomerId,
        plan: stripeData.plan,
        status: stripeData.status,
        current_period_start: stripeData.currentPeriodStart,
        current_period_end: stripeData.currentPeriodEnd,
        cancel_at_period_end: stripeData.cancelAtPeriodEnd || false
      });
    }
  }

  async updateStatus(subscriptionId, status) {
    return this.update(subscriptionId, {
      status,
      updated_at: new Date()
    });
  }

  async cancelAtPeriodEnd(tenantId) {
    const subscription = await this.findActiveByTenantId(tenantId);
    if (!subscription) return null;

    return this.update(subscription.id, {
      cancel_at_period_end: true,
      updated_at: new Date()
    });
  }

  async reactivate(tenantId) {
    const subscription = await this.findActiveByTenantId(tenantId);
    if (!subscription) return null;

    return this.update(subscription.id, {
      cancel_at_period_end: false,
      updated_at: new Date()
    });
  }

  async getInvoices(tenantId) {
    const sql = `
      SELECT * FROM invoices
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const result = await query(sql, [tenantId]);
    return result.rows;
  }

  async createInvoice(tenantId, invoiceData) {
    return query(
      `INSERT INTO invoices (tenant_id, stripe_invoice_id, amount, currency, status, pdf_url, hosted_invoice_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tenantId,
        invoiceData.stripeInvoiceId,
        invoiceData.amount,
        invoiceData.currency,
        invoiceData.status,
        invoiceData.pdfUrl,
        invoiceData.hostedInvoiceUrl
      ]
    );
  }

  async checkPlanFeature(tenantId, feature) {
    const subscription = await this.findActiveByTenantId(tenantId);
    
    if (!subscription || subscription.status !== 'active') {
      // Free tier limits
      const freeLimits = {
        aiCredits: 10,
        teamMembers: 1,
        customDomain: false,
        removeBranding: false,
        analytics: false
      };
      return freeLimits[feature] || false;
    }

    const planFeatures = {
      free: {
        aiCredits: 10,
        teamMembers: 1,
        customDomain: false,
        removeBranding: false,
        analytics: false
      },
      pro: {
        aiCredits: 100,
        teamMembers: 5,
        customDomain: true,
        removeBranding: true,
        analytics: true
      },
      business: {
        aiCredits: 1000,
        teamMembers: 20,
        customDomain: true,
        removeBranding: true,
        analytics: true
      },
      enterprise: {
        aiCredits: -1, // unlimited
        teamMembers: -1,
        customDomain: true,
        removeBranding: true,
        analytics: true
      }
    };

    const features = planFeatures[subscription.plan] || planFeatures.free;
    return features[feature] || false;
  }

  async getUsageStats(tenantId) {
    const subscription = await this.findActiveByTenantId(tenantId);
    if (!subscription) return null;

    const stats = {
      plan: subscription.plan,
      status: subscription.status,
      aiCreditsUsed: 0,
      aiCreditsLimit: 0,
      storageUsed: 0,
      storageLimit: 0
    };

    // Get AI usage
    const aiResult = await query(
      `SELECT COUNT(*) as total FROM usage_logs 
       WHERE tenant_id = $1 AND type = 'ai_request'
       AND created_at >= $2`,
      [tenantId, subscription.current_period_start]
    );
    stats.aiCreditsUsed = parseInt(aiResult.rows[0].total, 10);

    // Get limits based on plan
    const planLimits = {
      free: { aiCredits: 10, storage: 104857600 },
      pro: { aiCredits: 100, storage: 10737418240 },
      business: { aiCredits: 1000, storage: 107374182400 },
      enterprise: { aiCredits: -1, storage: -1 }
    };

    const limits = planLimits[subscription.plan] || planLimits.free;
    stats.aiCreditsLimit = limits.aiCredits;
    stats.storageLimit = limits.storage;

    return stats;
  }
}

module.exports = new Subscription();
