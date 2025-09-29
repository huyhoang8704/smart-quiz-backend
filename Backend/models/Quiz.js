const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: ["mcq", "truefalse", "fillblank"],
    default: "mcq",
  },
  options: [{ type: String }], // chỉ dùng cho mcq
  answer: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  }, // Add difficulty per question
});

const questionConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["mcq", "truefalse", "fillblank"],
    required: true,
  },
  count: { type: Number, required: true, min: 1, max: 20 },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
  },
});

const quizSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: false,
    },
    title: { type: String, required: true },
    settings: {
      // Legacy fields for backward compatibility
      numQuestions: { type: Number, default: 5 },
      difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium",
      },

      // New detailed configuration fields
      totalQuestions: { type: Number },
      questionConfigs: [questionConfigSchema],
      focusAreas: [{ type: String }],
      customInstructions: { type: String },
      note: { type: String }, // For system messages like fallback info
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema, "quizzes");
