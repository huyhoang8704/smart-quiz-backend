const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Material = require("../models/Material");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const path = require("path");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to get available model with fallback
async function getAvailableModel() {
  // Updated models based on debug response - these are actually available
  const models = [
    "gemini-2.5-pro-preview-03-25",
    "gemini-2.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "models/gemini-1.5-pro",
    "models/gemini-1.5-flash",
  ];

  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName}`);
      const testModel = genAI.getGenerativeModel({ model: modelName });

      // Test if model is available with a minimal request
      const testResult = await testModel.generateContent({
        contents: [{ role: "user", parts: [{ text: "test" }] }],
      });

      if (testResult && testResult.response) {
        console.log(`✅ Successfully using model: ${modelName}`);
        return testModel;
      }
    } catch (error) {
      console.log(
        `❌ Model ${modelName} not available: ${error.status || error.message}`
      );
      continue;
    }
  }

  // If all models fail, throw an error with useful information
  throw new Error(
    "No Gemini models are currently available. Please check your API key and try again later."
  );
}

// Helper function to generate quiz using text content with detailed settings
async function generateQuizWithText({
  material,
  materials,
  ownerId,
  materialId,
  materialIds,
  title,
  settings,
}) {
  // Support both single material and multiple materials
  const materialsList = materials || (material ? [material] : []);

  if (materialsList.length === 0) {
    throw new Error("No materials provided for quiz generation");
  }

  // Parse question configurations from settings
  const questionConfigs = settings.questionConfigs || [
    { type: "mcq", count: 3, difficulty: "medium" },
    { type: "truefalse", count: 2, difficulty: "medium" },
  ];

  const totalQuestions = questionConfigs.reduce(
    (sum, config) => sum + config.count,
    0
  );
  const focusAreas = settings.focusAreas || [];
  const customInstructions = settings.customInstructions || "";

  const systemPrompt = `
Bạn là trợ lý tạo đề trắc nghiệm chuyên nghiệp. Tạo câu hỏi dựa vào thông tin từ ${
    materialsList.length
  } tài liệu được cung cấp.
Tạo câu hỏi chất lượng cao, phù hợp với yêu cầu cụ thể của người dùng về từng loại câu hỏi.
${
  materialsList.length > 1
    ? "Kết hợp nội dung từ tất cả các tài liệu để tạo câu hỏi đa dạng và toàn diện."
    : ""
}
Không lộ đáp án trong phần câu hỏi. Trả về JSON đúng định dạng.`;

  // Build detailed question requirements
  const questionRequirements = questionConfigs
    .map((config) => {
      const typeText =
        {
          mcq: "trắc nghiệm nhiều lựa chọn",
          truefalse: "đúng/sai",
          fillblank: "điền chỗ trống",
        }[config.type] || config.type;

      const difficultyText =
        {
          easy: "dễ",
          medium: "trung bình",
          hard: "khó",
        }[config.difficulty] || config.difficulty;

      return `${config.count} câu ${typeText} mức độ ${difficultyText}`;
    })
    .join(", ");

  const focusAreasText =
    focusAreas.length > 0 ? `\n- Tập trung vào: ${focusAreas.join(", ")}` : "";

  const customInstructionsText = customInstructions
    ? `\n- Hướng dẫn thêm: ${customInstructions}`
    : "";

  const customTitleText = settings.customTitle
    ? `
- Tiêu đề yêu cầu: "${settings.customTitle}"`
    : "";

  // Build materials content text
  const materialsContent = materialsList
    .map((mat, index) => {
      const prefix =
        materialsList.length > 1
          ? `\n\n=== TÀI LIỆU ${index + 1}: "${mat.title}" ===`
          : "";
      return `${prefix}
- Loại: ${mat.type}
- Nội dung: "${mat.processedContent || "Không có nội dung được xử lý"}"`;
    })
    .join("\n");

  const userPrompt = `
Tạo quiz từ ${materialsList.length} tài liệu sau:
${materialsContent}

- Tổng số câu hỏi: ${totalQuestions}
- Cấu hình chi tiết: ${questionRequirements}${focusAreasText}${customInstructionsText}${customTitleText}

