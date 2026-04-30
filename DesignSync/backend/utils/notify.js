const Notification = require('../models/Notification');

const normalizeIds = (userIds = []) => {
  const ids = userIds
    .filter(Boolean)
    .map((id) => id._id?.toString?.() || id.toString());
  return [...new Set(ids)];
};

const notifyUsers = async (req, userIds, payload) => {
  const ids = normalizeIds(userIds);
  if (ids.length === 0) return [];

  const notifications = await Notification.insertMany(
    ids.map((userId) => ({
      userId,
      type: payload.type || 'info',
      message: payload.message,
      link: payload.link
    }))
  );

  const io = req.app.get('io');
  if (io) {
    notifications.forEach((notification) => {
      io.to(`user_${notification.userId.toString()}`).emit('notification', notification);
    });
  }

  return notifications;
};

module.exports = { notifyUsers };
