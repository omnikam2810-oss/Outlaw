const express = require('express');
const { 
  getAssignments, createAssignment, getAssignment, submitAssignment, 
  getSubmissions, getSubmission, reviewSubmission, deleteAssignment
} = require('../controllers/academyController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

// Assignments
router.get('/assignments', getAssignments);
router.post('/assignments', authorize('admin', 'designer'), createAssignment);
router.get('/assignments/:id', getAssignment);
router.delete('/assignments/:id', authorize('admin'), deleteAssignment);

// Submissions for assignment
router.post('/assignments/:id/submit', authorize('academy_student', 'admin'), upload.single('file'), submitAssignment);

// Submissions generic routes
router.get('/submissions', getSubmissions);
router.get('/submissions/:id', getSubmission);
router.post('/submissions/:id/review', authorize('admin', 'designer'), reviewSubmission);

module.exports = router;
