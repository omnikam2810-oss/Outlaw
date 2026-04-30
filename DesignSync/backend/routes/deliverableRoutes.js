const express = require('express');
const { getDeliverables, uploadDeliverable, deleteDeliverable } = require('../controllers/deliverableController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');

const router = express.Router({ mergeParams: true }); // mergeParams needed to get projectId from projectRouter

router.use(authenticate);

router.get('/', getDeliverables);
router.post('/', authorize('admin', 'designer'), upload.single('file'), uploadDeliverable);
router.delete('/:id', authorize('admin', 'designer'), deleteDeliverable);

module.exports = router;
