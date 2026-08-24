import config from '../../config';

interface BaseTemplateOptions {
  title: string;
  preheader?: string;
  content: string;
}

export function buildBaseEmailHtml({ title, preheader, content }: BaseTemplateOptions): string {
  const clientUrl = config.client_url || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f6f9;
      padding: 40px 10px;
    }
    .main {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      text-decoration: none;
    }
    .tagline {
      color: rgba(255, 255, 255, 0.85);
      font-size: 12px;
      margin-top: 4px;
      margin-bottom: 0;
      font-weight: 500;
    }
    .body-content {
      padding: 36px 32px;
      line-height: 1.65;
      font-size: 15px;
    }
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .info-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin: 20px 0;
    }
    .otp-box {
      background: #eff6ff;
      border: 2px dashed #93c5fd;
      border-radius: 14px;
      padding: 18px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-family: 'Courier New', monospace;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #1d4ed8;
      margin: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none!important;font-size:0;line-height:0;max-height:0;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <a href="${clientUrl}" class="logo-text">SHUNNO ACADEMY</a>
          <p class="tagline">শূন্য থেকে শুরু করুন আপনার সফল ফ্রিল্যান্সিং ও আইটি ক্যারিয়ার</p>
        </td>
      </tr>
      <tr>
        <td class="body-content">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 8px 0;"><strong>শুন্য একাডেমি (Shunno Academy)</strong></p>
          <p style="margin: 0 0 8px 0;">প্রয়োজনে কল করুন: <a href="tel:+8801704293125">+880 1704-293125</a> | <a href="tel:+8801313292907">+880 1313-292907</a> | হেল্পডেস্ক: <a href="mailto:${config.email.from_email}">${config.email.from_email}</a></p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Shunno Academy. সর্বস্বত্ব সংরক্ষিত।</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}

export class EmailTemplateService {
  /**
   * 1. EMAIL VERIFICATION TEMPLATE
   */
  static getEmailVerificationHtml(params: { name: string; verifyUrl: string; otpCode?: string }) {
    const content = `
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0;">আসসালামু আলাইকুম ${params.name || 'শিক্ষার্থী'},</h2>
      <p>শুন্য একাডেমিতে স্বাগতম! আপনার রেজিস্ট্রেশন সম্পন্ন করতে এবং অ্যাকাউন্ট সুরক্ষিত রাখতে অনুগ্রহ করে আপনার ইমেইল ঠিকানাটি ভেরিফাই করুন।</p>
      
      ${
        params.otpCode
          ? `
        <div class="otp-box">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase;">আপনার ওয়ান-টাইম ভেরিফিকেশন কোড (OTP)</p>
          <p class="otp-code">${params.otpCode}</p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">এই কোডটি আগামী ৩০ মিনিট কার্যকর থাকবে</p>
        </div>
      `
          : ''
      }

      <p style="text-align: center; margin: 28px 0;">
        <a href="${params.verifyUrl}" class="btn-primary">ইমেইল ভেরিফাই করুন</a>
      </p>

      <p style="font-size: 13px; color: #64748b;">বাটন কাজ না করলে এই লিংকটি ব্রাউজারে কপি করে পেস্ট করুন:<br>
        <a href="${params.verifyUrl}" style="color: #2563eb; word-break: break-all;">${params.verifyUrl}</a>
      </p>
    `;

    return buildBaseEmailHtml({
      title: 'আপনার ইমেইল ভেরিফাই করুন - শুন্য একাডেমি',
      preheader: 'আপনার শুন্য একাডেমি অ্যাকাউন্ট ভেরিফাই করার নির্দেশিকা',
      content,
    });
  }

  /**
   * 2. FORGOT / RESET PASSWORD TEMPLATE
   */
  static getPasswordResetHtml(params: { name: string; resetUrl: string }) {
    const content = `
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0;">হ্যালো ${params.name || 'শিক্ষার্থী'},</h2>
      <p>আপনার শুন্য একাডেমি অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার জন্য একটি অনুরোধ পেয়েছি। নতুন পাসওয়ার্ড সেট করতে নিচের বাটনে ক্লিক করুন:</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${params.resetUrl}" class="btn-primary">নতুন পাসওয়ার্ড সেট করুন</a>
      </p>

      <div class="info-box">
        <p style="margin: 0; font-size: 12px; color: #dc2626; font-weight: 600;">
          ⚠️ নিরাপত্তা সতর্কতা: এই লিংকটি আগামী ১ ঘণ্টা কার্যকর থাকবে। আপনি যদি পাসওয়ার্ড রিসেটের অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন। আপনার অ্যাকাউন্ট সম্পূর্ণ সুরক্ষিত রয়েছে।
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b;">বাটন কাজ না করলে লিংকটি কপি করুন:<br>
        <a href="${params.resetUrl}" style="color: #2563eb; word-break: break-all;">${params.resetUrl}</a>
      </p>
    `;

    return buildBaseEmailHtml({
      title: 'পাসওয়ার্ড রিসেট নির্দেশিকা - শুন্য একাডেমি',
      preheader: 'আপনার শুন্য একাডেমি পাসওয়ার্ড রিসেট করার লিংক',
      content,
    });
  }

