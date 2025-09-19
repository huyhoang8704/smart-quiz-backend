const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware').authorize;


// Student register
router.post('/register/student', AuthController.registerStudent);

// Teacher register
router.post('/register/teacher', auth, authorize('admin'), AuthController.registerTeacher);

// Admin register
router.post('/register/admin', auth, authorize('admin'), AuthController.registerAdmin);

// Login chung (cho cả student/teacher nếu cần)
router.post('/login', AuthController.login);


// Lấy thông tin user hiện tại
router.get('/me', auth, AuthController.me);


module.exports = router;