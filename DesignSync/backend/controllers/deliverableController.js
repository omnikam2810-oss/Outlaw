const Deliverable = require('../models/Deliverable');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary } = require('../services/storageService');
const { notifyUsers } = require('../utils/notify');

const canAccessProject = (user, project) => {
  if (user.role === 'admin') return true;
  if (user.role === 'enterprise_client') return project.clientId?.toString() === user._id.toString();
  if (user.role === 'designer') return project.designerIds?.some((id) => id.toString() === user._id.toString());
  return false;
};

const ensureProjectAccess = async (req, next) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    next(new ApiError(404, 'Project not found'));
    return null;
  }
  if (!canAccessProject(req.user, project)) {
    next(new ApiError(403, 'Not authorized to access this project'));
    return null;
  }
  return project;
};

exports.getDeliverables = asyncHandler(async (req, res, next) => {
  const project = await ensureProjectAccess(req, next);
  if (!project) return;

  const deliverables = await Deliverable.find({ projectId: req.params.projectId })
    .populate('uploadedBy', 'name avatar')
    .sort({ createdAt: -1 });
  
  res.status(200).json({ success: true, data: deliverables });
});

exports.uploadDeliverable = asyncHandler(async (req, res, next) => {
  const project = await ensureProjectAccess(req, next);
  if (!project) return;

  if (!req.file) {
    return next(new ApiError(400, 'Please upload a file'));
  }
  
  const { title, type, version } = req.body;
  const projectId = req.params.projectId;

  const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'designsync', req.file.originalname);

  const deliverable = await Deliverable.create({
    projectId,
    title: title || req.file.originalname,
    type: type || req.file.mimetype || 'application/octet-stream',
    fileUrl: result.url,
    version: version || '1',
    uploadedBy: req.user._id
  });

  const populated = await Deliverable.findById(deliverable._id).populate('uploadedBy', 'name avatar');
  
  const io = req.app.get('io');
  if (io) {
    io.to(`project_${projectId}`).emit('deliverable:new', populated);
  }

  await notifyUsers(req, [project.clientId, ...(project.designerIds || [])], {
    type: 'info',
    message: `New deliverable uploaded for "${project.title}"`,
    link: `/studios/${projectId}`
  });

  res.status(201).json({ success: true, data: populated });
});

exports.deleteDeliverable = asyncHandler(async (req, res, next) => {
  const deliverable = await Deliverable.findById(req.params.id);
  if (!deliverable) return next(new ApiError(404, 'Deliverable not found'));

  if (req.user.role !== 'admin' && deliverable.uploadedBy.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Not authorized to delete'));
  }

  await deliverable.deleteOne();
  res.status(200).json({ success: true, data: {} });
});
