const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const auth = require("../middleware/authMiddleware");

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
 *           description: The question text
 *           example: "Java là ngôn ngữ lập trình gì?"
 *         type:
 *           type: string
 *           enum: [mcq, truefalse, fillblank]
 *           description: |
 *             Type of question:
 *             - mcq: Multiple choice question (requires options array)
 *             - truefalse: True/False question (options: ["True", "False"])
 *             - fillblank: Fill in the blank question
 *           example: "mcq"
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             Answer options for the question:
 *             - For mcq: Array of 3-5 possible answers
 *             - For truefalse: ["True", "False"]
 *             - For fillblank: Can be omitted or empty
 *           example: ["Ngôn ngữ hướng đối tượng", "Ngôn ngữ thủ tục", "Ngôn ngữ assembly", "Ngôn ngữ script"]
 *         answer:
 *           type: string
 *           description: The correct answer (must match one of the options for mcq/truefalse)
 *           example: "Ngôn ngữ hướng đối tượng"
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
router.post("/", auth, quizController.createQuiz);

/**
 * @swagger
 * /api/quizzes/{id}:
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
router.get("/:id", auth, quizController.getQuizById);

/**
 * @swagger
 * /api/quizzes:
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
router.get("/", auth, quizController.getMyQuizzes);

/**
 * @swagger
 * /api/quizzes/{id}:
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
router.delete("/:id", auth, quizController.deleteQuiz);

/**
 * @swagger
 * /api/quizzes/generate:
 *   post:
 *     summary: Generate quiz with detailed question type configurations
 *     description: |
 *       Generate intelligent quizzes from uploaded materials using Google Gemini AI.
 *
 *       ## Key Features:
 *       - **Detailed Configuration**: Specify exact count and difficulty for each question type
 *       - **Mixed Question Types**: Combine MCQ, True/False, and Fill-in-the-blank in one quiz
 *       - **Individual Difficulty**: Set different difficulty levels for different question types
 *       - **Focus Areas**: Target specific topics within the material
 *       - **Smart Fallback**: Automatic fallback when AI quota is exceeded
 *
 *       ## Question Types:
 *       - **MCQ (Multiple Choice)**: 3-4 options with one correct answer
 *       - **True/False**: Binary choice questions
 *       - **Fill-blank**: Questions with missing words to complete
 *
 *       ## Difficulty Levels:
 *       - **Easy**: Basic concepts and definitions
 *       - **Medium**: Application and understanding
 *       - **Hard**: Analysis, synthesis, and evaluation
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - materialId
 *               - settings
 *             properties:
 *               materialId:
 *                 type: string
 *                 description: ID of the material to generate quiz from
 *                 example: "64fa0c1e23abc1234def5679"
 *               settings:
 *                 type: object
 *                 required:
 *                   - questionConfigs
 *                 properties:
 *                   questionConfigs:
 *                     type: array
 *                     description: Detailed configuration for each question type
 *                     items:
 *                       type: object
 *                       required:
 *                         - type
 *                         - count
 *                         - difficulty
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [mcq, truefalse, fillblank]
 *                           description: Type of question
 *                         count:
 *                           type: integer
 *                           minimum: 1
 *                           maximum: 20
 *                           description: Number of questions of this type
 *                         difficulty:
 *                           type: string
 *                           enum: [easy, medium, hard]
 *                           description: Difficulty level for this question type
 *                     example:
 *                       - type: "mcq"
 *                         count: 5
 *                         difficulty: "hard"
 *                       - type: "truefalse"
 *                         count: 3
 *                         difficulty: "medium"
 *                       - type: "fillblank"
 *                         count: 2
 *                         difficulty: "easy"
 *                   customTitle:
 *                     type: string
 *                     description: Custom title for the quiz
 *                     example: "Quiz nâng cao về Machine Learning"
 *                   focusAreas:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Specific topics to focus on
 *                     example: ["khái niệm cơ bản", "ví dụ thực tế", "ứng dụng"]
 *                   customInstructions:
 *                     type: string
 *                     description: Additional instructions for question generation
 *                     example: "Tập trung vào so sánh các thuật toán"
 *           examples:
 *             mixedDifficulty:
 *               summary: Mixed Question Types with Different Difficulties
 *               value:
 *                 materialId: "64fa0c1e23abc1234def5679"
 *                 settings:
 *                   questionConfigs:
 *                     - type: "mcq"
 *                       count: 8
 *                       difficulty: "hard"
 *                     - type: "truefalse"
 *                       count: 4
 *                       difficulty: "medium"
 *                     - type: "fillblank"
 *                       count: 3
 *                       difficulty: "easy"
 *                   customTitle: "Quiz Comprehensive về AI"
 *                   focusAreas: ["machine learning", "deep learning", "neural networks"]
 *                   customInstructions: "Tập trung vào ứng dụng thực tế"
 *             basicConfiguration:
 *               summary: Basic Configuration
 *               value:
 *                 materialId: "64fa0c1e23abc1234def5679"
 *                 settings:
 *                   questionConfigs:
 *                     - type: "mcq"
 *                       count: 10
 *                       difficulty: "medium"
 *             advancedConfiguration:
 *               summary: Advanced Multi-Type Configuration
 *               value:
 *                 materialId: "64fa0c1e23abc1234def5679"
 *                 settings:
 *                   questionConfigs:
 *                     - type: "mcq"
 *                       count: 6
 *                       difficulty: "hard"
 *                     - type: "truefalse"
 *                       count: 6
 *                       difficulty: "hard"
 *                     - type: "fillblank"
 *                       count: 3
 *                       difficulty: "medium"
 *                   customTitle: "Đề thi cuối kỳ - Advanced Topics"
 *                   focusAreas: ["lý thuyết nâng cao", "phân tích case study"]
 *     responses:
 *       201:
 *         description: Quiz generated successfully with detailed configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 *             example:
 *               _id: "64fa0c1e23abc1234def5680"
 *               ownerId: "64fa0c1e23abc1234def5678"
 *               materialId: "64fa0c1e23abc1234def5679"
 *               title: "Quiz Comprehensive về AI"
 *               settings:
 *                 totalQuestions: 15
 *                 questionConfigs:
 *                   - type: "mcq"
 *                     count: 8
 *                     difficulty: "hard"
 *                   - type: "truefalse"
 *                     count: 4
 *                     difficulty: "medium"
 *                   - type: "fillblank"
 *                     count: 3
 *                     difficulty: "easy"
 *                 focusAreas: ["machine learning", "deep learning"]
 *                 customInstructions: "Tập trung vào ứng dụng thực tế"
 *               questions:
 *                 - question: "Machine Learning thuộc lĩnh vực nào của AI?"
 *                   type: "mcq"
 *                   options: ["Computer Vision", "Natural Language Processing", "Data Science", "Tất cả các lĩnh vực trên"]
 *                   answer: "Tất cả các lĩnh vực trên"
 *                   difficulty: "hard"
 *                 - question: "Neural Networks được sử dụng trong Deep Learning"
 *                   type: "truefalse"
 *                   options: ["True", "False"]
 *                   answer: "True"
 *                   difficulty: "medium"
 *                 - question: "Thuật toán _____ được sử dụng để tối ưu hóa neural networks"
 *                   type: "fillblank"
 *                   options: []
 *                   answer: "backpropagation"
 *                   difficulty: "easy"
 *               createdAt: "2023-09-08T10:30:00.000Z"
 *               updatedAt: "2023-09-08T10:30:00.000Z"
 *       400:
 *         description: Bad request - Invalid configuration or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 example:
 *                   type: object
 *             examples:
 *               missingMaterialId:
 *                 value:
 *                   error: "Material ID is required"
 *               missingSettings:
 *                 value:
 *                   error: "Settings with questionConfigs is required"
 *                   example:
 *                     questionConfigs:
 *                       - type: "mcq"
 *                         count: 5
 *                         difficulty: "medium"
 *               invalidQuestionType:
 *                 value:
 *                   error: "Invalid question type: invalid_type. Valid types: mcq, truefalse, fillblank"
 *               invalidDifficulty:
 *                 value:
 *                   error: "Invalid difficulty: invalid_diff. Valid difficulties: easy, medium, hard"
 *               invalidCount:
 *                 value:
 *                   error: "Invalid count for mcq: 25. Must be between 1 and 20"
 *       401:
 *         description: Unauthorized - Invalid or expired token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: "Not authorized to use this material"
 *       404:
 *         description: Material not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: "Material not found"
 *       429:
 *         description: API quota exceeded - using fallback data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *               example:
 *                 error: "API quota exceeded. Please try again later or upgrade your Gemini API plan."
 *                 details: "The free tier has limited requests per day. Please wait or consider upgrading."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               noApiKey:
 *                 value:
 *                   error: "Gemini API key not configured"
 *               serverError:
 *                 value:
 *                   error: "Internal server error"
 */
