const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.post('/registration/send-code', AuthController.sendVerificationCode);
router.post('/registration/verify-code', AuthController.verifyRegistrationCode);
router.post('/code/send', AuthController.sendVerificationCode);
router.post('/code/verify', AuthController.verifyRegistrationCode);
router.post('/login/request-password-reset', AuthController.requestPasswordReset);
router.post('/login/verify-reset-code', AuthController.verifyResetCode);
router.post('/login/reset-password', AuthController.resetPassword);

// router.post('/code/send', AuthController.sendVerificationCode); // Было /registration/send-code
// router.post('/code/verify', AuthController.verifyRegistrationCode); // Было /registration/verify-codeм

module.exports = router;
