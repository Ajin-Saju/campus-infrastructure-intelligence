import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configured for SMTP or fallback console logging in development
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'campus_ai_notifications@campus.edu',
        pass: process.env.SMTP_PASS || 'secret',
      },
    });
  }

  async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
        await this.transporter.sendMail({
          from: '"Campus Infra Intelligence" <notifications@campus.edu>',
          to,
          subject,
          html: htmlContent,
        });
        this.logger.log(`📧 Real email sent to ${to}: "${subject}"`);
      } else {
        this.logger.log(`📧 [DEV EMAIL SIMULATOR] Sent to: ${to} | Subject: "${subject}"`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }

  generateNotificationHtml(title: string, message: string, type: string, link?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 20px; }
            .container { max-width: 560px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; padding: 24px; }
            .header { border-b: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background-color: #3b82f6; color: #ffffff; }
            .title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 12px; margin-bottom: 8px; }
            .message { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
            .btn { display: inline-block; padding: 10px 20px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; }
            .footer { margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">${type.replace('_', ' ')}</span>
              <div class="title">${title}</div>
            </div>
            <div class="message">${message}</div>
            ${link ? `<a href="${process.env.APP_URL || 'http://localhost:3000'}${link}" class="btn">View in Campus Portal</a>` : ''}
            <div class="footer">
              Campus Infrastructure Intelligence System &bull; Automated System Notification
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

