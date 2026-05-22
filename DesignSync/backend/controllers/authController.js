const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createSupabaseUser, signInWithSupabase } = require('../services/supabaseAuthService');

const SELF_REGISTRATION_ROLES = ['admin', 'designer', 'enterprise_client', 'academy_student'];

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  approvalStatus: user.approvalStatus || 'approved'
});

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, companyName } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';
  const requestedRole = role || 'academy_student';

  if (!name?.trim() || !normalizedEmail || !normalizedPassword) {
    return next(new ApiError(400, 'Name, email, and password are required'));
  }

  if (normalizedPassword.length < 6) {
    return next(new ApiError(400, 'Password must be at least 6 characters'));
  }

  if (!SELF_REGISTRATION_ROLES.includes(requestedRole)) {
    return next(new ApiError(400, 'Please choose a valid role'));
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(new ApiError(400, 'Email already in use'));
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(normalizedPassword, salt);
  const supabaseUser = await createSupabaseUser({
    email: normalizedEmail,
    password: normalizedPassword,
    name: name.trim(),
    role: requestedRole
  });

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: requestedRole,
    companyName,
    approvalStatus: 'pending',
    supabaseUserId: supabaseUser?.id,
    authProvider: supabaseUser ? 'supabase' : 'local'
  });

  res.status(201).json({
    success: true,
    requiresApproval: true,
    message: 'Registration submitted. A super admin must approve your account before you can sign in.',
    user: publicUser(user)
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';

  if (!normalizedEmail || !normalizedPassword) {
    return next(new ApiError(400, 'Please provide an email and password'));
  }

  let user = await User.findOne({ email: normalizedEmail });
  const supabaseSession = await signInWithSupabase(normalizedEmail, normalizedPassword);
  if (user && supabaseSession?.user?.id && !user.supabaseUserId) {
    user.supabaseUserId = supabaseSession.user.id;
    user.authProvider = 'supabase';
  }

  const localPasswordMatches = user ? await bcrypt.compare(normalizedPassword, user.passwordHash) : false;
  if (!user || (!localPasswordMatches && !supabaseSession?.user)) {
    return next(new ApiError(401, 'Invalid credentials'));
  }

  if ((user.approvalStatus || 'approved') !== 'approved') {
    return next(new ApiError(403, 'Your account is pending super admin approval'));
  }

  if (!user.isActive) {
    return next(new ApiError(403, 'User account is inactive'));
  }

  user.lastLogin = Date.now();
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id);
  setTokenCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    token: accessToken,
    refreshToken,
    supabaseToken: supabaseSession?.session?.access_token,
    user: publicUser(user)
  });
});

exports.refresh = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    return next(new ApiError(401, 'Not authorized, no refresh token'));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'Invalid refresh token'));
    }
    if ((user.approvalStatus || 'approved') !== 'approved') {
      return next(new ApiError(403, 'Your account is pending super admin approval'));
    }

    const tokens = generateTokens(user._id);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Tokens refreshed'
    });
  } catch (err) {
    return next(new ApiError(401, 'Not authorized, invalid refresh token'));
  }
});

exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('accessToken', 'none', { expires: new Date(0), httpOnly: true });
  res.cookie('refreshToken', 'none', { expires: new Date(0), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

exports.getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, user: req.user });
});
