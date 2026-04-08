const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/CollectionController');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', CollectionController.list);
router.post('/', CollectionController.create);
router.get('/:id', CollectionController.getById);
router.get('/:id/schema', CollectionController.getSchema);
router.put('/:id', CollectionController.update);
router.delete('/:id', CollectionController.delete);

module.exports = router;
