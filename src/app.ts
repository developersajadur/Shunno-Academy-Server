import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import config from './app/config';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorhandler';
import notFound from './app/middlewares/notFound';
import setupSwagger from './app/docs/swagger';
import httpLogger from './app/middlewares/httpLogger';

const app: Application = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI to load scripts properly
  })
);

// Compression & Structured HTTP Request Logging
app.use(compression());
app.use(httpLogger);

// Body Parsers & Cookie
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS Setup
app.use(
  cors({
    origin: [config.client_url, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Setup Swagger Interactive API Documentation
setupSwagger(app);

// Health Check & Root Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '🚀 Shunno Academy REST API is running smoothly.',
    ...(config.node_env !== 'production' && { documentation: '/api/docs' }),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.node_env,
  });
});

// Application Routes
app.use('/api/v1', router);

// Error Handling Middlewares
app.use(globalErrorHandler);
app.use(notFound);

export default app;
