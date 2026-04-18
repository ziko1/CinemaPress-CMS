import express from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import BillingController from '../controllers/BillingController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (verified by signature)
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  asyncHandler(BillingController.handleStripeWebhook)
);

export default router;