router.post("/generate", auth, quizController.generateQuiz);

/**
 * @swagger
 * /api/quizzes/{id}/attempt:
 *   post:
 *     summary: Attempt a quiz
 *     description: Student submits answers and gets score
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         example: "68cd3bbbc2675789057fe3f2"
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *                 example:
 *                   - questionId: "68cd3bbbc2675789057fe3f3"
 *                     answer: "Ngôn ngữ lập trình"
 *                   - questionId: "68cd3bbbc2675789057fe3f4"
 *                     answer: "False"
 *                   - questionId: "68cd3bbbc2675789057fe3f5"
 *                     answer: "HTTP"
 *
 *     responses:
 *       200:
 *         description: Quiz result
 *       404:
 *         description: Quiz not found
 */
router.post("/:id/attempt", auth, quizController.attemptQuiz);

/**
 * @swagger
 * /api/quizzes/debug/models:
 *   get:
 *     summary: Debug endpoint to check available Gemini models
 *     tags: [Quiz]
 *     responses:
 *       200:
 *         description: List of available models and their status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 availableModels:
 *                   type: array
 *                   items:
 *                     type: string
 *                 testedModel:
 *                   type: string
 *                 testResult:
 *                   type: object
 */
router.get("/debug/models", quizController.debugModels);

module.exports = router;
