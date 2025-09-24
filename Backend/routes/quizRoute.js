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
router.get("/:id", auth, quizController.getQuizById);

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
router.get("/", auth, quizController.getMyQuizzes);

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
router.delete("/:id", auth, quizController.deleteQuiz);

/**
 * @swagger
 * /api/quizzes/generate:
 *   post:
 *     summary: Generate quiz from material using Google Gemini AI
 *     description: |
 *       Generate an intelligent quiz from uploaded PDF material using Google Gemini AI.
 *       The system uses text-based AI generation for better reliability and performance.
 *       If AI generation fails due to quota limits, the system automatically falls back to mock data.
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
 *             properties:
 *               materialId:
 *                 type: string
 *                 description: ID of the PDF material to generate quiz from (must be type 'pdf')
 *                 example: "64fa0c1e23abc1234def5679"
 *               options:
 *                 type: object
 *                 description: Optional quiz generation settings
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: Custom title for the quiz (defaults to "Quiz for {material.title}")
 *                     example: "Quiz về OOP trong Java"
 *                   numQuestions:
 *                     type: integer
 *                     description: Number of questions to generate
 *                     example: 5
 *                     minimum: 1
 *                     maximum: 20
 *                     default: 5
 *                   difficulty:
 *                     type: string
 *                     enum: [easy, medium, hard]
 *                     description: Difficulty level of questions
 *                     example: "medium"
 *                     default: "medium"
 *     responses:
 *       201:
 *         description: Quiz generated successfully using AI
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 *             example:
 *               _id: "64fa0c1e23abc1234def5680"
 *               ownerId: "64fa0c1e23abc1234def5678"
 *               materialId: "64fa0c1e23abc1234def5679"
 *               title: "Quiz về OOP trong Java"
 *               settings:
 *                 numQuestions: 5
 *                 difficulty: "medium"
 *               questions:
 *                 - question: "Inheritance trong Java là gì?"
 *                   type: "mcq"
 *                   options: ["Khả năng kế thừa", "Tạo object", "Ẩn giấu dữ liệu", "Đa hình"]
 *                   answer: "Khả năng kế thừa"
 *                 - question: "Encapsulation giúp bảo vệ dữ liệu"
 *                   type: "truefalse"
 *                   options: ["True", "False"]
 *                   answer: "True"
 *               createdAt: "2023-09-08T10:30:00.000Z"
 *               updatedAt: "2023-09-08T10:30:00.000Z"
 *               warning: "Generated using fallback data due to API quota limits"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missingMaterialId:
 *                 value:
 *                   error: "Material ID is required"
 *               notPdf:
 *                 value:
 *                   error: "Material must be a PDF file with valid file path"
 *       401:
 *         description: Unauthorized - invalid or missing JWT token
 *       403:
 *         description: Forbidden - not authorized to use this material
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
 *         description: Material not found or file not found on server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               materialNotFound:
 *                 value:
 *                   error: "Material not found"
 *               fileNotFound:
 *                 value:
 *                   error: "Material file not found on server"
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

module.exports = router;