  /**
   * 3. PAYMENT SUBMITTED RECEIPT TEMPLATE
   */
  static getPaymentSubmittedHtml(params: {
    name: string;
    orderId: string;
    trxId: string;
    amount: number;
    method?: string;
    courseTitle?: string;
  }) {
    const clientUrl = config.client_url || 'http://localhost:3000';
    const content = `
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0;">প্রিয় ${params.name || 'শিক্ষার্থী'},</h2>
      <p>শুন্য একাডেমির কোর্স ফি পেমেন্ট তথ্য সফলভাবে গ্রহণ করা হয়েছে! আমাদের অ্যাকাউন্টস টিম আপনার দেওয়া Transaction ID ভেরিফাই করছে।</p>

      <div class="info-box">
        <table width="100%" style="font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">অর্ডার আইডি:</td>
            <td style="padding: 8px 0; font-weight: 700; text-align: right;">${params.orderId}</td>
          </tr>
          ${
            params.courseTitle
              ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">কোর্স:</td>
            <td style="padding: 8px 0; font-weight: 700; text-align: right;">${params.courseTitle}</td>
          </tr>
          `
              : ''
          }
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Transaction ID (TrxID):</td>
            <td style="padding: 8px 0; font-weight: 700; text-align: right; font-family: monospace; color: #2563eb;">${params.trxId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">পরিশোধিত টাকার পরিমাণ:</td>
            <td style="padding: 8px 0; font-weight: 800; text-align: right; color: #16a34a; font-size: 16px;">৳${params.amount}</td>
          </tr>
        </table>
      </div>

      <p>সাধারণত <strong>১০ থেকে ৩০ মিনিটের মধ্যে</strong> পেমেন্ট যাচাই সম্পন্ন হয়ে আপনার ক্লাসে প্রবেশাধিকার চালু হয়ে যাবে এবং আপনাকে কনফার্মেশন ইমেইল পাঠানো হবে।</p>

      <p style="text-align: center; margin: 24px 0;">
        <a href="${clientUrl}/dashboard" class="btn-primary">আমার ড্যাশবোর্ড দেখুন</a>
      </p>
    `;

    return buildBaseEmailHtml({
      title: `পেমেন্ট রিসিট [${params.orderId}] - শুন্য একাডেমি`,
      preheader: `অর্ডার ${params.orderId} এর পেমেন্ট তথ্য সফলভাবে গ্রহণ করা হয়েছে`,
      content,
    });
  }

  /**
   * 4. ENROLLMENT APPROVED & AUTO-ENROLLED TEMPLATE
   */
  static getEnrollmentApprovedHtml(params: {
    name: string;
    courseTitle: string;
    orderId: string;
    batchSchedule?: string;
  }) {
    const clientUrl = config.client_url || 'http://localhost:3000';
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #dcfce7; color: #16a34a; font-size: 32px; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; margin-bottom: 12px;">🎉</div>
        <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0;">অভিনন্দন ${params.name || 'শিক্ষার্থী'}!</h2>
        <p style="color: #16a34a; font-weight: 700; margin: 4px 0 0 0;">আপনার পেমেন্ট সফলভাবে ভেরিফাইড এবং এনরোলমেন্ট অনুমোদিত হয়েছে!</p>
      </div>

      <div class="info-box">
        <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">অনুমোদিত কোর্স:</p>
        <h3 style="margin: 0 0 12px 0; font-size: 17px; color: #1e293b; font-weight: 800;">${params.courseTitle}</h3>
        ${
          params.batchSchedule
            ? `<p style="margin: 0; font-size: 13px; color: #475569;"><strong>📅 ব্যাচ ও শিডিউল:</strong> ${params.batchSchedule}</p>`
            : ''
        }
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #475569;"><strong>🧾 অর্ডার আইডি:</strong> ${params.orderId}</p>
      </div>

      <p>আপনি এখন আপনার স্টুডেন্ট ড্যাশবোর্ড থেকে কোর্সের সকল লেকচার, লাইভ ক্লাস লিংক, স্টাডি মেটেরিয়ালস এবং সাপোর্ট কমিউনিটিতে প্রবেশ করতে পারবেন।</p>

      <p style="text-align: center; margin: 28px 0;">
        <a href="${clientUrl}/dashboard/courses" class="btn-primary">কোর্স ও ক্লাসে প্রবেশ করুন</a>
      </p>
    `;

    return buildBaseEmailHtml({
      title: `ভর্তি অনুমোদন নিশ্চিতকরণ - ${params.courseTitle}`,
      preheader: `অভিনন্দন! ${params.courseTitle} কোর্সে আপনার ভর্তি সফল হয়েছে`,
      content,
    });
  }

  /**
   * 5. PROMOTIONAL / CUSTOM BROADCAST TEMPLATE
   */
  static getPromotionalCustomHtml(params: {
    heading: string;
    body: string;
    preheader?: string;
    ctaButtonText?: string;
    ctaButtonUrl?: string;
  }) {
    const formattedBody = params.body
      .split('\n\n')
      .map((p) => `<p style="margin: 0 0 16px 0;">${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    const content = `
      <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; line-height: 1.35;">${params.heading}</h2>
      
      <div style="font-size: 15px; color: #334155; line-height: 1.7;">
        ${formattedBody}
      </div>

      ${
        params.ctaButtonText && params.ctaButtonUrl
          ? `
        <p style="text-align: center; margin: 32px 0 16px 0;">
          <a href="${params.ctaButtonUrl}" class="btn-primary">${params.ctaButtonText}</a>
        </p>
      `
          : ''
      }
    `;

    return buildBaseEmailHtml({
      title: params.heading,
      preheader: params.preheader || params.heading,
      content,
    });
  }
}

