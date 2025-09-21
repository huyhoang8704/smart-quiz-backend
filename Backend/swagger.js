const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

require('dotenv').config();
const PORT = process.env.PORT || 4000;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Quiz API',
      version: '1.0.0',
      description: 'API documentation for Smart Quiz application',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // đường dẫn tới route files để đọc JSDoc
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = swaggerDocs;
