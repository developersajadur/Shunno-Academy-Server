import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { UserService } from './user.service';

export class UserController {
  static getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      ...req.query,
      isBlocked: req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined,
    };
    const result = await UserService.getAllUsers(filters as any);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Users fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  });

  static getUserById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await UserService.getUserById(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User profile fetched successfully',
      data: result,
    });
  });

  static toggleBlockStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { isBlocked } = req.body;
    const result = await UserService.toggleBlockStatus(id, Boolean(isBlocked));
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: result,
    });
  });
}

