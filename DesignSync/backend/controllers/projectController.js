const Project = require('../models/Project');
const Deliverable = require('../models/Deliverable');
const FeedbackThread = require('../models/FeedbackThread');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { notifyUsers } = require('../utils/notify');

const COMPLETED_PROJECT_STATUSES = ['approved', 'completed'];
const PROJECT_STATUSES = ['draft', 'in_review', 'approved', 'delivered', 'completed'];

const canAccessProject = (user, project) => {
  if (user.role === 'admin') return true;
  if (COMPLETED_PROJECT_STATUSES.includes(project.status)) return false;
  if (user.role === 'enterprise_client') {
    return project.clientId?._id?.toString?.() === user._id.toString() || project.clientId?.toString?.() === user._id.toString();
  }
  if (user.role === 'designer') {
    return project.designerIds?.some((id) => id._id?.toString?.() === user._id.toString() || id.toString() === user._id.toString());
  }
  return false;
};

// @desc    Get all projects (filtered by role)
exports.getProjects = asyncHandler(async (req, res, next) => {
  let query = {};
  const showCompleted = req.user.role === 'admin' && req.query.view === 'completed';
  
  if (req.user.role === 'enterprise_client') {
    query.clientId = req.user._id;
  } else if (req.user.role === 'designer') {
    query.designerIds = req.user._id;
  }

  query.status = showCompleted
    ? { $in: COMPLETED_PROJECT_STATUSES }
    : { $nin: COMPLETED_PROJECT_STATUSES };
  
  const projects = await Project.find(query)
    .populate('clientId designerIds', 'name email avatar')
    .sort({ updatedAt: -1 })
    .lean();
  
  res.status(200).json({ success: true, count: projects.length, data: projects });
});

// @desc    Create a project
exports.createProject = asyncHandler(async (req, res, next) => {
  const { title, description, clientId, designerIds, coverImage, deadline } = req.body;
  const assignedDesignerIds = Array.isArray(designerIds) ? [...designerIds] : [];

  if (req.user.role === 'designer' && !assignedDesignerIds.some((id) => id.toString() === req.user._id.toString())) {
    assignedDesignerIds.push(req.user._id);
  }
  
  const project = await Project.create({
    title,
    description,
    clientId,
    designerIds: assignedDesignerIds,
    coverImage,
    deadline
  });

  const populatedProject = await Project.findById(project._id).populate('clientId designerIds', 'name email avatar');

  await notifyUsers(req, [clientId, ...assignedDesignerIds], {
    type: 'info',
    message: `Project "${project.title}" has been created`,
    link: `/studios/${project._id}`
  });

  res.status(201).json({ success: true, data: populatedProject });
});

// @desc    Get single project
exports.getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('clientId designerIds', 'name email avatar');
    
  if (!project) return next(new ApiError(404, 'Project not found'));
  
  if (!canAccessProject(req.user, project)) {
    return next(new ApiError(403, 'Not authorized to access this project'));
  }
  
  res.status(200).json({ success: true, data: project });
});

// @desc    Update project status
exports.updateProjectStatus = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ApiError(404, 'Project not found'));

  if (!canAccessProject(req.user, project)) {
    return next(new ApiError(403, 'Not authorized to access this project'));
  }
  
  const { status } = req.body;

  if (!PROJECT_STATUSES.includes(status)) {
    return next(new ApiError(400, 'Invalid project status'));
  }
  
  if (req.user.role === 'enterprise_client' && status !== 'approved' && status !== 'in_review') {
    return next(new ApiError(403, 'Clients can only approve milestones or request review'));
  }

  if (status === 'completed' && req.user.role !== 'admin') {
    return next(new ApiError(403, 'Only admins can mark projects as done'));
  }

  project.status = status;
  await project.save();

  await notifyUsers(req, [project.clientId, ...(project.designerIds || [])], {
    type: status === 'approved' ? 'success' : 'info',
    message: `Project "${project.title}" status changed to ${status.replace('_', ' ')}`,
    link: `/studios/${project._id}`
  });

  res.status(200).json({ success: true, data: project });
});

// @desc    Add an admin-defined feature/request to a project
exports.addProjectFeature = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ApiError(404, 'Project not found'));

  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Only admins can add project features'));
  }

  const { title, description } = req.body;
  if (!title?.trim()) {
    return next(new ApiError(400, 'Feature title is required'));
  }

  project.features.push({
    title: title.trim(),
    description: description?.trim() || '',
    createdBy: req.user._id
  });
  await project.save();

  const feature = project.features[project.features.length - 1];

  await notifyUsers(req, [project.clientId, ...(project.designerIds || [])], {
    type: 'info',
    message: `Feature "${feature.title}" was added to "${project.title}"`,
    link: `/studios/${project._id}`
  });

  res.status(201).json({ success: true, data: feature });
});

// @desc    Update a project feature status
exports.updateProjectFeature = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ApiError(404, 'Project not found'));

  if (!canAccessProject(req.user, project)) {
    return next(new ApiError(403, 'Not authorized to access this project'));
  }

  const feature = project.features.id(req.params.featureId);
  if (!feature) return next(new ApiError(404, 'Feature not found'));

  const { title, description, status } = req.body;
  if (title !== undefined) feature.title = title.trim();
  if (description !== undefined) feature.description = description.trim();
  if (status !== undefined) {
    if (!['open', 'in_progress', 'submitted', 'approved'].includes(status)) {
      return next(new ApiError(400, 'Invalid feature status'));
    }
    feature.status = status;
  }

  await project.save();

  res.status(200).json({ success: true, data: feature });
});

// @desc    Delete an admin-defined feature and its linked deliverables
exports.deleteProjectFeature = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ApiError(404, 'Project not found'));

  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Only admins can delete project features'));
  }

  const feature = project.features.id(req.params.featureId);
  if (!feature) return next(new ApiError(404, 'Feature not found'));

  const deliverables = await Deliverable.find({
    projectId: project._id,
    featureId: req.params.featureId
  }).select('_id');
  const deliverableIds = deliverables.map((deliverable) => deliverable._id);

  if (deliverableIds.length > 0) {
    await FeedbackThread.deleteMany({ deliverableId: { $in: deliverableIds } });
    await Deliverable.deleteMany({ _id: { $in: deliverableIds } });
  }

  project.features.pull(req.params.featureId);
  await project.save();

  await notifyUsers(req, [project.clientId, ...(project.designerIds || [])], {
    type: 'info',
    message: `Feature "${feature.title}" was removed from "${project.title}"`,
    link: `/studios/${project._id}`
  });

  res.status(200).json({ success: true, data: {} });
});

// @desc    Permanently delete a completed project
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ApiError(404, 'Project not found'));

  if (!['delivered', 'approved', 'completed'].includes(project.status)) {
    return next(new ApiError(400, 'Project must be delivered, approved, or completed before it can be deleted'));
  }

  const deliverables = await Deliverable.find({ projectId: project._id }).select('_id');
  const deliverableIds = deliverables.map((deliverable) => deliverable._id);

  if (deliverableIds.length > 0) {
    await FeedbackThread.deleteMany({ deliverableId: { $in: deliverableIds } });
    await Deliverable.deleteMany({ _id: { $in: deliverableIds } });
  }

  await project.deleteOne();

  const admins = await User.find({ role: 'admin' }).select('_id');
  await notifyUsers(req, admins.map((admin) => admin._id), {
    type: 'info',
    message: `Project "${project.title}" was permanently deleted`
  });

  res.status(200).json({ success: true, data: {} });
});
