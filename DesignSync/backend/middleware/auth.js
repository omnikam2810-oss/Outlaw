const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { getSupabaseUserFromToken } = require('../services/supabaseAuthService');

const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  // Get token from HttpOnly cookie or Authorization header fallback
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized to access this route'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-passwordHash');
  } catch (err) {
    const supabaseUser = await getSupabaseUserFromToken(token);
    if (supabaseUser) {
      req.user = await User.findOne({
        $or: [
          { supabaseUserId: supabaseUser.id },
          { email: supabaseUser.email?.toLowerCase() }
        ]
      }).select('-passwordHash');
    }
  }

  if (!req.user) {
    return next(new ApiError(401, 'User not found'));
  }
  if (!req.user.isActive) {
    return next(new ApiError(403, 'User account is inactive'));
  }
  if ((req.user.approvalStatus || 'approved') !== 'approved') {
    return next(new ApiError(403, 'Your account is pending super admin approval'));
  }
  next();
});

module.exports = { authenticate };
