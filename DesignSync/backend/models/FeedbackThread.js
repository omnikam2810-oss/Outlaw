const mongoose = require('mongoose');

const feedbackThreadSchema = new mongoose.Schema({
  deliverableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deliverable', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  position: {
    x: { type: Number },
    y: { type: Number },
    pageRef: { type: String }
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  replies: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('FeedbackThread', feedbackThreadSchema);
