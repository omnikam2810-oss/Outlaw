const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get admin dashboard metrics
exports.getMetrics = asyncHandler(async (req, res, next) => {
  const totalProjects = await Project.countDocuments();
  const activeClients = await User.countDocuments({ role: 'enterprise_client' });
  const totalUsers = await User.countDocuments();
  const pendingApprovals = await User.countDocuments({ approvalStatus: 'pending' });
  const activeProjects = await Project.countDocuments({ status: { $in: ['draft', 'in_review', 'delivered'] } });

  res.status(200).json({
    success: true,
    data: {
      totalProjects,
      activeClients,
      totalUsers,
      pendingApprovals,
      activeProjects
    }
  });
});

// @desc    Get recent activity
exports.getRecentActivity = asyncHandler(async (req, res, next) => {
  // Get recent projects, notifications, etc.
  const recentProjects = await Project.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('clientId', 'name')
    .select('title status createdAt');

  const recentNotifications = await Notification.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'name')
    .select('message type createdAt');

  const activity = [
    ...recentProjects.map(p => ({
      type: 'project',
      message: `New project "${p.title}" created for ${p.clientId?.name || 'Unassigned client'}`,
      timestamp: p.createdAt
    })),
    ...recentNotifications.map(n => ({
      type: 'notification',
      message: n.message,
      timestamp: n.createdAt
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

  res.status(200).json({ success: true, data: activity });
});
