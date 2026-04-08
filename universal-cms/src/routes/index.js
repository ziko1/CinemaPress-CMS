const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const tenantRoutes = require('./tenant.routes');
const collectionRoutes = require('./collection.routes');
const contentRoutes = require('./content.routes');
const pageRoutes = require('./page.routes');
const mediaRoutes = require('./media.routes');
const billingRoutes = require('./billing.routes');

// Register routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/collections', collectionRoutes);
router.use('/content', contentRoutes);
router.use('/pages', pageRoutes);
router.use('/media', mediaRoutes);
router.use('/billing', billingRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
