const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'revision_requested'],
    default: 'submitted'
  },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);
