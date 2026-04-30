const mongoose = require('mongoose');

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
  coverImage: { type: String },
  deadline: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
