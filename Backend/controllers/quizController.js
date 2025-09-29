const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Material = require("../models/Material");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const path = require("path");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to upload PDF to Gemini File API
async function uploadPdfToGemini(filePath) {
  try {
    console.log("Uploading PDF:", filePath);

    // Check if file exists and get stats
    const stats = await fs.stat(filePath);
    console.log("File size:", stats.size, "bytes");

    const bytes = await fs.readFile(filePath);
    const fileName = path.basename(filePath);

    // First, start the upload session
    const startResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Protocol": "resumable",
          "X-Goog-Upload-Command": "start",
          "X-Goog-Upload-Header-Content-Length": stats.size.toString(),
          "X-Goog-Upload-Header-Content-Type": "application/pdf",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: {
            display_name: fileName,
          },
        }),
      }
    );

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(
        `Failed to start upload: ${startResponse.status} ${errorText}`
      );
    }

    const uploadUrl = startResponse.headers.get("X-Goog-Upload-URL");
    console.log("Upload URL:", uploadUrl);

    // Then upload the actual file
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Length": stats.size.toString(),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      body: bytes,
    });

    console.log("Upload response status:", uploadResponse.status);
    const responseText = await uploadResponse.text();
    console.log("Upload response:", responseText);

    if (!uploadResponse.ok) {
      throw new Error(
        `Failed to upload PDF: ${uploadResponse.status} ${responseText}`
      );
    }

    const file = JSON.parse(responseText);
    console.log("Uploaded file info:", file);

    // Wait for file to be processed if needed
    if (file.state === "PROCESSING") {
      console.log("File is processing, waiting...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

    return file.name; // returns fileId like "files/abc123"
  } catch (error) {
    console.error("Error uploading PDF to Gemini:", error);
    throw error;
  }
}

// Helper function to generate quiz using Gemini AI
async function generateQuizWithGemini({
  pdfFileId,
  ownerId,
  materialId,
  title,
  numQuestions,
  difficulty,
}) {
  const systemPrompt = `
Bạn là trợ lý tạo đề trắc nghiệm. Đọc tài liệu đính kèm (PDF).
Chỉ tạo câu hỏi dựa vào nội dung tài liệu; nếu thiếu dữ kiện, bỏ qua.
Không lộ đáp án trong phần câu hỏi. Không thêm chú thích ngoài JSON.`;

  const userPrompt = `
Tạo quiz với:
- title: "${title}"
- settings.numQuestions = ${numQuestions}
- settings.difficulty = "${difficulty}"
- Chỉ dùng kiến thức trong tài liệu.

Yêu cầu:
- Mỗi câu hỏi "type":"mcq" có 3–5 "options" và một "answer" đúng đúng y như tài liệu.
- Có thể tạo câu hỏi "type":"truefalse" với options ["True", "False"].
- Nếu không đủ chất liệu cho số câu, giảm số lượng nhưng vẫn trả JSON hợp lệ.
- Trả về JSON với cấu trúc: {title, settings: {numQuestions, difficulty}, questions: [{question, type, options, answer}]}
`;

  const responseSchema = {
    type: "object",
    properties: {
      title: { type: "string" },
      settings: {
        type: "object",
        properties: {
          numQuestions: { type: "integer" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
        required: ["numQuestions", "difficulty"],
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
          },
          required: ["question", "type", "answer"],
        },
      },
    },
    required: ["title", "settings", "questions"],
  };

  try {
    const model = await getAvailableModel();

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "user",
          parts: [
            { fileData: { fileUri: pdfFileId, mimeType: "application/pdf" } },
            { text: userPrompt },
          ],
        },
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

    const quizData = JSON.parse(result.response.text());

    // Ensure required fields are set
    quizData.ownerId = ownerId;
    quizData.materialId = materialId;

    return quizData;
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error);
    throw error;
  }
}

