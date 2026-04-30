const express = require('express');
const { getFeedback, createFeedback, resolveFeedback, replyFeedback } = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getFeedback);
router.post('/', authorize('admin', 'designer', 'enterprise_client'), createFeedback);

// Global feedback modification
router.put('/:id/resolve', authorize('admin', 'designer', 'enterprise_client'), resolveFeedback);
router.post('/:id/reply', authorize('admin', 'designer', 'enterprise_client'), replyFeedback);

module.exports = router;
