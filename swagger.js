const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

require("dotenv").config();
const PORT = process.env.PORT || 4000;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Quiz API",
      version: "2.0.0",
      description: `
## Smart Quiz Backend API Documentation

### Overview
This API provides comprehensive quiz management functionality with AI-powered quiz generation using Google Gemini AI.

### Key Features
- **JWT-based Authentication** with role-based authorization (student, teacher, admin)
- **PDF Material Upload** with file storage and metadata management
- **AI-Powered Quiz Generation** using Google Gemini AI for intelligent question creation
- **Fallback System** with mock data when AI quota limits are reached
- **Comprehensive Error Handling** with detailed error messages and status codes

### Authentication Flow
1. Register as student: \`POST /api/auth/register/student\`
2. Login to get JWT token: \`POST /api/auth/login\`
3. Include token in Authorization header: \`Bearer <your-jwt-token>\`

### Quiz Generation Workflow
1. **Upload PDF Material**: \`POST /api/materials/upload\` (multipart/form-data)
2. **Generate AI Quiz**: \`POST /api/quizzes/generate\` with materialId
3. **Manual Quiz Creation**: \`POST /api/quizzes\` for custom quizzes

### AI Integration
- Uses Google Gemini AI (gemini-1.5-flash model) for intelligent quiz generation
- Text-based AI processing for better reliability and lower quota usage
- Automatic fallback to mock data when API limits are exceeded
- Supports multiple question types: MCQ, True/False, Fill-in-the-blank

### Error Handling
- **400**: Bad Request - Invalid input or missing required fields
- **401**: Unauthorized - Invalid or missing JWT token
- **403**: Forbidden - Insufficient permissions for the operation
- **404**: Not Found - Resource doesn't exist
- **429**: Too Many Requests - API quota exceeded, fallback used
- **500**: Internal Server Error - Server or AI processing error

### Rate Limits
- Google Gemini API has free tier limitations
- System automatically handles quota exceeded scenarios
- Consider upgrading to paid plan for higher limits

For more information, visit: [GitHub Repository](https://github.com/huyhoang8704/smart-quiz-backend)
      `,
      contact: {
        name: "API Support",
        url: "https://github.com/huyhoang8704/smart-quiz-backend/issues",
        email: "support@smartquiz.com",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
      {
        url: "https://api.smartquiz.com",
        description: "Production server (if available)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from login endpoint",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"], // paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = swaggerDocs;
