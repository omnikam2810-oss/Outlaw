const Project = require('../models/Project');
const Deliverable = require('../models/Deliverable');
const FeedbackThread = require('../models/FeedbackThread');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { notifyUsers } = require('../utils/notify');

const canAccessProject = (user, project) => {
  if (user.role === 'admin') return true;
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
  
  if (req.user.role === 'enterprise_client') {
    query.clientId = req.user._id;
  } else if (req.user.role === 'designer') {
    query.designerIds = req.user._id;
  }
  // Admin sees all. 
  
  console.log(`[DEBUG] getProjects for user: ${req.user.email} (role: ${req.user.role})`);
  console.log(`[DEBUG] query:`, query);

  const projects = await Project.find(query).populate('clientId designerIds', 'name email avatar');
  console.log(`[DEBUG] found projects:`, projects.length);
  
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
  
  const { status } = req.body;
  
  if (req.user.role === 'enterprise_client' && status !== 'approved' && status !== 'in_review') {
    return next(new ApiError(403, 'Clients can only approve milestones or request review'));
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

// @desc    Permanently delete a completed project
exports.deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new ApiError(404, 'Project not found'));

  if (!['delivered', 'approved'].includes(project.status)) {
    return next(new ApiError(400, 'Project must be delivered or approved before it can be deleted'));
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
