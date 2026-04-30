const mongoose = require('mongoose');

const deliverableSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  fileUrl: { type: String, required: true },
  version: { type: String, default: '1' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Deliverable', deliverableSchema);
