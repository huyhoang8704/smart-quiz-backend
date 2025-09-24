/**
 * Smart Quiz API - Complete Usage Examples
 *
 * This file demonstrates the complete workflow for using the Smart Quiz API
 * with AI-powered quiz generation from PDF materials.
 */

// =================
// 1. AUTHENTICATION
// =================

// Register a new student
const registerStudentRequest = {
  method: "POST",
  url: "http://localhost:4000/api/auth/register/student",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Nguyen Van A",
    email: "student@example.com",
    password: "123456",
  }),
};

const registerStudentResponse = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: "64fa0c1e23abc1234def5678",
    name: "Nguyen Van A",
    email: "student@example.com",
    role: "student",
  },
};

// Login to get JWT token
const loginRequest = {
  method: "POST",
  url: "http://localhost:4000/api/auth/login",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "student@example.com",
    password: "123456",
  }),
};

// ======================
// 2. MATERIAL UPLOAD
// ======================

// Upload PDF Material (multipart/form-data)
const uploadMaterialRequest = {
  method: "POST",
  url: "http://localhost:4000/api/materials/upload",
  headers: {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    // Content-Type: multipart/form-data is set automatically
  },
  formData: {
    title: "Java OOP Tutorial - Chapter 1",
    pdfFile: "[PDF_FILE_BINARY_DATA]", // The actual PDF file
    processedContent: "This document covers basic OOP concepts...",
  },
};

// =========================
// 3. AI QUIZ GENERATION
// =========================

// Generate quiz from PDF material using AI
const generateQuizRequest = {
  method: "POST",
  url: "http://localhost:4000/api/quizzes/generate",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  body: JSON.stringify({
    materialId: "64fa0c1e23abc1234def5679",
    options: {
      title: "Quiz về OOP trong Java",
      numQuestions: 5,
      difficulty: "medium",
    },
  }),
};

// ==================
// 4. ERROR EXAMPLES
// ==================

const errorResponses = {
  quotaExceededError: {
    error:
      "API quota exceeded. Please try again later or upgrade your Gemini API plan.",
    details: "The free tier has limited requests per day.",
  },
  materialNotFoundError: {
    error: "Material not found",
  },
  invalidFileTypeError: {
    error: "Material must be a PDF file with valid file path",
  },
};

// =====================
// 5. CURL EXAMPLES
// =====================

const curlExamples = {
  uploadMaterial: `
curl -X POST http://localhost:4000/api/materials/upload \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "title=Java OOP Tutorial" \\
  -F "pdfFile=@/path/to/your/file.pdf"
  `,

  generateQuiz: `
curl -X POST http://localhost:4000/api/quizzes/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "materialId": "64fa0c1e23abc1234def5679",
    "options": {
      "title": "Quiz về OOP trong Java",
      "numQuestions": 5,
      "difficulty": "medium"
    }
  }'
  `,
};

module.exports = {
  registerStudentRequest,
  registerStudentResponse,
  loginRequest,
  uploadMaterialRequest,
  generateQuizRequest,
  errorResponses,
  curlExamples,
};
