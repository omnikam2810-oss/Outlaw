const FeedbackThread = require('../models/FeedbackThread');
const Deliverable = require('../models/Deliverable');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { notifyUsers } = require('../utils/notify');

const canAccessProject = (user, project) => {
  if (user.role === 'admin') return true;
  if (user.role === 'enterprise_client') return project.clientId?.toString() === user._id.toString();
  if (user.role === 'designer') return project.designerIds?.some((id) => id.toString() === user._id.toString());
  return false;
};

const ensureDeliverableAccess = async (req, next, deliverableId) => {
  const deliverable = await Deliverable.findById(deliverableId);
  if (!deliverable) {
    next(new ApiError(404, 'Deliverable not found'));
    return null;
  }

  const project = await Project.findById(deliverable.projectId);
  if (!project) {
    next(new ApiError(404, 'Project not found'));
    return null;
  }

  if (!canAccessProject(req.user, project)) {
    next(new ApiError(403, 'Not authorized to access this deliverable'));
    return null;
  }

  return { deliverable, project };
};

exports.getFeedback = asyncHandler(async (req, res, next) => {
  const access = await ensureDeliverableAccess(req, next, req.params.deliverableId);
  if (!access) return;

  const threads = await FeedbackThread.find({ deliverableId: req.params.deliverableId })
    .populate('authorId', 'name email avatar')
    .populate('replies.authorId', 'name email avatar');

  res.status(200).json({ success: true, data: threads });
});

exports.createFeedback = asyncHandler(async (req, res, next) => {
  const { comment, position } = req.body;
  const deliverableId = req.params.deliverableId;
  const access = await ensureDeliverableAccess(req, next, deliverableId);
  if (!access) return;
  const { project } = access;

  const thread = await FeedbackThread.create({
    deliverableId,
    authorId: req.user._id,
    comment,
    position
  });

  const populated = await FeedbackThread.findById(thread._id).populate('authorId', 'name email avatar');

  // Emit real-time event to all clients watching this deliverable
  const io = req.app.get('io');
  if (io) io.emit(`feedback:new:${deliverableId}`, populated);

  const recipients = [project.clientId, ...(project.designerIds || [])].filter(
    (id) => id.toString() !== req.user._id.toString()
  );
  await notifyUsers(req, recipients, {
    type: 'message',
    message: `New feedback on "${project.title}" from ${req.user.name}`,
    link: `/studios/${project._id}`
  });

  res.status(201).json({ success: true, data: populated });
});

exports.resolveFeedback = asyncHandler(async (req, res, next) => {
  const thread = await FeedbackThread.findById(req.params.id);
  if (!thread) return next(new ApiError(404, 'Feedback thread not found'));
  const access = await ensureDeliverableAccess(req, next, thread.deliverableId);
  if (!access) return;

  thread.status = 'resolved';
  await thread.save();

  const io = req.app.get('io');
  if (io) io.emit(`feedback:resolved:${thread.deliverableId}`, thread);

  res.status(200).json({ success: true, data: thread });
});

exports.replyFeedback = asyncHandler(async (req, res, next) => {
  const { comment } = req.body;
  const thread = await FeedbackThread.findById(req.params.id);

  if (!thread) return next(new ApiError(404, 'Feedback not found'));
  const access = await ensureDeliverableAccess(req, next, thread.deliverableId);
  if (!access) return;
  const { project } = access;

  thread.replies.push({
    authorId: req.user._id,
    comment
  });

  await thread.save();
  const populated = await FeedbackThread.findById(thread._id)
    .populate('authorId', 'name email avatar')
    .populate('replies.authorId', 'name email avatar');

  const io = req.app.get('io');
  if (io) io.emit(`feedback:reply:${thread.deliverableId}`, populated);

  const recipients = [
    thread.authorId,
    project.clientId,
    ...(project.designerIds || [])
  ].filter((id) => id.toString() !== req.user._id.toString());
  await notifyUsers(req, recipients, {
    type: 'message',
    message: `New reply on feedback for "${project.title}"`,
    link: `/studios/${project._id}`
  });

  res.status(200).json({ success: true, data: populated });
});
