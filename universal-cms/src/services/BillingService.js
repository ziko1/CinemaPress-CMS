/**
 * Billing Service - Stripe integration & subscription management
 */

const Stripe = require('stripe');

class BillingService {
  constructor(pool, stripeSecretKey) {
    this.pool = pool;
    this.stripe = new Stripe(stripeSecretKey);
    this.plans = {
      free: { priceId: null, features: [] },
      pro: { 
        priceId: process.env.STRIPE_PRO_PRICE_ID,
        features: ['custom_domain', 'no_watermark', 'advanced_seo']
      },
      business: { 
        priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
        features: ['team_access', 'automation', 'analytics']
      },
      enterprise: { 
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
        features: ['dedicated_infra', 'priority_support', 'unlimited_everything']
      }
    };
  }

  /**
   * Create Stripe customer for tenant
   */
  async createCustomer(tenantId, email, name) {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { tenant_id: tenantId }
    });

    await this.pool.query(`
      UPDATE subscriptions
      SET stripe_customer_id = $1
      WHERE tenant_id = $2
    `, [customer.id, tenantId]);

    return customer;
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(tenantId, plan, successUrl, cancelUrl) {
    const subscription = await this.getSubscriptionByTenant(tenantId);
    
    if (!subscription || !subscription.stripe_customer_id) {
      // Get tenant info to create customer
      const tenantResult = await this.pool.query(
        'SELECT * FROM tenants WHERE id = $1',
        [tenantId]
      );
      
      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found');
      }
      
      const tenant = tenantResult.rows[0];
      await this.createCustomer(tenantId, tenant.email || 'user@example.com', tenant.name);
    }

    const priceId = this.plans[plan]?.priceId;
    if (!priceId) {
      throw new Error('Invalid plan');
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: subscription.stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenant_id: tenantId,
        plan
      },
      allow_promotion_codes: true,
      trial_period_days: plan === 'pro' || plan === 'business' ? 14 : 0
    });

    return session;
  }

  /**
   * Create billing portal session for managing subscription
   */
  async createPortalSession(tenantId, returnUrl) {
    const subscription = await this.getSubscriptionByTenant(tenantId);
    
    if (!subscription || !subscription.stripe_customer_id) {
      throw new Error('No active subscription found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl
    });

    return session;
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhook(event) {
    const { type, data } = event;

    switch (type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(data.object);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(data.object);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(data.object);
        break;
      
      case 'invoice.payment_failed':
        await this.handleInvoiceFailed(data.object);
        break;
    }
  }

  /**
   * Handle checkout.session.completed
   */
  async handleCheckoutCompleted(session) {
    const { tenant_id, plan } = session.metadata;
    
    await this.pool.query(`
      INSERT INTO subscriptions (
        tenant_id, stripe_subscription_id, stripe_customer_id, 
        plan, status, current_period_start, current_period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (tenant_id) DO UPDATE SET
        stripe_subscription_id = $2,
        plan = $4,
        status = $5,
        current_period_start = $6,
        current_period_end = $7,
        updated_at = NOW()
    `, [
      tenant_id,
      session.subscription,
      session.customer,
      plan,
      'active',
      new Date(session.current_period_start * 1000),
      new Date(session.current_period_end * 1000)
    ]);

    // Update tenant plan
    await this.pool.query(`
      UPDATE tenants SET plan = $1, updated_at = NOW()
      WHERE id = $2
    `, [plan, tenant_id]);
  }

  /**
   * Handle customer.subscription.updated
   */
  async handleSubscriptionUpdated(subscription) {
    await this.pool.query(`
      UPDATE subscriptions SET
        status = $1,
        current_period_start = $2,
        current_period_end = $3,
        cancel_at_period_end = $4,
        canceled_at = $5,
        updated_at = NOW()
      WHERE stripe_subscription_id = $6
    `, [
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.cancel_at_period_end,
      subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      subscription.id
    ]);
  }

  /**
   * Handle customer.subscription.deleted
   */
  async handleSubscriptionDeleted(subscription) {
    await this.pool.query(`
      UPDATE subscriptions SET
        status = 'canceled',
        canceled_at = NOW(),
        updated_at = NOW()
      WHERE stripe_subscription_id = $1
    `, [subscription.id]);

    // Downgrade tenant to free
    const result = await this.pool.query(
      'SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscription.id]
    );
    
    if (result.rows.length > 0) {
      await this.pool.query(`
        UPDATE tenants SET plan = 'free', updated_at = NOW()
        WHERE id = $1
      `, [result.rows[0].tenant_id]);
    }
  }

  /**
   * Handle invoice.payment_succeeded
   */
  async handleInvoicePaid(invoice) {
    await this.pool.query(`
      INSERT INTO invoices (
        tenant_id, stripe_invoice_id, amount, currency, 
        status, period_start, period_end, paid_at, pdf_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
      ON CONFLICT (stripe_invoice_id) DO UPDATE SET
        status = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
    `, [
      this.getTenantIdFromCustomerId(invoice.customer),
      invoice.id,
      invoice.amount_paid / 100, // Convert cents to dollars
      invoice.currency.toUpperCase(),
      'paid',
      new Date(invoice.lines.data[0]?.period?.start * 1000),
      new Date(invoice.lines.data[0]?.period?.end * 1000),
      invoice.hosted_invoice_url
    ]);
  }

  /**
   * Handle invoice.payment_failed
   */
  async handleInvoiceFailed(invoice) {
    await this.pool.query(`
      INSERT INTO invoices (
        tenant_id, stripe_invoice_id, amount, currency, 
        status, period_start, period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (stripe_invoice_id) DO UPDATE SET
        status = 'failed',
        updated_at = NOW()
    `, [
      this.getTenantIdFromCustomerId(invoice.customer),
      invoice.id,
      invoice.amount_due / 100,
      invoice.currency.toUpperCase(),
      'failed',
      new Date(invoice.lines.data[0]?.period?.start * 1000),
      new Date(invoice.lines.data[0]?.period?.end * 1000)
    ]);
  }

  /**
   * Get subscription by tenant ID
   */
  async getSubscriptionByTenant(tenantId) {
    const result = await this.pool.query(`
      SELECT * FROM subscriptions
      WHERE tenant_id = $1 AND status IN ('active', 'trialing')
      ORDER BY created_at DESC
      LIMIT 1
    `, [tenantId]);

    return result.rows[0] || null;
  }

  /**
   * Record usage for billing
   */
  async recordUsage(tenantId, metric, value, periodStart, periodEnd) {
    await this.pool.query(`
      INSERT INTO usage_records (
        tenant_id, metric, value, period_start, period_end
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (tenant_id, metric, period_start, period_end) 
      DO UPDATE SET value = usage_records.value + $3
    `, [tenantId, metric, value, periodStart, periodEnd]);
  }

  /**
   * Get current usage for tenant
   */
  async getCurrentUsage(tenantId, periodStart, periodEnd) {
    const result = await this.pool.query(`
      SELECT metric, SUM(value) as total_value
      FROM usage_records
      WHERE tenant_id = $1 
        AND period_start >= $2 
        AND period_end <= $3
      GROUP BY metric
    `, [tenantId, periodStart, periodEnd]);

    return result.rows;
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(tenantId) {
    const subscription = await this.getSubscriptionByTenant(tenantId);
    
    if (!subscription || !subscription.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    await this.pool.query(`
      UPDATE subscriptions SET
        cancel_at_period_end = TRUE,
        updated_at = NOW()
      WHERE tenant_id = $1
    `, [tenantId]);
  }

  /**
   * Helper to get tenant ID from Stripe customer ID
   */
  async getTenantIdFromCustomerId(customerId) {
    const result = await this.pool.query(
      'SELECT tenant_id FROM subscriptions WHERE stripe_customer_id = $1',
      [customerId]
    );
    
    return result.rows[0]?.tenant_id;
  }
}

module.exports = BillingService;
