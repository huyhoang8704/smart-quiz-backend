const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

require('dotenv').config();
const PORT = process.env.PORT || 4000;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Quiz API',
      version: '2.0.0',
      description: 'Smart Quiz Backend API with AI-powered quiz generation using Google Gemini AI. Supports JWT authentication, PDF material upload, and intelligent quiz creation with fallback system.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/huyhoang8704/smart-quiz-backend/issues'
      },
      license: {
        name: 'ISC'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints'
      },
      {
        name: 'Materials',
        description: 'PDF material upload and management'
      },
      {
        name: 'Quiz',
        description: 'Quiz creation and AI-powered generation'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from login endpoint'
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      docExpansion: 'none',
      defaultModelsExpandDepth: -1
    }
  }));
}

module.exports = swaggerDocs;