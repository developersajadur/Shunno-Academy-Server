import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import config from '../config';
import handleZodError from '../errors/handleZodError';
import { handlePrismaClientKnownRequestError, handlePrismaValidationError } from '../errors/handlePrismaError';
import AppError from '../errors/AppError';
import { TErrorSources } from '../interface/error';
import { errorLogger } from '../shared/logger';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Log the error with Winston
  errorLogger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
  });

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong!';
  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  let errorCode: string | undefined;
  let errorEmail: string | undefined;

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaClientKnownRequestError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handlePrismaValidationError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode;
    message = err.message;
    errorCode = (err as any).errorCode;
    errorEmail = (err as any).email;
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorCode && { errorCode }),
    ...(errorEmail && { email: errorEmail }),
    errorSources,
    stack: config.node_env === 'development' ? err?.stack : undefined,
  });
};

export default globalErrorHandler;
