import express from 'express';
import { body, param, query } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware.js';
import AuthController from '../controllers/AuthController.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('tenantName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Tenant name can only contain lowercase letters, numbers, and hyphens'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('tenantId')
    .optional()
    .isUUID()
    .withMessage('Invalid tenant ID'),
];

const refreshValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  body('tenantId')
    .optional()
    .isUUID()
    .withMessage('Invalid tenant ID'),
];

const resetRequestValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
];

const resetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
];

// Routes
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user and create tenant
 * @access  Public
 */
router.post(
  '/register',
  registerValidation,
  asyncHandler(AuthController.register)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginValidation,
  asyncHandler(AuthController.login)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post(
  '/refresh',
  refreshValidation,
  asyncHandler(AuthController.refreshToken)
);

/**
 * @route   POST /api/v1/auth/reset-password/request
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/reset-password/request',
  resetRequestValidation,
  asyncHandler(AuthController.requestReset)
);

/**
 * @route   POST /api/v1/auth/reset-password/confirm
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password/confirm',
  resetValidation,
  asyncHandler(AuthController.resetPassword)
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get(
  '/me',
  asyncHandler(AuthController.getCurrentUser)
);

export default router;
