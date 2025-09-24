const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'truefalse', 'fillblank'], default: 'mcq' },
  options: [{ type: String }], // chỉ dùng cho mcq
  answer: { type: String, required: true }
});

const quizSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: false,
    },
    title: { type: String, required: true },
    settings: {
      numQuestions: { type: Number, default: 5 },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
    },
    questions: [questionSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema, 'quizzes');
