import nodemailer from 'nodemailer';
import config from '../../config';
import { logger, errorLogger } from '../../shared/logger';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const hasCredentials = Boolean(config.email.smtp_user && config.email.smtp_pass);

  if (hasCredentials) {
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
 * Verify SMTP Transporter Connection on startup
 */
export async function verifySmtpConnection(): Promise<boolean> {
  const hasCredentials = Boolean(config.email.smtp_user && config.email.smtp_pass);
  if (!hasCredentials) {
    logger.warn('⚠️ SMTP credentials not set. Emails will be logged in stream mode.');
    return false;
  }

  try {
    const t = getEmailTransporter();
    await t.verify();
    logger.info(`✅ [SMTP] Email server connection verified and authenticated for "${config.email.smtp_user}"`);
    return true;
  } catch (error: any) {
    errorLogger.error(`❌ [SMTP] Verification failed for "${config.email.smtp_user}":`, error.message);
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

export async function sendMailDirect(options: SendMailOptions) {
  const mailTransporter = getEmailTransporter();
  const fromHeader = `"${config.email.from_name}" <${config.email.from_email}>`;

  const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

  const info = await mailTransporter.sendMail({
    from: options.from || fromHeader,
    to: recipients,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  const hasCredentials = Boolean(config.email.smtp_user && config.email.smtp_pass);
  if (!hasCredentials && (info as any).message) {
    logger.info(`📬 [SIMULATED EMAIL DISPATCH] To: ${recipients} | Subject: "${options.subject}"`);
  }

  return info;
}
