const express = require('express');
const { getUsers, getUser, getEnterpriseClients, getDesigners, createUser, updateUser, updateUserAvatar, deleteUser, updateProfile, updateProfileAvatar, updatePassword } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

// Current user routes
router.put('/profile', updateProfile);
router.put('/profile/avatar', upload.single('avatar'), updateProfileAvatar);
router.put('/password', updatePassword);
router.get('/clients', authorize('admin', 'designer'), getEnterpriseClients);
router.get('/designers', authorize('admin'), getDesigners);

router.use(authorize('admin')); // All below are admin only

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id/avatar', upload.single('avatar'), updateUserAvatar);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
