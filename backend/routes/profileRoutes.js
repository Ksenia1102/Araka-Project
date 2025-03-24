const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/:userId', verifyToken, ProfileController.getProfile);
router.put('/:userId', verifyToken, ProfileController.updateProfile);
router.delete('/:userId', verifyToken, ProfileController.deleteProfile);

module.exports = router;
