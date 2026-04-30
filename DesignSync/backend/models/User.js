const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'designer', 'enterprise_client', 'academy_student'],
    required: true 
  },
  avatar: { type: String, default: null },
  companyName: { type: String },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
