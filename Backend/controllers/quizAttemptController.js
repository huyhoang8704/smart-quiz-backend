const QuizAttempt = require("../models/QuizAttempt");
const Quiz = require("../models/Quiz");

// Lấy tất cả attempt theo quizId
const getAttemptsByQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quiz tồn tại không
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const attempts = await QuizAttempt.find({ quizId: id })
      .populate("studentId", "username email") // lấy thông tin học sinh
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy chi tiết attempt theo attemptId
const getAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findById(attemptId)
      .populate("studentId", "username email")
      .populate("quizId", "title");

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAttemptsByQuiz,
  getAttemptById,
};
