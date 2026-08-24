import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { InquiryService } from './inquiry.service';

export class InquiryController {
  static createInquiry = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await InquiryService.createInquiry(userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Inquiry submitted successfully. Our team will contact you shortly.',
      data: result,
    });
  });

  static getAllInquiriesAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await InquiryService.getAllInquiriesAdmin(req.query as any);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Inquiries fetched successfully',
      meta: result.meta,
      data: result.data,
    });
  });

  static updateInquiryStatus = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await InquiryService.updateInquiryStatus(id, req.body.status);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Inquiry status updated successfully',
      data: result,
    });
  });

  static deleteInquiry = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await InquiryService.deleteInquiry(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Inquiry deleted successfully',
      data: result,
    });
  });
}

