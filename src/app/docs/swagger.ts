import swaggerJsdoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import config from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shunno Academy API Documentation',
      version: '1.0.0',
      description:
        'Official REST API documentation for Shunno Academy (শূন্য একাডেমি) - Bangladesh Premier Online Skill & Tech Learning Platform.',
      contact: {
        name: 'Shunno Academy Tech Team',
        email: 'nfoshunnoacademy@gmail.com',
        url: 'https://shunnoacademy.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development Local Server (API v1)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token in the format: Bearer <token>',
        },
      },
      schemas: {
        StandardSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 50 },
                totalPage: { type: 'number', example: 5 },
              },
            },
          },
        },
        StandardErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation Error / Unauthorized' },
            errorSources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email address' },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Student & Admin Authentication, Tokens, and Profile Management' },
      { name: 'Courses', description: 'Course Catalog, Curriculum, Filtering, and Management' },
      { name: 'Categories', description: 'Course Categories' },
      { name: 'Mentors', description: 'Mentor Profiles and Instructor Showcase' },
      { name: 'Reviews', description: 'Student Testimonials & Reviews Approval Workflow' },
      { name: 'Enrollments', description: 'Course Registration, Batch Selection, and Status Updates' },
      { name: 'Payments', description: 'Manual Payment Verification (bKash, Nagad, Rocket, Upay, Bank, TrxID)' },
      { name: 'Inquiries', description: 'Contact Forms & Counseling Requests' },
      { name: 'Stats', description: 'Platform Milestones & Statistical Overview' },
      { name: 'Upload', description: 'Cloudinary Image & Document Storage Service' },
    ],
  },
  apis: ['./src/app/modules/**/*.route.ts', './src/app/modules/**/*.swagger.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
  if (config.node_env === 'production') {
    // In production, Swagger API documentation is completely disabled for security
    return;
  }

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Shunno Academy API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default setupSwagger;

