const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const MentorReview = require('../models/MentorReview');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary } = require('../services/storageService');
const { notifyUsers } = require('../utils/notify');

exports.getAssignments = asyncHandler(async (req, res, next) => {
  const assignments = await Assignment.find().populate('mentorId', 'name email avatar');
  res.status(200).json({ success: true, count: assignments.length, data: assignments });
});

exports.createAssignment = asyncHandler(async (req, res, next) => {
  req.body.mentorId = req.user._id;
  const assignment = await Assignment.create(req.body);
  const students = await User.find({ role: 'academy_student', isActive: { $ne: false } }).select('_id');
  await notifyUsers(req, students.map((student) => student._id), {
    type: 'info',
    message: `New academy assignment: ${assignment.title}`,
    link: '/academy'
  });
  res.status(201).json({ success: true, data: assignment });
});

exports.getAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id).populate('mentorId', 'name email avatar');
  if (!assignment) return next(new ApiError(404, 'Assignment not found'));
  res.status(200).json({ success: true, data: assignment });
});

exports.deleteAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return next(new ApiError(404, 'Assignment not found'));

  const submissions = await Submission.find({ assignmentId: assignment._id }).select('_id studentId');
  const submissionIds = submissions.map((submission) => submission._id);
  const studentIds = submissions.map((submission) => submission.studentId);

  await MentorReview.deleteMany({ submissionId: { $in: submissionIds } });
  await Submission.deleteMany({ assignmentId: assignment._id });
  await assignment.deleteOne();

  await notifyUsers(req, studentIds, {
    type: 'info',
    message: `Academy assignment removed: ${assignment.title}`,
    link: '/academy'
  });

  res.status(200).json({ success: true, data: {} });
});

exports.submitAssignment = asyncHandler(async (req, res, next) => {
  let fileUrl = req.body.fileUrl; // fallback if plain text was sent
  const { notes } = req.body;
  
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'designsync-academy', req.file.originalname);
    fileUrl = result.url;
  }

  if (!fileUrl) {
    return next(new ApiError(400, 'Please upload a file before submitting'));
  }

  const submission = await Submission.create({
    assignmentId: req.params.id,
    studentId: req.user._id,
    fileUrl,
    notes
  });

  // Emit real-time event for new submission
  const io = req.app.get('io');
  if (io) io.emit('submission:new', { submission, assignmentId: req.params.id });

  const assignment = await Assignment.findById(req.params.id);
  const admins = await User.find({ role: 'admin' }).select('_id');
  await notifyUsers(req, [assignment?.mentorId, ...admins.map((admin) => admin._id)], {
    type: 'info',
    message: `${req.user.name} submitted work for "${assignment?.title || 'an assignment'}"`,
    link: '/academy'
  });

  res.status(201).json({ success: true, data: submission });
});

exports.getSubmissions = asyncHandler(async (req, res, next) => {
  let query = {};
  if (req.query.assignmentId) query.assignmentId = req.query.assignmentId;
  if (req.user.role === 'academy_student') {
    query.studentId = req.user._id;
  }
  const submissions = await Submission.find(query)
    .populate('studentId', 'name email avatar')
    .populate('assignmentId', 'title')
    .lean();

  const submissionIds = submissions.map((submission) => submission._id);
  const reviews = await MentorReview.find({ submissionId: { $in: submissionIds }, status: 'published' })
    .populate('mentorId', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();

  const latestReviewBySubmission = reviews.reduce((acc, review) => {
    const key = review.submissionId.toString();
    if (!acc[key]) acc[key] = review;
    return acc;
  }, {});

  const data = submissions.map((submission) => ({
    ...submission,
    latestReview: latestReviewBySubmission[submission._id.toString()] || null
  }));

  res.status(200).json({ success: true, count: data.length, data });
});

exports.getSubmission = asyncHandler(async (req, res, next) => {
  const submission = await Submission.findById(req.params.id)
    .populate('studentId', 'name email avatar')
    .populate('assignmentId', 'title');
  if (!submission) return next(new ApiError(404, 'Submission not found'));

  const latestReview = await MentorReview.findOne({ submissionId: submission._id, status: 'published' })
    .populate('mentorId', 'name email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { ...submission.toObject(), latestReview } });
});

exports.reviewSubmission = asyncHandler(async (req, res, next) => {
  const { rating, feedback, status } = req.body;
  const submissionStatus = status === 'needs_revision' ? 'revision_requested' : status;

  const submission = await Submission.findById(req.params.id);
  if (!submission) return next(new ApiError(404, 'Submission not found'));
  if (!feedback?.trim()) return next(new ApiError(400, 'Please add feedback notes for the student'));
  
  const review = await MentorReview.create({
    submissionId: req.params.id,
    mentorId: req.user._id,
    rating,
    feedback
  });

  submission.status = submissionStatus || 'approved'; 
  await submission.save();

  // Emit real-time event for the review
  const io = req.app.get('io');
  if (io) io.emit('submission:reviewed', { submission, review });

  await notifyUsers(req, [submission.studentId], {
    type: submission.status === 'approved' ? 'success' : 'message',
    message: `Your assignment review is ready: ${submission.status.replace('_', ' ')}`,
    link: '/academy'
  });

  res.status(201).json({ success: true, data: review });
});
