import nodemailer from 'nodemailer';
import { config } from '../config';

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
                user: config.email.user,
                pass: config.email.password,
            },
        });
    }

    private async sendMail(to: string, subject: string, html: string) {
        try {
            await this.transporter.sendMail({
                from: `"PTIT Social" <${config.email.from}>`,
                to,
                subject,
                html,
            });
            console.log(`📧 Email sent to ${to}: ${subject}`);
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
            // Don't throw - email failure shouldn't block the main flow
        }
    }

    // Email verification
    async sendVerificationEmail(to: string, fullName: string | null, code: string) {
        const subject = '🔐 Xác thực email - PTIT Social';
        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #C41E3A 0%, #9B1B30 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">PTIT Social</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Mạng xã hội sinh viên PTIT</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #2C3E50; margin: 0 0 16px;">Xin chào ${fullName || 'bạn'}! 👋</h2>
          <p style="color: #555; line-height: 1.6; font-size: 15px;">
            Cảm ơn bạn đã đăng ký tài khoản PTIT Social. Vui lòng sử dụng mã sau để xác thực email của bạn:
          </p>
          <div style="background: #f8f9fa; border: 2px dashed #C41E3A; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #C41E3A;">${code}</span>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center;">
            ⏰ Mã xác thực sẽ hết hạn sau <strong>15 phút</strong>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.
          </p>
        </div>
      </div>
    `;
        await this.sendMail(to, subject, html);
    }

    // Password reset
    async sendPasswordResetEmail(to: string, fullName: string | null, code: string) {
        const subject = '🔑 Đặt lại mật khẩu - PTIT Social';
        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #C41E3A 0%, #9B1B30 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">PTIT Social</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Đặt lại mật khẩu</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #2C3E50; margin: 0 0 16px;">Xin chào ${fullName || 'bạn'}! 👋</h2>
          <p style="color: #555; line-height: 1.6; font-size: 15px;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã OTP bên dưới để tiếp tục:
          </p>
          <div style="background: #f8f9fa; border: 2px dashed #C41E3A; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #C41E3A;">${code}</span>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center;">
            ⏰ Mã OTP sẽ hết hạn sau <strong>15 phút</strong>
          </p>
          <div style="background: #fff3cd; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #856404; margin: 0; font-size: 13px;">
              ⚠️ <strong>Lưu ý:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, ai đó có thể đang cố truy cập tài khoản của bạn. Hãy bỏ qua email này và đổi mật khẩu ngay.
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Email này được gửi tự động, vui lòng không trả lời.
          </p>
        </div>
      </div>
    `;
        await this.sendMail(to, subject, html);
    }

    // 2FA enabled notification
    async send2FAEnabledEmail(to: string, fullName: string | null) {
        const subject = '🛡️ Xác thực 2 bước đã được bật - PTIT Social';
        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🛡️ PTIT Social</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Bảo mật tài khoản</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #2C3E50; margin: 0 0 16px;">Xin chào ${fullName || 'bạn'}! ✅</h2>
          <p style="color: #555; line-height: 1.6; font-size: 15px;">
            Xác thực hai bước (2FA) đã được <strong style="color: #27ae60;">bật thành công</strong> cho tài khoản của bạn.
          </p>
          <p style="color: #555; line-height: 1.6; font-size: 15px;">
            Từ bây giờ, mỗi khi đăng nhập bạn sẽ cần nhập mã từ ứng dụng xác thực (Google Authenticator, Authy...) ngoài mật khẩu.
          </p>
          <div style="background: #d4edda; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #155724; margin: 0; font-size: 13px;">
              🔒 Hãy lưu giữ mã backup codes ở nơi an toàn để khôi phục tài khoản khi cần.
            </p>
          </div>
        </div>
      </div>
    `;
        await this.sendMail(to, subject, html);
    }
}

export const emailService = new EmailService();
