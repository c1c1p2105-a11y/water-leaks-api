import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { envs } from '../config/envs';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: envs.MAIL_HOST,
      port: envs.MAIL_PORT,
      secure: envs.MAIL_PORT === 465, // true para 465 (SSL), false para otros puertos (STARTTLS)
      auth: {
        user: envs.MAIL_USER,
        pass: envs.MAIL_PASSWORD,
      },
    });
  }

  async sendEmail(to: string, subject: string, template: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: envs.MAIL_FROM,
        to,
        subject,
        html: template,
      });
      this.logger.log(`Correo enviado correctamente a ${to}`);
    } catch (error) {
      this.logger.error(`Error al enviar el correo a ${to}`, error);
      throw error;
    }
  }
}
