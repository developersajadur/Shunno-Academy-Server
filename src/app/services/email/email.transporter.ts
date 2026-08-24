import nodemailer from 'nodemailer';
import config from '../../config';
import { logger, errorLogger } from '../../shared/logger';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const hasCredentials = Boolean(config.email.smtp_user && config.email.smtp_pass);

  if (hasCredentials) {
    const isGmail =
      config.email.smtp_host.toLowerCase().includes('gmail') ||
      config.email.smtp_user.toLowerCase().includes('@gmail.com');

    if (isGmail) {
      // Cloud-optimized Gmail service connection with pooling and SSL
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.email.smtp_user,
          pass: config.email.smtp_pass,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10,
        tls: {
          rejectUnauthorized: false,
        },
      });
      logger.info(`📧 Nodemailer Gmail Service transporter initialized for "${config.email.smtp_user}" (SSL/TLS Active)`);
    } else {
      transporter = nodemailer.createTransport({
        host: config.email.smtp_host,
        port: config.email.smtp_port,
        secure: config.email.smtp_secure,
        auth: {
          user: config.email.smtp_user,
          pass: config.email.smtp_pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      logger.info(`📧 Nodemailer SMTP transporter configured with host: ${config.email.smtp_host}:${config.email.smtp_port}`);
    }
  } else {
    // Development / Stream Fallback Transporter
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    logger.info('📧 Nodemailer simulated stream transporter active (No SMTP credentials provided in .env)');
  }

  return transporter;
}

/**
 * Verify Email Service (Resend HTTPS API or SMTP Transporter)
 */
export async function verifySmtpConnection(): Promise<boolean> {
  // 1. Check if Resend HTTPS API Key is configured
  if (config.email.resend_api_key) {
    try {
      const response = await fetch('https://api.resend.com/api-keys', {
        headers: {
          Authorization: `Bearer ${config.email.resend_api_key}`,
        },
      });
      if (response.ok) {
        logger.info(`✅ [Resend HTTPS API] Cloud Email Service authenticated & active for "${config.email.from_email}"`);
        return true;
      } else {
        errorLogger.warn(`⚠️ [Resend HTTPS API] Auth check returned status: ${response.status}`);
      }
    } catch (apiErr: any) {
      errorLogger.warn(`⚠️ [Resend HTTPS API] Verification notice: ${apiErr.message}`);
    }
  }

  // 2. Check SMTP Credentials
  const hasCredentials = Boolean(config.email.smtp_user && config.email.smtp_pass);
  if (!hasCredentials) {
    logger.warn('⚠️ SMTP credentials not set. Emails will be logged in stream mode.');
    return false;
  }

  try {
    const t = getEmailTransporter();
    await Promise.race([
      t.verify(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP connection verification timed out after 8s (Render Free Tier blocks raw SMTP ports 465/587)')), 8000)
      ),
    ]);
    logger.info(`✅ [SMTP] Email server connection verified and authenticated for "${config.email.smtp_user}"`);
    return true;
  } catch (error: any) {
    const errMsg = error.message || error.code || error.response || JSON.stringify(error);
    errorLogger.error(`❌ [SMTP] Verification failed for "${config.email.smtp_user}": ${errMsg}`);
    return false;
  }
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Sends email via Resend HTTPS API (Recommended for Render) or falls back to Nodemailer SMTP
 */
export async function sendMailDirect(options: SendMailOptions) {
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const fromHeader = options.from || `"${config.email.from_name}" <${config.email.from_email}>`;

  // Option A: If Resend API Key is set, send via HTTPS (Port 443 - 100% works on Render Free Tier)
  if (config.email.resend_api_key) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.email.resend_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromHeader.includes('<') ? fromHeader : `${config.email.from_name} <${config.email.from_email}>`,
          to: recipients,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Resend API error: status ${res.status}`);
      }

      logger.info(`📬 [Resend HTTPS] Successfully delivered "${options.subject}" to: ${recipients.join(', ')} (ID: ${data.id})`);
      return { accepted: recipients, messageId: data.id, resend: true };
    } catch (resendError: any) {
      errorLogger.warn(`⚠️ [Resend HTTPS Failed] ${resendError.message}. Attempting Nodemailer SMTP fallback...`);
    }
  }

  // Option B: Standard Nodemailer SMTP Transporter
  const mailTransporter = getEmailTransporter();
  const info = await mailTransporter.sendMail({
    from: fromHeader,
    to: recipients.join(', '),
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  const hasCredentials = Boolean(config.email.smtp_user && config.email.smtp_pass);
  if (!hasCredentials && (info as any).message) {
    logger.info(`📬 [SIMULATED EMAIL DISPATCH] To: ${recipients.join(', ')} | Subject: "${options.subject}"`);
  }

  return info;
}
