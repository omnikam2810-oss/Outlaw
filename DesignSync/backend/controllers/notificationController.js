const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new ApiError(404, 'Notification not found'));

  if (notification.userId.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Not authorized'));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ success: true, data: notification });
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, data: {} });
});

exports.clearNotifications = asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({ userId: req.user._id });
  res.status(200).json({ success: true, data: {} });
});