Yêu cầu chi tiết:
${
  materialsList.length > 1
    ? "- Kết hợp kiến thức từ TẤT CẢ các tài liệu để tạo câu hỏi đa dạng và toàn diện\n- Có thể tạo câu hỏi so sánh hoặc tổng hợp kiến thức từ nhiều tài liệu\n"
    : ""
}
- Tạo chính xác số lượng câu hỏi theo từng loại đã chỉ định
- Đảm bảo mức độ khó phù hợp cho từng loại câu hỏi:
  + MCQ (trắc nghiệm): tạo 3-4 lựa chọn hợp lý, 1 đáp án chính xác
  + True/False (đúng/sai): tạo câu hỏi rõ ràng với options ["True", "False"]
  + Fill-blank (điền chỗ trống): tạo câu có chỗ trống cần điền, không có options
- Mức độ khó:
  + Dễ: câu hỏi đơn giản, kiến thức cơ bản
  + Trung bình: yêu cầu hiểu biết và áp dụng
  + Khó: phân tích, tổng hợp, đánh giá cao
- Câu hỏi phải dựa trên nội dung tài liệu
- Nếu có "Tiêu đề yêu cầu", sử dụng chính xác tiêu đề đó, nếu không thì tự tạo tiêu đề phù hợp
- Trả về JSON với cấu trúc: {title, settings: {totalQuestions, questionConfigs}, questions: [{question, type, options, answer, difficulty}]}
`;

  const responseSchema = {
    type: "object",
    properties: {
      title: { type: "string" },
      settings: {
        type: "object",
        properties: {
          totalQuestions: { type: "integer" },
          questionConfigs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["mcq", "truefalse", "fillblank"],
                },
                count: { type: "integer" },
                difficulty: {
                  type: "string",
                  enum: ["easy", "medium", "hard"],
                },
              },
              required: ["type", "count", "difficulty"],
            },
          },
        },
        required: ["totalQuestions", "questionConfigs"],
      },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            type: { type: "string", enum: ["mcq", "truefalse", "fillblank"] },
            options: { type: "array", items: { type: "string" } },
            answer: { type: "string" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          },
          required: ["question", "type", "answer", "difficulty"],
        },
      },
    },
    required: ["title", "settings", "questions"],
  };

  try {
    // Get available model dynamically
    const availableModel = await getAvailableModel();

    const result = await availableModel.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    const responseText = result.response.text();
    console.log("AI Response:", responseText);

    const quizData = JSON.parse(responseText);

    // Ensure required fields are set
    quizData.ownerId = ownerId;
    quizData.materialId = materialId; // For backward compatibility
    quizData.materialIds = materialIds; // Store all material IDs if multiple

    // Override title with customTitle if provided
    if (settings.customTitle) {
      quizData.title = settings.customTitle;
    }

    // Update settings with correct structure
    quizData.settings = {
      totalQuestions: totalQuestions,
      questionConfigs: questionConfigs,
      focusAreas: focusAreas,
      customInstructions: customInstructions,
      materialsCount: materialsList.length, // Add count of materials used
    };
    return quizData;
  } catch (error) {
    console.error("Error generating quiz with text:", error);

    // Handle specific API errors
    if (error.status === 404) {
      throw new Error(
        `Gemini model not found. This might be due to API version changes. Error: ${error.message}`
      );
    } else if (error.status === 403) {
      throw new Error(
        `Access denied to Gemini API. Please check your API key permissions.`
      );
    } else if (error.status === 429) {
      throw new Error(`Gemini API quota exceeded. Please try again later.`);
    }

    throw error;
  }
}
// Generate quiz from material using Gemini AI with detailed settings
const generateQuiz = async (req, res) => {
  try {
    const { materialIds, settings } = req.body;

    // Support both single materialId and multiple materialIds
    let materialIdsList = [];
    if (materialIds && Array.isArray(materialIds)) {
      materialIdsList = materialIds;
    }

    // Validate required fields
    if (!materialIdsList || materialIdsList.length === 0) {
      return res.status(400).json({
        error: "At least one material ID is required",
        hint: "Use 'materialId' for single material or 'materialIds' array for multiple materials",
      });
    }

    // Validate material limits
    if (materialIdsList.length > 5) {
      return res.status(400).json({
        error: "Maximum 5 materials allowed per quiz generation",
        provided: materialIdsList.length,
      });
    }

    if (!settings || !settings.questionConfigs) {
      return res.status(400).json({
        error: "Settings with questionConfigs is required",
        example: {
          questionConfigs: [
            { type: "mcq", count: 5, difficulty: "medium" },
            { type: "truefalse", count: 3, difficulty: "easy" },
          ],
        },
      });
    }

    // Validate question configurations
    const validTypes = ["mcq", "truefalse", "fillblank"];
    const validDifficulties = ["easy", "medium", "hard"];

    for (const config of settings.questionConfigs) {
      if (!validTypes.includes(config.type)) {
        return res.status(400).json({
          error: `Invalid question type: ${
            config.type
          }. Valid types: ${validTypes.join(", ")}`,
        });
      }
      if (!validDifficulties.includes(config.difficulty)) {
        return res.status(400).json({
          error: `Invalid difficulty: ${
            config.difficulty
          }. Valid difficulties: ${validDifficulties.join(", ")}`,
        });
      }
      if (!config.count || config.count < 1 || config.count > 20) {
        return res.status(400).json({
          error: `Invalid count for ${config.type}: ${config.count}. Must be between 1 and 20`,
        });
      }
    }

    // Debug: Check if API key exists
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    // Fetch all materials
    const materials = await Material.find({ _id: { $in: materialIdsList } });

    if (materials.length === 0) {
      return res.status(404).json({ error: "No materials found" });
    }

    if (materials.length !== materialIdsList.length) {
      return res.status(404).json({
        error: "Some materials not found",
        requested: materialIdsList.length,
        found: materials.length,
      });
    }

    // Check file size limit (50MB total)
    let totalSize = 0;
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB in bytes

    for (const material of materials) {
      // Check if user owns the material or has permission
      if (
        material.ownerId.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          error: `Not authorized to use material: ${material.title}`,
          materialId: material._id,
        });
      }

      // Estimate file size (this is approximate, you may need actual file size from storage)
      // For now, we'll use processedContent length as proxy
      if (material.processedContent) {
        totalSize += material.processedContent.length;
      }
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return res.status(400).json({
        error: "Total materials size exceeds 50MB limit",
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
        limit: "50MB",
      });
    }

    // Combine material titles for quiz title
    const materialTitles = materials.map((m) => m.title).join(", ");
    const title = settings.customTitle || `Quiz from: ${materialTitles}`;

    console.log("Question configurations:", settings.questionConfigs);
    console.log("Focus areas:", settings.focusAreas);
    console.log("Number of materials:", materials.length);

    // Try to generate quiz with Gemini AI using detailed settings
    try {
      const quizData = await generateQuizWithText({
        materials, // Pass array of materials instead of single material
        ownerId: req.user.id,
        materialIds: materialIdsList,
        title,
        settings,
      });

      // Create quiz in database
      const quiz = await Quiz.create({
        ownerId: req.user.id,
        materialId: materialIdsList[0], // Primary material ID for backward compatibility
        materialIds: materialIdsList, // Store all material IDs
        title: quizData.title,
        settings: quizData.settings,
        questions: quizData.questions,
      });

      res.status(201).json(quiz);
    } catch (geminiError) {
      // If Gemini fails due to quota, use fallback mock data
      if (
        geminiError.message.includes("quota") ||
        geminiError.message.includes("429")
      ) {
        console.log("Gemini quota exceeded, using fallback mock data");

        const mockQuestions = [];
        let questionIndex = 1;

        // Generate questions based on each configuration
        for (const config of settings.questionConfigs) {
          for (let i = 0; i < Math.min(config.count, 3); i++) {
            // Limit to 3 per type for mock
            const difficultyPrefix =
              {
                easy: "Câu dễ",
                medium: "Câu trung bình",
                hard: "Câu khó",
              }[config.difficulty] || "Câu";

            if (config.type === "mcq") {
              mockQuestions.push({
                question: `${difficultyPrefix} ${questionIndex}: Nội dung chính của tài liệu "${material.title}" thuộc chủ đề nào?`,
                type: "mcq",
                options: [
                  "Khái niệm cơ bản và lý thuyết",
                  "Ví dụ thực tế và ứng dụng",
                  "Phương pháp và kỹ thuật",
                  "Tất cả các ý trên",
                ],
                answer: "Tất cả các ý trên",
                difficulty: config.difficulty,
              });
            } else if (config.type === "truefalse") {
              mockQuestions.push({
                question: `${difficultyPrefix} ${questionIndex}: Tài liệu "${material.title}" cung cấp thông tin hữu ích cho người học`,
                type: "truefalse",
                options: ["True", "False"],
                answer: "True",
                difficulty: config.difficulty,
              });
            } else if (config.type === "fillblank") {
              mockQuestions.push({
                question: `${difficultyPrefix} ${questionIndex}: Tài liệu "${material.title}" tập trung vào chủ đề _____`,
                type: "fillblank",
                options: [],
                answer: "học tập",
                difficulty: config.difficulty,
              });
            }
            questionIndex++;
          }
        }

        const quiz = await Quiz.create({
          ownerId: req.user.id,
          materialId,
          title: title + " (Mock)",
          settings: {
            totalQuestions: mockQuestions.length,
            questionConfigs: settings.questionConfigs.map((config) => ({
              ...config,
              count: Math.min(config.count, 3), // Actual count in mock data
            })),
            focusAreas: settings.focusAreas || [],
            note: "Generated using fallback data due to API quota limits",
          },
          questions: mockQuestions,
        });

        return res.status(201).json({
          ...quiz.toObject(),
          warning: "Generated using fallback data due to API quota limits",
        });
      }

      throw geminiError; // Re-throw other errors
    }
  } catch (error) {
    console.error("Error generating quiz:", error);

    // Handle specific Gemini API errors
    if (error.message.includes("quota") || error.message.includes("429")) {
      return res.status(429).json({
        error:
          "API quota exceeded. Please try again later or upgrade your Gemini API plan.",
        details:
          "The free tier has limited requests per day. Please wait or consider upgrading.",
      });
    }

    if (error.message.includes("401") || error.message.includes("API key")) {
      return res.status(401).json({
        error: "Invalid Gemini API key. Please check your configuration.",
      });
    }

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
      questions,
    });

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy quiz theo id
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("materialId");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
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
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.ownerId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this quiz" });
    }

    await quiz.deleteOne();
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sinh viên làm quiz
const attemptQuiz = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const answers = req.body.answers;
    const timeSpent = req.body.timeSpent;
    const timeConfig = req.body.timeConfig || 0;
    const studentId = req.user.id;

    if (typeof timeSpent !== "number") {
      return res.status(400).json({
        message: "timeSpent phải là số (giây).",
      });
    }
    if (!answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ message: "Danh sách câu trả lời không hợp lệ." });
    }

    if (!quizId) {
      return res.status(400).json({ message: "Quiz ID không được để trống." });
    }

    // 1️⃣ Lấy quiz từ DB
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Không tìm thấy quiz." });
    }

    let correctCount = 0;
    const resultDetails = [];

    // 2️⃣ Duyệt qua từng câu hỏi và chấm điểm
    quiz.questions.forEach((question) => {
      const userAnswer = answers.find(
        (a) => a.questionId === question._id.toString()
      );

      if (!userAnswer) {
        resultDetails.push({
          questionId: question._id,
          question: question.question,
          correctAnswer: question.answer,
          userAnswer: null,
          isCorrect: false,
        });
        return;
      }

      const correctAns = question.answer.trim().toLowerCase();
      const userAns = userAnswer.answer.trim().toLowerCase();

      let isCorrect = userAns === correctAns;

      if (isCorrect) correctCount++;

      resultDetails.push({
        questionId: question._id,
        question: question.question,
        correctAnswer: question.answer,
        userAnswer: userAnswer.answer,
        isCorrect,
      });
    });

    const totalQuestions = quiz.questions.length;
    const score = (correctCount / totalQuestions) * 100;

    // 3️⃣ Tạo bản ghi lịch sử làm bài
    const attempt = await QuizAttempt.create({
      quizId,
      studentId,
      score: Number(score.toFixed(2)),
      totalQuestions,
      correctAnswers: correctCount,
      details: resultDetails,
      timeSpent,
      timeConfig,
    });

    // 4️⃣ Trả về kết quả cho client
    res.status(201).json({
      message: "Làm quiz thành công!",
      quizId,
      quizTitle: quiz.title,
      studentId,
      totalQuestions,
      correctCount,
      score: Number(score.toFixed(2)),
      details: resultDetails,
      attemptId: attempt._id,
      createdAt: attempt.createdAt,
      timeSpent,
      timeConfig,
    });
  } catch (error) {
    console.error("❌ Lỗi khi chấm quiz:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi chấm quiz.", error: error.message });
  }
};

module.exports = {
  generateQuiz,
  createQuiz,
  getQuizById,
  getMyQuizzes,
  deleteQuiz,
  attemptQuiz,
};
