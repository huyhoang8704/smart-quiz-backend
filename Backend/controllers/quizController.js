const Quiz = require("../models/Quiz");
const Material = require("../models/Material");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const path = require("path");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Thay đổi từ pro sang flash

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

// Helper function to generate quiz using text content (fallback approach)
async function generateQuizWithText({
  material,
  ownerId,
  materialId,
  title,
  numQuestions,
  difficulty,
}) {
  const systemPrompt = `
Bạn là trợ lý tạo đề trắc nghiệm. Tạo câu hỏi dựa vào thông tin tài liệu được cung cấp.
Chỉ tạo câu hỏi dựa vào nội dung đã cho; nếu thiếu dữ kiện, tạo câu hỏi tổng quát về chủ đề.
Không lộ đáp án trong phần câu hỏi. Trả về JSON đúng định dạng.`;

  const userPrompt = `
Tạo quiz với:
- Tài liệu: "${material.title}"
- Loại: ${material.type}
- Nội dung có sẵn: "${
    material.processedContent || "Không có nội dung được xử lý"
  }"
- Số câu hỏi: ${numQuestions}
- Độ khó: ${difficulty}

Yêu cầu:
- Mỗi câu hỏi "type":"mcq" có 3–4 "options" và một "answer" đúng.
- Có thể tạo câu hỏi "type":"truefalse" với options ["True", "False"].
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
    const result = await model.generateContent({
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

    const quizData = JSON.parse(result.response.text());

    // Ensure required fields are set
    quizData.ownerId = ownerId;
    quizData.materialId = materialId;

    return quizData;
  } catch (error) {
    console.error("Error generating quiz with text:", error);
    throw error;
  }
}

// Generate quiz từ học liệu using Gemini AI
const generateQuiz = async (req, res) => {
  try {
    const { materialId, options } = req.body;

    // Validate required fields
    if (!materialId) {
      return res.status(400).json({ error: "Material ID is required" });
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

    // Check if material has a file path and is PDF
    if (!material.filePath || material.type !== "pdf") {
      return res
        .status(400)
        .json({ error: "Material must be a PDF file with valid file path" });
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

    // Parse options with defaults
    const numQuestions = options?.numQuestions || 5;
    const difficulty = options?.difficulty || "medium";
    const title = options?.title || `Quiz for ${material.title}`;

    // Validate file exists
    const filePath = path.resolve(material.filePath);
    try {
      await fs.access(filePath);
    } catch (error) {
      return res
        .status(404)
        .json({ error: "Material file not found on server" });
    }

    // Try to generate quiz with Gemini AI (without file upload)
    try {
      // Use text-based approach instead of file upload for now
      const quizData = await generateQuizWithText({
        material,
        ownerId: req.user.id,
        materialId,
        title,
        numQuestions,
        difficulty,
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

        const mockQuestions = [
          {
            question: `Nội dung chính của tài liệu "${material.title}" là gì?`,
            type: "mcq",
            options: [
              "Khái niệm cơ bản",
              "Ví dụ thực tế",
              "Lý thuyết nâng cao",
              "Tất cả các ý trên",
            ],
            answer: "Tất cả các ý trên",
          },
          {
            question: `Tài liệu "${material.title}" có đề cập đến các khái niệm quan trọng?`,
            type: "truefalse",
            options: ["True", "False"],
            answer: "True",
          },
        ];

        const quiz = await Quiz.create({
          ownerId: req.user.id,
          materialId,
          title: title + " (Mock)",
          settings: {
            numQuestions: Math.min(numQuestions, mockQuestions.length),
            difficulty,
          },
          questions: mockQuestions.slice(0, numQuestions),
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

module.exports = {
  generateQuiz,
  createQuiz,
  getQuizById,
  getMyQuizzes,
  deleteQuiz,
};
