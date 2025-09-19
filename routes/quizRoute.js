const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Quiz
 *   description: Quiz management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       required:
 *         - question
 *         - type
 *         - answer
 *       properties:
 *         question:
 *           type: string
 *           example: "Java là ngôn ngữ lập trình gì?"
 *         type:
 *           type: string
 *           enum: [mcq, truefalse, fillblank]
 *           example: "mcq"
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Hướng đối tượng", "Hướng thủ tục", "Hướng hàm"]
 *         answer:
 *           type: string
 *           example: "Hướng đối tượng"
 *
 *     Quiz:
 *       type: object
 *       required:
 *         - ownerId
 *         - title
 *         - questions
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the quiz
 *           example: "6501a9f5e4b0a2c8d4f4b123"
 *         ownerId:
 *           type: string
 *           description: ID của giáo viên tạo quiz
 *           example: "64fa0c1e23abc1234def5678"
 *         materialId:
 *           type: string
 *           description: ID học liệu tham chiếu (nếu có)
 *           example: "64fa0c1e23abc1234def5679"
 *         title:
 *           type: string
 *           example: "Quiz về OOP trong Java"
 *         settings:
 *           type: object
 *           properties:
 *             numQuestions:
 *               type: integer
 *               example: 5
 *             difficulty:
 *               type: string
 *               enum: [easy, medium, hard]
 *               example: "medium"
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Question'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-09-19T08:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-09-19T09:15:00.000Z"
 */

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Create a new quiz (manual)
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Quiz'
 *     responses:
 *       201:
 *         description: Quiz created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', auth, quizController.createQuiz);

/**
 * @swagger
 * /quizzes/{id}:
 *   get:
 *     summary: Get quiz by ID
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz details
 *       404:
 *         description: Quiz not found
 */
router.get('/:id', auth, quizController.getQuizById);

/**
 * @swagger
 * /quizzes:
 *   get:
 *     summary: Get quizzes created by the current teacher
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quizzes
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, quizController.getMyQuizzes);

/**
 * @swagger
 * /quizzes/{id}:
 *   delete:
 *     summary: Delete a quiz by ID
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 *       404:
 *         description: Quiz not found
 */
router.delete('/:id', auth, quizController.deleteQuiz);

// Generate quiz
router.post('/generate', auth, quizController.generateQuiz);

module.exports = router;
