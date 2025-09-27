const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const quizAttemptController = require("../controllers/quizAttemptController");

/**
 * @swagger
 * /api/quizzes/{id}/attempts:
 *   get:
 *     summary: Get all attempts of a quiz
 *     description: Teacher can view all attempts of a quiz by students
 *     tags: [QuizAttempt]
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
 *         description: List of quiz attempts
 *       404:
 *         description: Quiz not found
 */
router.get("/quizzes/:id/attempts", auth, quizAttemptController.getAttemptsByQuiz);

/**
 * @swagger
 * /api/attempts/{attemptId}:
 *   get:
 *     summary: Get attempt details
 *     description: View details of a specific attempt
 *     tags: [QuizAttempt]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attempt ID
 *     responses:
 *       200:
 *         description: Attempt details
 *       404:
 *         description: Attempt not found
 */
router.get("/attempts/:attemptId", auth, quizAttemptController.getAttemptById);

module.exports = router;
