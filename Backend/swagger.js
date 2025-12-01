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
        url: process.env.BASE_URL || `http://localhost:${PORT}`,
        description: "Auto server (dev/prod)",
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
