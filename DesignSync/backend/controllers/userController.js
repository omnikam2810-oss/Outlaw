const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const { notifyUsers } = require('../utils/notify');

exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('-passwordHash');
  res.status(200).json({ success: true, count: users.length, data: users });
});

exports.getEnterpriseClients = asyncHandler(async (req, res, next) => {
  const clients = await User.find({ role: 'enterprise_client', isActive: { $ne: false } })
    .select('name email avatar companyName role')
    .sort({ name: 1 });

  res.status(200).json({ success: true, count: clients.length, data: clients });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, companyName, avatar } = req.body;

  if (!name || !email || !password || !role) {
    return next(new ApiError(400, 'Name, email, password, and role are required'));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError(400, 'Email already in use'));
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
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
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  if (!user) return next(new ApiError(404, 'User not found'));
  res.status(200).json({ success: true, data: user });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError(404, 'User not found'));
  const admins = await User.find({ role: 'admin', _id: { $ne: user._id } }).select('_id');
  
  await user.deleteOne();
  await notifyUsers(req, admins.map((admin) => admin._id), {
    type: 'info',
    message: `User account deleted: ${user.name}`
  });
  res.status(200).json({ success: true, data: {} });
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name }, {
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
