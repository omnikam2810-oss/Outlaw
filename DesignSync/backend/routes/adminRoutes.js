const express = require('express');
const { getMetrics, getRecentActivity } = require('../controllers/adminController');
const { authenticate: protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/metrics', getMetrics);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
