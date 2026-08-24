import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { AuthService } from './auth.service';

export class AuthController {
  static sendRegistrationOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, turnstileToken } = req.body;
    const result = await AuthService.sendRegistrationOtp(email, turnstileToken);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  });

  static verifyRegistrationOtp = catchAsync(async (req: Request, res: Response) => {
    const { email, otpCode } = req.body;
    const result = await AuthService.verifyRegistrationOtp(email, otpCode);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  });

  static register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'রেজিস্ট্রেশন সফল হয়েছে!',
      data: result,
    });
  });

  static login = catchAsync(async (req: Request, res: Response) => {
    const portal = (req.body.portal as any) || 'STUDENT_PORTAL';
    const result = await AuthService.login(req.body, portal);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Logged in successfully',
      data: result,
    });
  });

  static teacherLogin = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body, 'TEACHER_PORTAL');
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'শিক্ষক প্যানেলে সফলভাবে লগইন হয়েছে!',
      data: result,
    });
  });

  static adminLogin = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body, 'ADMIN_PORTAL');
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'অ্যাডমিন ড্যাশবোর্ডে সফলভাবে লগইন হয়েছে!',
      data: result,
    });
  });

  static forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.forgotPassword(req.body.email, req.body.turnstileToken);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  });

  static resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    const result = await AuthService.resetPassword(token, newPassword);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  });

  static sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
    const email = req.body.email || req.user?.email;
    const result = await AuthService.sendVerificationEmail(email);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  });

  static verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await AuthService.verifyEmail(token);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  });

  static refreshToken = catchAsync(async (req: Request, res: Response) => {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await AuthService.refreshToken(token);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Access token refreshed successfully',
      data: result,
    });
  });

  static getMe = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.getMe(req.user!.userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'User profile retrieved successfully',
      data: result,
    });
  });

  static updateProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.updateProfile(req.user!.userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Profile updated successfully',
      data: result,
    });
  });

  static changePassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.changePassword(req.user!.userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Password changed successfully',
      data: result,
    });
  });

  static googleLogin = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.googleLogin(req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'গুগল দিয়ে সফলভাবে লগইন হয়েছে!',
      data: result,
    });
  });
}
