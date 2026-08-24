import { Prisma } from '@prisma/client';
import { TErrorSources, TGenericErrorResponse } from '../interface/error';
import httpStatus from 'http-status';

export const handlePrismaClientKnownRequestError = (
  error: Prisma.PrismaClientKnownRequestError
): TGenericErrorResponse => {
  let statusCode: number = httpStatus.BAD_REQUEST;
  let message = 'Database Error';
  let errorSources: TErrorSources = [
    {
      path: '',
      message: error.message,
    },
  ];

  if (error.code === 'P2002') {
    statusCode = httpStatus.CONFLICT;
    const target = (error.meta?.target as string[]) || [];
    message = `Duplicate entry for field: ${target.join(', ')}`;
    errorSources = [
      {
        path: target.join(', '),
        message: `${target.join(', ')} already exists.`,
      },
    ];
  } else if (error.code === 'P2025') {
    statusCode = httpStatus.NOT_FOUND;
    message = (error.meta?.cause as string) || 'Record not found';
    errorSources = [
      {
        path: '',
        message,
      },
    ];
  } else if (error.code === 'P2003') {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Foreign key constraint violation';
    errorSources = [
      {
        path: (error.meta?.field_name as string) || '',
        message: 'Related record was not found or cannot be deleted.',
      },
    ];
  }

  return {
    statusCode,
    message,
    errorSources,
  };
};

export const handlePrismaValidationError = (
  error: Prisma.PrismaClientValidationError
): TGenericErrorResponse => {
  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: 'Prisma Validation Error',
    errorSources: [
      {
        path: '',
        message: error.message,
      },
    ],
  };
};

