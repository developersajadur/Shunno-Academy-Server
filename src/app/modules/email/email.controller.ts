import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { EmailBroadcastService } from './email.service';

export class EmailController {
  static sendBroadcast = catchAsync(async (req: Request, res: Response) => {
    const result = await EmailBroadcastService.sendBroadcast(req.user!.userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  });

  static sendTestEmail = catchAsync(async (req: Request, res: Response) => {
    const result = await EmailBroadcastService.sendTestEmail(req.user!.email, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  });

  static getCampaignHistory = catchAsync(async (req: Request, res: Response) => {
    const result = await EmailBroadcastService.getCampaignHistory();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'ইমেইল ক্যাম্পেইন হিস্ট্রি সফলভাবে লোড হয়েছে',
      data: result,
    });
  });

  static getEmailStats = catchAsync(async (req: Request, res: Response) => {
    const result = await EmailBroadcastService.getEmailStats();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'ইমেইল পরিসংখ্যান সফলভাবে লোড হয়েছে',
      data: result,
    });
  });
}

