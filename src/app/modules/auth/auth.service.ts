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
import { generateUniqueStudentId } from '../../utils/generateStudentId';

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  fatherName?: string;
  fatherPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  nidNumber?: string;
  employeeId?: string;
  district?: string;
  country?: string;
  occupation?: string;
  registrationToken?: string;
  turnstileToken?: string;
}

interface LoginPayload {
  email: string;
  password: string;
  portal?: 'STUDENT_PORTAL' | 'ADMIN_PORTAL';
  turnstileToken?: string;
}

export class AuthService {
  /**
   * Step 1 of Student Registration: Send 6-Digit Email Verification OTP
   */
  static async sendRegistrationOtp(email: string, turnstileToken?: string) {
    if (turnstileToken) {
      await verifyTurnstileToken(turnstileToken);
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      throw new AppError(
        httpStatus.CONFLICT,
        'এই ইমেইল দিয়ে ইতোমধ্যে একটি একাউন্ট তৈরি করা আছে! অনুগ্রহ করে লগইন করুন।'
      );
    }

    // Invalidate prior registration OTP tokens for this email
    await prisma.emailToken.deleteMany({
      where: {
        email: cleanEmail,
        type: TokenType.EMAIL_VERIFICATION,
      },
    });

    const verifyTokenStr = crypto.randomBytes(32).toString('hex');
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity for OTP

    await prisma.emailToken.create({
      data: {
        email: cleanEmail,
        token: verifyTokenStr,
        otpCode,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    const verifyUrl = `${config.client_url}/verify-email?token=${verifyTokenStr}`;

    // Asynchronously dispatch verification email with 6-digit OTP
    addEmailJob({
      to: cleanEmail,
      subject: 'আপনার রেজিস্ট্রেশন ওটিপি কোড - Shunno Academy',
      template: 'EMAIL_VERIFICATION',
      context: {
        name: 'শিক্ষার্থী',
        verifyUrl,
        otpCode,
      },
    }).catch(() => {});

    return {
      success: true,
      message: 'আপনার ইমেইলে একটি ৬ ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।',
      email: cleanEmail,
    };
  }

  /**
   * Step 2 of Student Registration: Verify 6-Digit OTP Code
   */
  static async verifyRegistrationOtp(email: string, otpCode: string) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otpCode.trim();

    const emailToken = await prisma.emailToken.findFirst({
      where: {
        email: cleanEmail,
        otpCode: cleanOtp,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: { gt: new Date() },
      },
    });

    if (!emailToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'ভেরিফিকেশন কোডটি সঠিক নয় অথবা কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      );
    }

    // Delete token once verified
    await prisma.emailToken.delete({
      where: { id: emailToken.id },
    });

    // Generate signed registration token for 1 hour validity
    const registrationToken = createToken(
      { email: cleanEmail, isPreVerified: true },
      config.jwt.access_secret,
      '1h'
    );

    return {
      success: true,
      message: 'ইমেইল সফলভাবে ভেরিফাই হয়েছে!',
      email: cleanEmail,
      registrationToken,
    };
  }

  /**
   * Step 3 of Student Registration: Final Account Creation
   */
  static async register(payload: RegisterPayload) {
    if (payload.turnstileToken) {
      await verifyTurnstileToken(payload.turnstileToken);
    }

    const cleanEmail = payload.email.toLowerCase().trim();

    // Verify registration token if provided
    if (payload.registrationToken) {
      try {
        const decoded = verifyToken(payload.registrationToken, config.jwt.access_secret) as any;
        if (decoded.email !== cleanEmail) {
          throw new AppError(httpStatus.BAD_REQUEST, 'ভেরিফিকেশন টোকেন ও ইমেইল মিলছে না।');
        }
      } catch {
        throw new AppError(httpStatus.BAD_REQUEST, 'রেজিস্ট্রেশন টোকেনের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার ভেরিফাই করুন।');
      }
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      throw new AppError(httpStatus.CONFLICT, 'এই ইমেইল দিয়ে ইতোমধ্যে একটি একাউন্ট তৈরি করা আছে!');
    }

    if (payload.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: payload.phone.trim() },
      });
      if (existingPhone) {
        throw new AppError(httpStatus.CONFLICT, 'এই মোবাইল নম্বর দিয়ে ইতোমধ্যে একটি একাউন্ট খোলা আছে!');
      }
    }

    const hashedPassword = await bcrypt.hash(payload.password, config.salt_rounds);
    const studentId = await generateUniqueStudentId();

