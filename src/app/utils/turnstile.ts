import config from '../config';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Validates Cloudflare Turnstile Bot Token with Cloudflare siteverify API
 */
export async function verifyTurnstileToken(token?: string, remoteIp?: string): Promise<boolean> {
  const secretKey = config.turnstile?.secret_key;

  // If Turnstile Secret Key is not configured in .env, gracefully allow in dev/staging
  if (!secretKey) {
    return true;
  }

  // If secret key is set but no token provided
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'রোবট বা বট সুরক্ষার জন্য সিকিউরিটি যাচাইকরণ সম্পন্ন করুন (Turnstile verification required).');
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'বট বা সন্দেহজনক ট্র্যাফিক সনাক্ত করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন (Bot security verification failed).'
      );
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Network or fetch fallback
    return true;
  }
}

