const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const { notifyUsers } = require('../utils/notify');
const { uploadToCloudinary } = require('../services/storageService');

const ADMIN_MANAGED_ROLES = ['designer', 'enterprise_client', 'academy_student'];

exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-passwordHash');
  res.status(200).json({ success: true, count: users.length, data: users });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user) return next(new ApiError(404, 'User not found'));

  res.status(200).json({ success: true, data: user });
});

exports.getEnterpriseClients = asyncHandler(async (req, res, next) => {
  const clients = await User.find({ role: 'enterprise_client', isActive: { $ne: false } })
    .select('name email avatar companyName role')
    .sort({ name: 1 });

  res.status(200).json({ success: true, count: clients.length, data: clients });
});

exports.getDesigners = asyncHandler(async (req, res, next) => {
  const designers = await User.find({ role: 'designer', isActive: { $ne: false } })
    .select('name email avatar role')
    .sort({ name: 1 });

  res.status(200).json({ success: true, count: designers.length, data: designers });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, companyName, avatar } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';

  if (!name?.trim() || !normalizedEmail || !normalizedPassword || !role) {
    return next(new ApiError(400, 'Name, email, password, and role are required'));
  }

  if (normalizedPassword.length < 6) {
    return next(new ApiError(400, 'Password must be at least 6 characters'));
  }

  if (!ADMIN_MANAGED_ROLES.includes(role)) {
    return next(new ApiError(400, 'Admin can create designer, enterprise client, or academy student accounts only'));
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(new ApiError(400, 'Email already in use'));
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(normalizedPassword, salt);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    companyName,
    avatar
  });

  const admins = await User.find({ role: 'admin' }).select('_id');
  await notifyUsers(req, [user._id, ...admins.map((admin) => admin._id)], {
    type: 'success',
    message: `User account created for ${user.name}`
  });
  user.passwordHash = undefined;
  res.status(201).json({ success: true, data: user });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const existingUser = await User.findById(req.params.id);
  if (!existingUser) return next(new ApiError(404, 'User not found'));

  if (req.body.role === 'admin' && existingUser.role !== 'admin') {
    return next(new ApiError(400, 'Only one admin account is allowed'));
  }

  if (existingUser.role === 'admin' && req.body.role && req.body.role !== 'admin') {
    return next(new ApiError(400, 'The admin account role cannot be changed'));
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  res.status(200).json({ success: true, data: user });
});

exports.updateUserAvatar = asyncHandler(async (req, res, next) => {
  const existingUser = await User.findById(req.params.id);
  if (!existingUser) return next(new ApiError(404, 'User not found'));
  if (!req.file) return next(new ApiError(400, 'Please upload a profile photo'));
  if (!req.file.mimetype?.startsWith('image/')) {
    return next(new ApiError(400, 'Profile photo must be an image'));
  }

  const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'designsync-avatars', req.file.originalname);
  const user = await User.findByIdAndUpdate(req.params.id, { avatar: result.url }, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  res.status(200).json({ success: true, data: user });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError(404, 'User not found'));
  if (user.role === 'admin') return next(new ApiError(400, 'The admin account cannot be deleted'));

  const admins = await User.find({ role: 'admin', _id: { $ne: user._id } }).select('_id');
  
  await user.deleteOne();
  await notifyUsers(req, admins.map((admin) => admin._id), {
    type: 'info',
    message: `User account deleted: ${user.name}`
  });
  res.status(200).json({ success: true, data: {} });
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, avatar } = req.body;
  const updates = { name };
  if (Object.prototype.hasOwnProperty.call(req.body, 'avatar')) updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  res.status(200).json({ success: true, data: user });
});

exports.updateProfileAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'Please upload a profile photo'));
  if (!req.file.mimetype?.startsWith('image/')) {
    return next(new ApiError(400, 'Profile photo must be an image'));
  }

  const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'designsync-avatars', req.file.originalname);
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: result.url }, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  res.status(200).json({ success: true, data: user });
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid current password'));
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.status(200).json({ success: true, data: {} });
});
