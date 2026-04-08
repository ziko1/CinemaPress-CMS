import express from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import AIController from '../controllers/AIController.js';

const router = express.Router();

// Validation rules
const generateContentValidation = [
  body('prompt')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Prompt must be between 10 and 2000 characters'),
  body('type')
    .isIn(['text', 'page', 'translation', 'meta', 'alt-text'])
    .withMessage('Invalid content type'),
  body('options')
    .optional()
    .isObject(),
];

const generatePageValidation = [
  body('prompt')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Please provide a detailed description (20-1000 chars)'),
  body('style')
    .optional()
    .isIn(['modern', 'minimal', 'corporate', 'creative', 'ecommerce']),
  body('sections')
    .optional()
    .isArray(),
];

const translateContentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required'),
  body('sourceLang')
    .isLength({ min: 2, max: 5 })
    .withMessage('Invalid source language code'),
  body('targetLang')
    .isLength({ min: 2, max: 5 })
    .withMessage('Invalid target language code'),
];

// Routes
/**
 * @route   POST /api/v1/ai/generate
 * @desc    Generate content using AI
 * @access  Private
 */
router.post(
  '/generate',
  generateContentValidation,
  asyncHandler(AIController.generateContent)
);

/**
 * @route   POST /api/v1/ai/generate-page
 * @desc    Generate complete page structure
 * @access  Private
 */
router.post(
  '/generate-page',
  generatePageValidation,
  asyncHandler(AIController.generatePage)
);

/**
 * @route   POST /api/v1/ai/translate
 * @desc    Translate content
 * @access  Private
 */
router.post(
  '/translate',
  translateContentValidation,
  asyncHandler(AIController.translateContent)
);

/**
 * @route   POST /api/v1/ai/optimize-seo
 * @desc    Optimize content for SEO
 * @access  Private
 */
router.post(
  '/optimize-seo',
  asyncHandler(AIController.optimizeSEO)
);

/**
 * @route   GET /api/v1/ai/usage
 * @desc    Get AI usage statistics
 * @access  Private
 */
router.get(
  '/usage',
  asyncHandler(AIController.getUsage)
);

export default router;
