const express = require('express');
const { getUsers, getEnterpriseClients, getDesigners, createUser, updateUser, deleteUser, updateProfile, updatePassword } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Current user routes
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.get('/clients', authorize('admin', 'designer'), getEnterpriseClients);
router.get('/designers', authorize('admin'), getDesigners);

router.use(authorize('admin')); // All below are admin only

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
