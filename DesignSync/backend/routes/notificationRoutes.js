const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, clearNotifications } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.delete('/', clearNotifications);
router.put('/read-all', markAllAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
