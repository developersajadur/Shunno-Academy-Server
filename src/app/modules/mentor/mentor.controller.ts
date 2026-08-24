import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { MentorService } from './mentor.service';

export class MentorController {
  static getAll = catchAsync(async (_req: Request, res: Response) => {
    const result = await MentorService.getAll();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Mentors retrieved successfully',
      data: result,
    });
  });

  static getById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await MentorService.getById(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Mentor profile retrieved successfully',
      data: result,
    });
  });

  static create = catchAsync(async (req: Request, res: Response) => {
    const result = await MentorService.create(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Mentor profile created successfully',
      data: result,
    });
  });

  static update = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await MentorService.update(id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Mentor profile updated successfully',
      data: result,
    });
  });

  static delete = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await MentorService.delete(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Mentor profile deleted successfully',
      data: result,
    });
  });
}