    const newUser = await prisma.user.create({
      data: {
        studentId,
        name: payload.name.trim(),
        email: cleanEmail,
        phone: payload.phone.trim(),
        password: hashedPassword,
        role: UserRole.STUDENT,
        fatherName: payload.fatherName?.trim() || null,
        fatherPhone: payload.fatherPhone?.trim() || null,
        guardianName: payload.guardianName?.trim() || null,
        guardianPhone: payload.guardianPhone?.trim() || null,
        address: payload.address?.trim() || null,
        nidNumber: payload.nidNumber?.trim() || null,
        employeeId: payload.employeeId?.trim() || null,
        district: payload.district?.trim() || null,
        country: payload.country?.trim() || 'Bangladesh',
        occupation: payload.occupation?.trim() || null,
        isEmailVerified: true, // Mark verified directly since OTP was pre-verified
      },
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        district: true,
        occupation: true,
        isEmailVerified: true,
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

    return {
      user: newUser,
      accessToken,
      refreshToken,
    };
  }

  static async login(
    payload: LoginPayload & { requiredRole?: UserRole; portal?: 'STUDENT_PORTAL' | 'ADMIN_PORTAL' | 'TEACHER_PORTAL' },
    portalParam?: 'STUDENT_PORTAL' | 'ADMIN_PORTAL' | 'TEACHER_PORTAL'
  ) {
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

    // Determine requested portal context
    const activePortal =
      portalParam ||
      payload.portal ||
      (payload.requiredRole === UserRole.ADMIN ? 'ADMIN_PORTAL' : 'STUDENT_PORTAL');

    // Rule: Admins/Staff/Teachers cannot login through student login portal
    if (activePortal === 'STUDENT_PORTAL') {
      if (user.role === UserRole.ADMIN || user.role === UserRole.STAFF) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'অ্যাডমিন অ্যাকাউন্ট দিয়ে সাধারণ লগইন পেজে লগইন করা যাবে না। অনুগ্রহ করে /admin-login পেজ ব্যবহার করুন।'
        );
      }
      if (user.role === UserRole.INSTRUCTOR) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'শিক্ষক অ্যাকাউন্ট দিয়ে সাধারণ লগইন পেজে লগইন করা যাবে না। অনুগ্রহ করে /teacher-login পেজ ব্যবহার করুন।'
        );
      }
    }

    // Rule: Non-admins cannot login through admin login portal
    if (activePortal === 'ADMIN_PORTAL') {
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'শুধুমাত্র অনুমোদিত অ্যাডমিন এবং স্টাফগণ অ্যাডমিন পোর্টালে লগইন করতে পারবেন।'
        );
      }
    }

    // Rule: Only Teachers (and Admins) can login through teacher login portal
    if (activePortal === 'TEACHER_PORTAL') {
      if (user.role !== UserRole.INSTRUCTOR && user.role !== UserRole.ADMIN) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'শুধুমাত্র শিক্ষকগণ শিক্ষক পোর্টালে লগইন করতে পারবেন। সাধারণ শিক্ষার্থীরা /login পেজ ব্যবহার করুন।'
        );
      }
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

    // If existing student lacks a studentId, assign one automatically
    let currentStudentId = user.studentId;
    if (user.role === UserRole.STUDENT && !currentStudentId) {
      currentStudentId = await generateUniqueStudentId();
      await prisma.user.update({
        where: { id: user.id },
        data: { studentId: currentStudentId },
      });
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
      studentId: currentStudentId,
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
          isEmailVerified: true,
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
        studentId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        district: true,
        occupation: true,
        fatherName: true,
        fatherPhone: true,
        guardianName: true,
        guardianPhone: true,
        address: true,
        nidNumber: true,
        country: true,
        employeeId: true,
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

    // Auto-generate and update studentId if a student user doesn't have one
    if (user.role === UserRole.STUDENT && !user.studentId) {
      const generatedId = await generateUniqueStudentId();
      await prisma.user.update({
        where: { id: user.id },
        data: { studentId: generatedId },
      });
      user.studentId = generatedId;
    }

    return user;
  }

  static async updateProfile(userId: string, payload: Partial<User>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: payload,
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        district: true,
        occupation: true,
        fatherName: true,
        fatherPhone: true,
        guardianName: true,
        guardianPhone: true,
        address: true,
        nidNumber: true,
        country: true,
        employeeId: true,
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
    portal?: 'STUDENT_PORTAL' | 'ADMIN_PORTAL';
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

    // 1. If Google ID Token (credential) is provided, verify using Google TokenInfo API
    if (payload.credential) {
      try {
        const tokeninfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(payload.credential)}`
        );
        if (tokeninfoRes.ok) {
          const googleData = (await tokeninfoRes.json()) as any;
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
    const activePortal = payload.portal || 'STUDENT_PORTAL';

    // 4. Find user by email or googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(googleId ? [{ googleId }] : [])],
      },
    });

    if (user) {
      // Portal authorization checks
      if (activePortal === 'STUDENT_PORTAL' && (user.role === UserRole.ADMIN || user.role === UserRole.STAFF)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'অ্যাডমিন অ্যাকাউন্ট দিয়ে সাধারণ গুগল লগইন ব্যবহার করা যাবে না। অনুগ্রহ করে /admin-login পেজ ব্যবহার করুন।'
        );
      }

      if (activePortal === 'ADMIN_PORTAL' && user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'শিক্ষার্থী অ্যাকাউন্ট দিয়ে অ্যাডমিন পোর্টালে লগইন করা যাবে না।'
        );
      }

      // If user exists, check if blocked
      if (user.isBlocked) {
        throw new AppError(httpStatus.FORBIDDEN, 'Your account has been suspended! Please contact support.');
      }

      // If student user lacks a studentId, assign one automatically
      let currentStudentId = user.studentId;
      if (user.role === UserRole.STUDENT && !currentStudentId) {
        currentStudentId = await generateUniqueStudentId();
      }

      // Update avatar/googleId and ensure email is marked verified
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId || user.googleId,
          avatar: avatar || user.avatar || null,
          studentId: currentStudentId,
          isEmailVerified: true,
        },
      });
    } else {
      // If portal is ADMIN_PORTAL and account doesn't exist, block registration as admin
      if (activePortal === 'ADMIN_PORTAL') {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'এই জিমেইলের সাথে কোনো অনুমোদিত অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।'
        );
      }

      // If student user does not exist, create new student account with studentId
      const studentId = await generateUniqueStudentId();
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), config.salt_rounds);
      user = await prisma.user.create({
        data: {
          studentId,
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
      studentId: user.studentId,
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
