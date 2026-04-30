const mongoose = require('mongoose');

const mentorReviewSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  reviewedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('MentorReview', mentorReviewSchema);
