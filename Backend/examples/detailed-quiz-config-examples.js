/**
 * Detailed Quiz Configuration Examples
 *
 * This file demonstrates how to use the new detailed quiz generation API
 * with specific question type configurations, counts, and difficulty levels.
 */

const BASE_URL = "http://localhost:4000";

// Example tokens (replace with actual tokens)
let teacherToken = "your_teacher_jwt_token";
let materialId = "your_material_id";

// === DETAILED CONFIGURATION EXAMPLES ===

// 1. Basic Single Type Configuration
async function generateBasicQuiz() {
  try {
    const response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            {
              type: "mcq",
              count: 10,
              difficulty: "medium",
            },
          ],
          customTitle: "Quiz Cơ bản về Machine Learning",
        },
      }),
    });

    const quiz = await response.json();
    console.log("Basic Quiz Generated:", JSON.stringify(quiz, null, 2));
    return quiz;
  } catch (error) {
    console.error("Error generating basic quiz:", error);
  }
}

// 2. Mixed Question Types with Different Difficulties
async function generateMixedDifficultyQuiz() {
  try {
    const response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            {
              type: "mcq",
              count: 8,
              difficulty: "hard",
            },
            {
              type: "truefalse",
              count: 4,
              difficulty: "medium",
            },
            {
              type: "fillblank",
              count: 3,
              difficulty: "easy",
            },
          ],
          customTitle: "Quiz Comprehensive về AI",
          focusAreas: ["machine learning", "deep learning", "neural networks"],
          customInstructions: "Tập trung vào ứng dụng thực tế và case studies",
        },
      }),
    });

    const quiz = await response.json();
    console.log(
      "Mixed Difficulty Quiz Generated:",
      JSON.stringify(quiz, null, 2)
    );
    return quiz;
  } catch (error) {
    console.error("Error generating mixed difficulty quiz:", error);
  }
}

// 3. Advanced Configuration for Final Exam
async function generateAdvancedExamQuiz() {
  try {
    const response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            {
              type: "mcq",
              count: 15,
              difficulty: "hard",
            },
            {
              type: "truefalse",
              count: 10,
              difficulty: "hard",
            },
            {
              type: "fillblank",
              count: 5,
              difficulty: "medium",
            },
          ],
          customTitle: "Đề thi cuối kỳ - Advanced Topics",
          focusAreas: [
            "lý thuyết nâng cao",
            "phân tích case study",
            "so sánh thuật toán",
            "đánh giá hiệu quả",
          ],
          customInstructions:
            "Câu hỏi yêu cầu khả năng phân tích, tổng hợp và đánh giá cao. Tập trung vào tư duy phản biện và ứng dụng thực tế.",
        },
      }),
    });

    const quiz = await response.json();
    console.log("Advanced Exam Quiz Generated:", JSON.stringify(quiz, null, 2));
    return quiz;
  } catch (error) {
    console.error("Error generating advanced exam quiz:", error);
  }
}

// 4. Beginner-Friendly Quiz
async function generateBeginnerQuiz() {
  try {
    const response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            {
              type: "mcq",
              count: 5,
              difficulty: "easy",
            },
            {
              type: "truefalse",
              count: 5,
              difficulty: "easy",
            },
          ],
          customTitle: "Quiz Nhập môn - Khái niệm Cơ bản",
          focusAreas: ["định nghĩa", "khái niệm cơ bản", "ví dụ đơn giản"],
          customInstructions:
            "Sử dụng ngôn ngữ đơn giản, tập trung vào việc ghi nhớ và hiểu biết cơ bản",
        },
      }),
    });

    const quiz = await response.json();
    console.log("Beginner Quiz Generated:", JSON.stringify(quiz, null, 2));
    return quiz;
  } catch (error) {
    console.error("Error generating beginner quiz:", error);
  }
}

// 5. Specialized Fill-in-the-Blank Quiz
async function generateFillBlankQuiz() {
  try {
    const response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            {
              type: "fillblank",
              count: 15,
              difficulty: "medium",
            },
          ],
          customTitle: "Bài tập Điền từ - Thuật ngữ Chuyên môn",
          focusAreas: ["thuật ngữ", "công thức", "định nghĩa chính xác"],
          customInstructions:
            "Tạo câu hỏi điền chỗ trống cho các thuật ngữ quan trọng, công thức và định nghĩa chính xác",
        },
      }),
    });

    const quiz = await response.json();
    console.log(
      "Fill-in-the-Blank Quiz Generated:",
      JSON.stringify(quiz, null, 2)
    );
    return quiz;
  } catch (error) {
    console.error("Error generating fill-blank quiz:", error);
  }
}

// 6. True/False Focus Quiz
async function generateTrueFalseQuiz() {
  try {
    const response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            {
              type: "truefalse",
              count: 20,
              difficulty: "medium",
            },
          ],
          customTitle: "Kiểm tra Nhanh - Đúng/Sai",
          focusAreas: ["facts", "statements", "claims", "assertions"],
          customInstructions:
            "Tạo câu hỏi đúng/sai rõ ràng, tránh câu hỏi gây nhầm lẫn hoặc có nhiều cách hiểu",
        },
      }),
    });

    const quiz = await response.json();
    console.log("True/False Quiz Generated:", JSON.stringify(quiz, null, 2));
    return quiz;
  } catch (error) {
    console.error("Error generating true/false quiz:", error);
  }
}

// === CONFIGURATION EXAMPLES BY DIFFICULTY ===

