const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
    role: role || 'academy_student',
    companyName
  });

  const { accessToken, refreshToken } = generateTokens(user._id);
  setTokenCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    token: accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ApiError(400, 'Please provide an email and password'));
  }

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return next(new ApiError(401, 'Invalid credentials'));
  }

  user.lastLogin = Date.now();
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id);
  setTokenCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    token: accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
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
