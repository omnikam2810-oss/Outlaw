const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'submitted', 'approved'],
    default: 'open'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['draft', 'in_review', 'approved', 'delivered'],
    default: 'draft'
  },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  designerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  features: [featureSchema],
  coverImage: { type: String },
  deadline: { type: Date }
}, {
  timestamps: true
});

projectSchema.index({ clientId: 1, createdAt: -1 });
projectSchema.index({ designerIds: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