// Helper function to parse natural language configuration
function parseNaturalLanguageConfig(naturalConfig) {
  const config = {
    numQuestions: 5,
    difficulty: "medium",
    questionTypes: ["mcq", "truefalse"],
    focusAreas: [],
    specificRequirements: [],
  };

  if (!naturalConfig) return config;

  const text = naturalConfig.toLowerCase();

  // Parse number of questions
  const numMatch = text.match(/(\d+)\s*(câu|question)/i);
  if (numMatch) {
    config.numQuestions = parseInt(numMatch[1]);
  }

  // Parse difficulty
  if (text.includes("dễ") || text.includes("easy")) config.difficulty = "easy";
  if (
    text.includes("khó") ||
    text.includes("hard") ||
    text.includes("nâng cao")
  )
    config.difficulty = "hard";
  if (
    text.includes("trung bình") ||
    text.includes("medium") ||
    text.includes("vừa")
  )
    config.difficulty = "medium";

  // Parse question types
  const types = [];
  if (
    text.includes("trắc nghiệm") ||
    text.includes("multiple choice") ||
    text.includes("mcq")
  )
    types.push("mcq");
  if (
    text.includes("đúng sai") ||
    text.includes("true false") ||
    text.includes("truefalse")
  )
    types.push("truefalse");
  if (
    text.includes("điền chỗ trống") ||
    text.includes("fill") ||
    text.includes("blank")
  )
    types.push("fillblank");
  if (types.length > 0) config.questionTypes = types;

  // Parse focus areas
  const focusKeywords = [
    "khái niệm",
    "định nghĩa",
    "lý thuyết",
    "ví dụ",
    "ứng dụng",
    "thực hành",
    "so sánh",
    "phân tích",
    "tổng hợp",
    "đánh giá",
  ];
  focusKeywords.forEach((keyword) => {
    if (text.includes(keyword)) config.focusAreas.push(keyword);
  });

  // Parse specific requirements
  if (text.includes("tập trung vào") || text.includes("chú trọng")) {
    const focusMatch = text.match(/(?:tập trung vào|chú trọng)\s*([^.,;]+)/i);
    if (focusMatch) config.specificRequirements.push(focusMatch[1].trim());
  }

  return config;
}

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
  ownerId,
  materialId,
  title,
  settings,
}) {
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
Bạn là trợ lý tạo đề trắc nghiệm chuyên nghiệp. Tạo câu hỏi dựa vào thông tin tài liệu được cung cấp.
Tạo câu hỏi chất lượng cao, phù hợp với yêu cầu cụ thể của người dùng về từng loại câu hỏi.
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

  const userPrompt = `
Tạo quiz với:
- Tài liệu: "${material.title}"
- Loại: ${material.type}
- Nội dung có sẵn: "${
    material.processedContent || "Không có nội dung được xử lý"
  }"
- Tổng số câu hỏi: ${totalQuestions}
- Cấu hình chi tiết: ${questionRequirements}${focusAreasText}${customInstructionsText}

Yêu cầu chi tiết:
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
    quizData.materialId = materialId;

    // Update settings with correct structure
    quizData.settings = {
      totalQuestions: totalQuestions,
      questionConfigs: questionConfigs,
      focusAreas: focusAreas,
      customInstructions: customInstructions,
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
    const { materialId, settings } = req.body;

    // Validate required fields
    if (!materialId) {
      return res.status(400).json({ error: "Material ID is required" });
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

    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    // Check if user owns the material or has permission
    if (
      material.ownerId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to use this material" });
    }

    const title = settings.customTitle || `Quiz for ${material.title}`;

    console.log("Question configurations:", settings.questionConfigs);
    console.log("Focus areas:", settings.focusAreas);

    // Try to generate quiz with Gemini AI using detailed settings
    try {
      const quizData = await generateQuizWithText({
        material,
        ownerId: req.user.id,
        materialId,
        title,
        settings,
      });

      // Create quiz in database
      const quiz = await Quiz.create({
        ownerId: req.user.id,
        materialId,
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
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let correctCount = 0;
    const details = quiz.questions.map((q) => {
      const userAnswerObj = answers.find(
        (a) => a.questionId === q._id.toString()
      );
      const userAnswer = userAnswerObj ? userAnswerObj.answer : null;
      const isCorrect =
        userAnswer &&
        userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();

      if (isCorrect) correctCount++;

      return {
        questionId: q._id,
        question: q.question,
        correctAnswer: q.answer,
        userAnswer,
        isCorrect,
      };
    });

    const attempt = new QuizAttempt({
      quizId: quiz._id,
      studentId: req.user.id, // lấy từ token
      score: correctCount,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      details,
    });

    await attempt.save();

    res.json({
      quizId: quiz._id,
      score: correctCount,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      details,
      attemptId: attempt._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Debug endpoint to check available models
const debugModels = async (req, res) => {
  try {
    const {
      listAvailableModels,
      getBestAvailableModel,
      testModel,
    } = require("../utils/geminiUtils");

    console.log("Starting model debug check...");

    // List all available models
    const availableModels = await listAvailableModels();
    console.log("Available models:", availableModels);

    // Get best available model
    const bestModel = await getBestAvailableModel();
    console.log("Best available model:", bestModel);

    // Test the best model
    let testResult = null;
    if (bestModel) {
      testResult = await testModel(bestModel);
      console.log("Test result:", testResult);
    }

    res.json({
      success: true,
      availableModels,
      bestModel,
      testResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug models error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
};

module.exports = {
  generateQuiz,
  createQuiz,
  getQuizById,
  getMyQuizzes,
  deleteQuiz,
  attemptQuiz,
  debugModels,
};
