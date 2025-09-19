const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/authMiddleware');

// Generate quiz tự động từ học liệu
// router.post('/generate', auth, quizController.generateQuiz);

// Tạo quiz thủ công
router.post('/', auth, quizController.createQuiz);

// Lấy quiz theo id
router.get('/:id', auth, quizController.getQuizById);

// Lấy danh sách quiz theo giáo viên (ownerId)
router.get('/', auth, quizController.getMyQuizzes);

// Xóa quiz
router.delete('/:id', auth, quizController.deleteQuiz);

module.exports = router;
