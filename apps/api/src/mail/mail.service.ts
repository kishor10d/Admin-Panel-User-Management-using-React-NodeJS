import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset({ to, name, resetUrl }: { to: string; name: string | null; resetUrl: string }) {
    if (!this.isConfigured()) {
      if (this.config.get<string>('NODE_ENV') !== 'production') {
        this.logger.log(`Development password-reset link for ${to}: ${resetUrl}`);
        return;
      }
      throw new Error('SMTP email delivery is not configured. Set MAIL_HOST and MAIL_FROM_EMAIL.');
    }

    await this.getTransporter().sendMail({
      from: this.fromAddress(),
      to,
      subject: 'Reset your CIAS Admin password',
      text: passwordResetText(name, resetUrl),
      html: passwordResetHtml(name, resetUrl),
    });
  }

  private isConfigured() {
    return Boolean(this.config.get<string>('MAIL_HOST') && this.config.get<string>('MAIL_FROM_EMAIL'));
  }

  private getTransporter() {
    if (!this.transporter) {
      const user = this.config.get<string>('MAIL_USER');
      const password = this.config.get<string>('MAIL_PASSWORD');
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('MAIL_HOST'),
        port: Number(this.config.get<string>('MAIL_PORT') ?? 587),
        secure: this.config.get<string>('MAIL_SECURE') === 'true',
        auth: user && password ? { user, pass: password } : undefined,
      });
    }
    return this.transporter;
  }

  private fromAddress() {
    const name = this.config.get<string>('MAIL_FROM_NAME') ?? 'CIAS Admin';
    const email = this.config.get<string>('MAIL_FROM_EMAIL');
    return `${name} <${email}>`;
  }
}

function passwordResetText(name: string | null, resetUrl: string) {
  const greeting = name ? `Hello ${name},` : 'Hello,';
  return `${greeting}\n\nWe received a request to reset your CIAS Admin password. Use the link below to choose a new password:\n\n${resetUrl}\n\nThis link expires in one hour and can only be used once. If you did not request a password reset, you can ignore this email.`;
}

function passwordResetHtml(name: string | null, resetUrl: string) {
  const greeting = escapeHtml(name ? `Hello ${name},` : 'Hello,');
  const safeUrl = escapeHtml(resetUrl);
  return `<!doctype html><html><body><p>${greeting}</p><p>We received a request to reset your CIAS Admin password.</p><p><a href="${safeUrl}">Reset password</a></p><p>This link expires in one hour and can only be used once.</p><p>If you did not request a password reset, you can ignore this email.</p></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}
