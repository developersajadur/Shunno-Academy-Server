import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { UserRole } from '@prisma/client';
import AppError from '../errors/AppError';
import catchAsync from '../helpers/catchAsync';
import { verifyToken } from '../utils/jwt';
import config from '../config';
import prisma from '../helpers/prisma';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized to access this route!');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token, config.jwt.access_secret) as AuthenticatedUser;
    } catch {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired authentication token!');
    }

    const { userId, role } = decoded;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User account no longer exists!');
    }

    if (user.isBlocked) {
      throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended! Please contact support.');
    }

    // Single Concurrent Session / Single Device Enforcement (Applies to regular users/students, NOT Admin)
    if (
      user.role !== UserRole.ADMIN &&
      decoded.sessionId &&
      user.currentSessionId &&
      decoded.sessionId !== user.currentSessionId
    ) {
      const err = new AppError(
        httpStatus.UNAUTHORIZED,
        'আপনার অ্যাকাউন্টটি অন্য একটি ডিভাইস থেকে লগইন করা হয়েছে। নিরাপত্তা নিশ্চিত করতে এই ডিভাইস থেকে লগআউট করা হলো।'
      ) as any;
      err.errorCode = 'SESSION_SUPERSEDED';
      throw err;
    }

    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new AppError(httpStatus.FORBIDDEN, 'You do not have permission to perform this action!');
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: user.currentSessionId || undefined,
    };

    next();
  });
};

export const optionalAuth = () => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyToken(token, config.jwt.access_secret) as AuthenticatedUser;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });
        if (user && !user.isBlocked) {
          req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
          };
        }
      } catch {
        // ignore invalid/expired token for optional auth
      }
    }
    next();
  });
};

export default auth;
