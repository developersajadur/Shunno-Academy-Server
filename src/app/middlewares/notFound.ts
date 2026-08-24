import { Request, Response } from 'express';
import httpStatus from 'http-status';

export const notFound = (req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: `API Route Not Found: [${req.method}] ${req.originalUrl}`,
    errorSources: [
      {
        path: req.originalUrl,
        message: 'Endpoint does not exist',
      },
    ],
  });
};

export default notFound;
