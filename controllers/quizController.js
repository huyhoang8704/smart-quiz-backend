const Quiz = require('../models/Quiz');
const Material = require('../models/Material');

// Generate quiz từ học liệu (mock)
const generateQuiz = async (req, res) => {
  try {
    const { materialId, options } = req.body;
    const material = await Material.findById(materialId);

    if (!material) return res.status(404).json({ message: 'Material not found' });

    // Mock dữ liệu quiz
    const questions = [
      {
        question: 'Nội dung chính của tài liệu là gì?',
        type: 'mcq',
        options: ['A', 'B', 'C', 'D'],
        answer: 'A'
      },
      {
        question: 'Tài liệu có đề cập đến chủ đề X? (Đúng/Sai)',
        type: 'truefalse',
        options: ['True', 'False'],
        answer: 'True'
      }
    ];

    const quiz = await Quiz.create({
      ownerId: req.user.id,
      materialId,
      title: `Quiz for ${material.title}`,
      settings: {
        numQuestions: options?.numQuestions || questions.length,
        difficulty: options?.difficulty || 'medium'
      },
      questions
    });

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo quiz thủ công
const createQuiz = async (req, res) => {
  try {
    const { title, materialId, settings, questions } = req.body;

    const quiz = await Quiz.create({
      ownerId: req.user.id,
      title,
      materialId,
      settings,
      questions
    });

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy quiz theo id
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('materialId');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách quiz theo giáo viên (ownerId)
const getMyQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ ownerId: req.user.id });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa quiz
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (quiz.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }

    await quiz.deleteOne();
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  generateQuiz,
  createQuiz,
  getQuizById,
  getMyQuizzes,
  deleteQuiz
};
