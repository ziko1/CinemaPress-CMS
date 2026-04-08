const express = require('express');
const router = express.Router();
const TenantController = require('../controllers/TenantController');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Tenant CRUD
router.get('/', TenantController.list);
router.post('/', TenantController.create);
router.get('/:id', TenantController.getById);
router.put('/:id', TenantController.update);
router.delete('/:id', TenantController.delete);

// Tenant members
router.get('/:id/members', TenantController.getMembers);
router.post('/:id/invite', TenantController.inviteMember);
router.put('/:id/members/:userId', TenantController.updateMemberRole);
router.delete('/:id/members/:userId', TenantController.removeMember);

// Tenant settings
router.get('/:id/settings', TenantController.getSettings);
router.put('/:id/settings', TenantController.updateSettings);

// Domain management
router.post('/:id/domains', TenantController.addDomain);
router.delete('/:id/domains/:domainId', TenantController.removeDomain);

module.exports = router;
