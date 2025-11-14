const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    details: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz.questions' },
        question: String,
        correctAnswer: String,
        userAnswer: String,
        isCorrect: Boolean,
      },
    ],
    timeSpent: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema, 'quiz_attempts');
