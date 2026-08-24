import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { TokenType, User, UserRole } from '@prisma/client';
import prisma from '../../helpers/prisma';
import AppError from '../../errors/AppError';
import { createToken, verifyToken } from '../../utils/jwt';
import config from '../../config';
import { addEmailJob } from '../../queue/email.queue';
import { verifyTurnstileToken } from '../../utils/turnstile';

interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  district?: string;
  occupation?: string;
  turnstileToken?: string;
}

interface LoginPayload {
  email: string;
  password: string;
  turnstileToken?: string;
}

export class AuthService {
  static async register(payload: RegisterPayload) {
    if (payload.turnstileToken) {
      await verifyTurnstileToken(payload.turnstileToken);
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new AppError(httpStatus.CONFLICT, 'An account with this email already exists!');
    }

    if (payload.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: payload.phone.trim() },
      });
      if (existingPhone) {
        throw new AppError(httpStatus.CONFLICT, 'An account with this phone number already exists!');
      }
    }

    const hashedPassword = await bcrypt.hash(payload.password, config.salt_rounds);

    const newUser = await prisma.user.create({
      data: {
        name: payload.name.trim(),
        email: payload.email.toLowerCase().trim(),
        phone: payload.phone?.trim(),
        password: hashedPassword,
        role: UserRole.STUDENT,
        district: payload.district,
        occupation: payload.occupation,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        district: true,
        occupation: true,
        createdAt: true,
      },
    });

    const currentSessionId = crypto.randomUUID();
    const jwtPayload = { userId: newUser.id, email: newUser.email, role: newUser.role, sessionId: currentSessionId };
    const accessToken = createToken(jwtPayload, config.jwt.access_secret, config.jwt.access_expires_in);
    const refreshToken = createToken(jwtPayload, config.jwt.refresh_secret, config.jwt.refresh_expires_in);

    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken, currentSessionId },
    });

    // Generate Verification Token & 6-digit OTP
    const verifyTokenStr = crypto.randomBytes(32).toString('hex');
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailToken.create({
      data: {
        email: newUser.email,
        token: verifyTokenStr,
        otpCode,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    const verifyUrl = `${config.client_url}/verify-email?token=${verifyTokenStr}`;

    // Asynchronously dispatch verification email via BullMQ
    addEmailJob({
      to: newUser.email,
      subject: 'আপনার ইমেইল ভেরিফাই করুন - Shunno Academy',
      template: 'EMAIL_VERIFICATION',
      context: {
        name: newUser.name,
        verifyUrl,
        otpCode,
      },
    }).catch(() => {});

    return {
      user: newUser,
      accessToken,
      refreshToken,
    };
  }

  static async login(payload: LoginPayload & { requiredRole?: UserRole }) {
    if (payload.turnstileToken) {
      await verifyTurnstileToken(payload.turnstileToken);
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase().trim() },
    });
    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password!');
    }

    if (user.isBlocked) {
      throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended! Please contact support.');
    }

    if (payload.requiredRole && user.role !== payload.requiredRole && user.role !== UserRole.ADMIN) {
      throw new AppError(httpStatus.FORBIDDEN, 'Access denied! Insufficient privileges.');
    }

    const isPasswordMatched = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordMatched) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password!');
    }

    // Block login for unverified accounts — return a machine-readable errorCode
    // so the client can show a targeted "verify your email" prompt
    if (!user.isEmailVerified) {
      const err = new AppError(
        httpStatus.FORBIDDEN,
        'Your email address is not verified. Please check your inbox and verify before logging in.',
      ) as any;
      err.errorCode = 'EMAIL_NOT_VERIFIED';
      err.email = user.email;
      throw err;
    }

    const currentSessionId = crypto.randomUUID();
    const jwtPayload = { userId: user.id, email: user.email, role: user.role, sessionId: currentSessionId };
    const accessToken = createToken(jwtPayload, config.jwt.access_secret, config.jwt.access_expires_in);
    const refreshToken = createToken(jwtPayload, config.jwt.refresh_secret, config.jwt.refresh_expires_in);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, currentSessionId },
    });

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      district: user.district,
      occupation: user.occupation,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }

  static async forgotPassword(email: string, turnstileToken?: string) {
    if (turnstileToken) {
      await verifyTurnstileToken(turnstileToken);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // To prevent email enumeration, return gracefully even if user not found
    if (!user) {
      return { success: true, message: 'If an account exists with this email, a reset link has been dispatched.' };
    }

    // Invalidate prior active reset tokens for this email
    await prisma.emailToken.deleteMany({
      where: {
        email: user.email,
        type: TokenType.PASSWORD_RESET,
      },
    });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await prisma.emailToken.create({
      data: {
        email: user.email,
        token: resetToken,
        type: TokenType.PASSWORD_RESET,
        expiresAt,
      },
    });

    const resetUrl = `${config.client_url}/reset-password?token=${resetToken}`;

    // Queue email via BullMQ
    addEmailJob({
      to: user.email,
      subject: 'পাসওয়ার্ড রিসেট নির্দেশিকা - Shunno Academy',
      template: 'PASSWORD_RESET',
      context: {
        name: user.name,
        resetUrl,
      },
    }).catch(() => {});

    return { success: true, message: 'Password reset link sent to your email successfully.' };
  }

  static async resetPassword(token: string, newPassword: string) {
    const emailToken = await prisma.emailToken.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_RESET,
      },
    });

    if (!emailToken) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired password reset link!');
    }

    if (new Date() > emailToken.expiresAt) {
      await prisma.emailToken.delete({ where: { id: emailToken.id } });
      throw new AppError(httpStatus.BAD_REQUEST, 'Password reset link has expired! Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.salt_rounds);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: emailToken.email },
        data: {
          password: hashedPassword,
          refreshToken: null, // Revoke active sessions for security
        },
      }),
      prisma.emailToken.delete({
        where: { id: emailToken.id },
      }),
    ]);

    return { message: 'Password has been reset successfully! You can now log in.' };
  }

  static async sendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email.');
    }

    if (user.isEmailVerified) {
      throw new AppError(httpStatus.BAD_REQUEST, 'This email address is already verified.');
    }

    // Clean up older verification tokens
    await prisma.emailToken.deleteMany({
      where: {
        email: user.email,
        type: TokenType.EMAIL_VERIFICATION,
      },
    });

    const verifyTokenStr = crypto.randomBytes(32).toString('hex');
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailToken.create({
      data: {
        email: user.email,
        token: verifyTokenStr,
        otpCode,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    const verifyUrl = `${config.client_url}/verify-email?token=${verifyTokenStr}`;

    addEmailJob({
      to: user.email,
      subject: 'আপনার ইমেইল ভেরিফাই করুন - Shunno Academy',
      template: 'EMAIL_VERIFICATION',
      context: {
        name: user.name,
        verifyUrl,
        otpCode,
      },
    }).catch(() => {});

    return { message: 'Verification email dispatched successfully.' };
  }

  static async verifyEmail(tokenOrOtp: string) {
    const emailToken = await prisma.emailToken.findFirst({
      where: {
        OR: [{ token: tokenOrOtp }, { otpCode: tokenOrOtp }],
        type: TokenType.EMAIL_VERIFICATION,
      },
    });

    if (!emailToken) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid verification code or link!');
    }

    if (new Date() > emailToken.expiresAt) {
      await prisma.emailToken.delete({ where: { id: emailToken.id } });
      throw new AppError(httpStatus.BAD_REQUEST, 'Verification code or link has expired. Please request a new one.');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: emailToken.email },
        data: { isEmailVerified: true },
      }),
      prisma.emailToken.delete({
        where: { id: emailToken.id },
      }),
    ]);

    return { message: 'Email address successfully verified!' };
  }

  static async refreshToken(token: string) {
    let decoded;
    try {
      decoded = verifyToken(token, config.jwt.refresh_secret);
    } catch {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token!');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.isBlocked || user.refreshToken !== token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid refresh token or account suspended!');
    }

    const currentSessionId = user.currentSessionId || crypto.randomUUID();
    const jwtPayload = { userId: user.id, email: user.email, role: user.role, sessionId: currentSessionId };
    const accessToken = createToken(jwtPayload, config.jwt.access_secret, config.jwt.access_expires_in);

    return { accessToken };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        district: true,
        occupation: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                mode: true,
              },
            },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    return user;
  }

  static async updateProfile(userId: string, payload: Partial<User>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: payload,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        district: true,
        occupation: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });
    return user;
  }

  static async changePassword(userId: string, payload: { oldPassword: string; newPassword: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
    }

    const isMatch = await bcrypt.compare(payload.oldPassword, user.password);
    if (!isMatch) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Current password does not match!');
    }

    const newHashedPassword = await bcrypt.hash(payload.newPassword, config.salt_rounds);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  static async googleLogin(payload: {
    credential?: string;
    accessToken?: string;
    userInfo?: {
      email: string;
      name?: string;
      avatar?: string;
      googleId?: string;
    };
  }) {
    let email: string | undefined;
    let name: string | undefined;
    let avatar: string | undefined;
    let googleId: string | undefined;

    // 1. If Google ID Token (credential) is provided, verify using Google tokeninfo API
    if (payload.credential) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(payload.credential)}`
        );
        if (verifyRes.ok) {
          const googleData = (await verifyRes.json()) as any;
          email = googleData.email;
          name = googleData.name;
          avatar = googleData.picture;
          googleId = googleData.sub;
        }
      } catch {
        // Fallback to JWT decode if tokeninfo is unreachable
        try {
          const base64Url = payload.credential.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
            const decoded = JSON.parse(jsonPayload);
            email = decoded.email;
            name = decoded.name;
            avatar = decoded.picture;
            googleId = decoded.sub;
          }
        } catch {}
      }
    }

    // 2. If Google OAuth Access Token is provided, verify with Google UserInfo API
    if (!email && payload.accessToken) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${payload.accessToken}` },
        });
        if (userinfoRes.ok) {
          const googleData = (await userinfoRes.json()) as any;
          email = googleData.email;
          name = googleData.name;
          avatar = googleData.picture;
          googleId = googleData.sub;
        }
      } catch {}
    }

    // 3. Fallback to passed userInfo
    if (!email && payload.userInfo?.email) {
      email = payload.userInfo.email;
      name = payload.userInfo.name;
      avatar = payload.userInfo.avatar;
      googleId = payload.userInfo.googleId;
    }

    if (!email) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Google authentication failed. No verified email received.');
    }

    email = email.toLowerCase().trim();

    // 4. Find user by email or googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(googleId ? [{ googleId }] : [])],
      },
    });

    if (user) {
      // If user exists, check if blocked
      if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended! Please contact support.');
      }

      // Update avatar/googleId and ensure email is marked verified
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId || user.googleId,
          avatar: avatar || user.avatar || null,
          isEmailVerified: true,
        },
      });
    } else {
      // If user does not exist, create new user account
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), config.salt_rounds);
      user = await prisma.user.create({
        data: {
          name: name ? name.trim() : email.split('@')[0],
          email,
          avatar: avatar || null,
          googleId: googleId || null,
          password: randomPassword,
          role: UserRole.STUDENT,
          isEmailVerified: true,
        },
      });
    }

    // 5. Generate unique Single-Device session & JWT Access & Refresh Tokens
    const currentSessionId = crypto.randomUUID();
    const jwtPayload = { userId: user.id, email: user.email, role: user.role, sessionId: currentSessionId };
    const accessToken = createToken(jwtPayload, config.jwt.access_secret, config.jwt.access_expires_in);
    const refreshToken = createToken(jwtPayload, config.jwt.refresh_secret, config.jwt.refresh_expires_in);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, currentSessionId },
    });

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      district: user.district,
      occupation: user.occupation,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }
}
