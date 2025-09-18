const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');


// Student register
router.post('/register/student', AuthController.registerStudent);


// Login chung (cho cả student/teacher nếu cần)
router.post('/login', AuthController.login);


// Lấy thông tin user hiện tại
router.get('/me', auth, AuthController.me);


module.exports = router;