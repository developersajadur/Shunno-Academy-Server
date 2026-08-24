import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import storageService from '../../services/storage';
import AppError from '../../errors/AppError';

export class UploadController {
  static uploadSingle = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Please attach a file to upload!');
    }

    const folder = (req.body.folder as string) || undefined;
    const result = await storageService.upload(req.file, folder);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'File uploaded successfully',
      data: result,
    });
  });

  static deleteFile = catchAsync(async (req: Request, res: Response) => {
    const { publicId } = req.body;
    if (!publicId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'publicId is required to delete a file');
    }

    const success = await storageService.delete(publicId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success,
      message: success ? 'File deleted successfully' : 'File deletion failed',
      data: { success },
    });
  });
}