// 7. Progressive Difficulty Quiz
async function generateProgressiveDifficultyQuiz() {
  try {
    const response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            // Start easy
            {
              type: "mcq",
              count: 3,
              difficulty: "easy",
            },
            {
              type: "truefalse",
              count: 3,
              difficulty: "easy",
            },
            // Move to medium
            {
              type: "mcq",
              count: 4,
              difficulty: "medium",
            },
            {
              type: "fillblank",
              count: 3,
              difficulty: "medium",
            },
            // End with hard
            {
              type: "mcq",
              count: 3,
              difficulty: "hard",
            },
            {
              type: "fillblank",
              count: 2,
              difficulty: "hard",
            },
          ],
          customTitle: "Quiz Tăng dần Độ khó - Từ Cơ bản đến Nâng cao",
          focusAreas: [
            "progression",
            "building knowledge",
            "comprehensive understanding",
          ],
          customInstructions:
            "Sắp xếp câu hỏi theo thứ tự tăng dần độ khó, giúp học sinh làm quen dần với nội dung",
        },
      }),
    });

    const quiz = await response.json();
    console.log(
      "Progressive Difficulty Quiz Generated:",
      JSON.stringify(quiz, null, 2)
    );
    return quiz;
  } catch (error) {
    console.error("Error generating progressive difficulty quiz:", error);
  }
}

// === VALIDATION EXAMPLES ===

// 8. Test Invalid Configuration (for error handling)
async function testInvalidConfiguration() {
  try {
    // Test missing settings
    let response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        // Missing settings
      }),
    });

    let result = await response.json();
    console.log("Missing settings response:", result);

    // Test invalid question type
    response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            {
              type: "invalid_type", // Invalid type
              count: 5,
              difficulty: "medium",
            },
          ],
        },
      }),
    });

    result = await response.json();
    console.log("Invalid type response:", result);

    // Test invalid count
    response = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        materialId: materialId,
        settings: {
          questionConfigs: [
            {
              type: "mcq",
              count: 25, // Too high
              difficulty: "medium",
            },
          ],
        },
      }),
    });

    result = await response.json();
    console.log("Invalid count response:", result);
  } catch (error) {
    console.error("Error testing invalid configurations:", error);
  }
}

// === WORKFLOW EXAMPLES ===

// 9. Complete Quiz Generation Workflow
async function completeQuizGenerationWorkflow() {
  console.log("=== Starting Complete Quiz Generation Workflow ===\n");

  console.log("1. Generating Basic Quiz...");
  await generateBasicQuiz();

  console.log("\n2. Generating Mixed Difficulty Quiz...");
  await generateMixedDifficultyQuiz();

  console.log("\n3. Generating Advanced Exam Quiz...");
  await generateAdvancedExamQuiz();

  console.log("\n4. Generating Beginner Quiz...");
  await generateBeginnerQuiz();

  console.log("\n5. Generating Fill-in-the-Blank Quiz...");
  await generateFillBlankQuiz();

  console.log("\n6. Generating True/False Quiz...");
  await generateTrueFalseQuiz();

  console.log("\n7. Generating Progressive Difficulty Quiz...");
  await generateProgressiveDifficultyQuiz();

  console.log("\n8. Testing Invalid Configurations...");
  await testInvalidConfiguration();

  console.log("\n=== Workflow Complete ===");
}

// === CONFIGURATION TEMPLATES ===

const QUIZ_TEMPLATES = {
  // Template cho quiz cơ bản
  BASIC_MCQ: {
    questionConfigs: [{ type: "mcq", count: 10, difficulty: "medium" }],
    customTitle: "Quiz Cơ bản",
  },

  // Template cho kiểm tra nhanh
  QUICK_CHECK: {
    questionConfigs: [{ type: "truefalse", count: 10, difficulty: "easy" }],
    customTitle: "Kiểm tra Nhanh",
  },

  // Template cho đề thi giữa kỳ
  MIDTERM_EXAM: {
    questionConfigs: [
      { type: "mcq", count: 15, difficulty: "medium" },
      { type: "truefalse", count: 10, difficulty: "medium" },
      { type: "fillblank", count: 5, difficulty: "hard" },
    ],
    customTitle: "Đề thi Giữa kỳ",
  },

  // Template cho đề thi cuối kỳ
  FINAL_EXAM: {
    questionConfigs: [
      { type: "mcq", count: 20, difficulty: "hard" },
      { type: "truefalse", count: 15, difficulty: "hard" },
      { type: "fillblank", count: 10, difficulty: "hard" },
    ],
    customTitle: "Đề thi Cuối kỳ",
    focusAreas: ["comprehensive", "advanced", "analysis"],
    customInstructions:
      "Đề thi toàn diện, yêu cầu tư duy phản biện và ứng dụng cao",
  },

  // Template cho luyện tập
  PRACTICE_SET: {
    questionConfigs: [
      { type: "mcq", count: 5, difficulty: "easy" },
      { type: "mcq", count: 5, difficulty: "medium" },
      { type: "truefalse", count: 5, difficulty: "easy" },
      { type: "fillblank", count: 3, difficulty: "medium" },
    ],
    customTitle: "Bài tập Luyện tập",
  },
};

// Export for Node.js environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    generateBasicQuiz,
    generateMixedDifficultyQuiz,
    generateAdvancedExamQuiz,
    generateBeginnerQuiz,
    generateFillBlankQuiz,
    generateTrueFalseQuiz,
    generateProgressiveDifficultyQuiz,
    testInvalidConfiguration,
    completeQuizGenerationWorkflow,
    QUIZ_TEMPLATES,
  };
}

// Auto-run workflow if this file is executed directly
if (typeof window === "undefined" && require.main === module) {
  completeQuizGenerationWorkflow().catch(console.error);
}
