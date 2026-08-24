import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { StatService } from './stat.service';

export class StatController {
  static getPlatformStats = catchAsync(async (_req: Request, res: Response) => {
    const result = await StatService.getPlatformStats();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Platform statistics retrieved successfully',
      data: result,
    });
  });

  static getAdminAnalytics = catchAsync(async (req: Request, res: Response) => {
    const timeRange = (req.query.timeRange as string) || '30d';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const result = await StatService.getAdminDashboardAnalytics(timeRange, startDate, endDate);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin dashboard analytics retrieved successfully',
      data: result,
    });
  });
}
