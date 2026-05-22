const express = require('express');
const { getProjects, createProject, getProject, updateProjectStatus, addProjectFeature, updateProjectFeature, deleteProject } = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// All roles can get projects (filtered in controller)
router.get('/', getProjects);
router.post('/', authorize('admin', 'designer'), createProject);
router.get('/:id', getProject);
router.put('/:id/status', authorize('admin', 'designer', 'enterprise_client'), updateProjectStatus);
router.post('/:id/features', authorize('admin', 'designer', 'enterprise_client'), addProjectFeature);
router.put('/:id/features/:featureId', authorize('admin', 'designer', 'enterprise_client'), updateProjectFeature);
router.delete('/:id', authorize('admin'), deleteProject);

// deliverables routes will be handled on their own router or nested here

module.exports = router;
