import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';


// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'User Management API',
    version: '1.0.0',
    description: 'API for managing users with soft delete functionality',
    license: {
      name: 'Licensed Under MIT',
      url: 'https://spdx.org/licenses/MIT.html',
    },
  },
  servers: [
    {
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer {token}'
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  // Import swaggerDefinitions
  swaggerDefinition,
  // Path to the API docs
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options as any);

const swaggerDocs = (app, port) => {
  // Route for swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
  }));

  // Setup Swagger UI
   app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
    explorer: true,
    }));

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`\nSwagger docs available at http://localhost:${port}/api-docs`);
  
};

export default swaggerDocs; 