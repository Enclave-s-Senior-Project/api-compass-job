import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import { confirmMail } from './templates';
import { resetPassword } from './templates/reset-password.html';

@Injectable()
export class MailSenderService {
    private transporter: Transporter;
    private socials: string;
    private logger = new Logger('MailSenderService');

    constructor(private readonly configService: ConfigService) {
        this.transporter = createTransport({
            host: process.env.MAILER_HOST || this.configService.get<string>('MAIL_HOST'),
            port: parseInt(process.env.MAILER_PORT) || this.configService.get<number>('MAIL_PORT'),
            secure: process.env.MAILER_SECURE === 'true' || this.configService.get<boolean>('MAIL_SECURE'),
            auth: {
                user: process.env.MAILER_USER || this.configService.get<string>('MAIL_USER'),
                pass: process.env.MAILER_PASSWORD || this.configService.get<string>('MAIL_PASS'),
            },
            debug: true,
        });

        this.socials = [
            { name: 'Facebook', url: process.env.PROJECT_FB_URL },
            { name: 'Twitter', url: process.env.PROJECT_TWITTER_URL },
        ]
            .map(
                (social) =>
                    `<a href="${social.url}" style="color:#3498db;font-weight:400;text-decoration:none;font-size:12px;padding:0 5px" target="_blank">${social.name}</a>`
            )
            .join('');
    }

    async sendVerifyEmailMail(name: string, email: string, code: number): Promise<boolean> {
        const mail = confirmMail
            .replace(/--PersonName--/g, name)
            .replace(/--ProjectName--/g, process.env.PROJECT_NAME)
            .replace(/--ProjectAddress--/g, process.env.PROJECT_ADDRESS)
            .replace(/--ProjectLogo--/g, process.env.PROJECT_LOGO_URL)
            .replace(/--ProjectSlogan--/g, process.env.PROJECT_SLOGAN)
            .replace(/--ProjectColor--/g, process.env.PROJECT_COLOR)
            .replace(/--ProjectLink--/g, process.env.PROJECT_URL)
            .replace(/--Socials--/g, this.socials)
            .replace(/--VerificationCode--/g, code.toString())
            .replace(/--TermsOfServiceLink--/g, process.env.PROJECT_TERMS_URL);

        const mailOptions: Mail.Options = {
            from: `"${process.env.MAILER_USER}" <${process.env.MAILER_USER}>`,
            to: email, // <-- This might be undefined or empty
            subject: `Welcome to ${process.env.PROJECT_NAME} ${name}! Confirm Your Email`,
            html: mail,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Verification email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.warn(`Mail sending failed: ${error.message}`);
            return false;
        }
    }

    //   async sendChangeEmailMail(
    //     name: string,
    //     email: string,
    //     token: string,
    //   ): Promise<boolean> {
    //     const buttonLink = `${config.project.mailChangeUrl}?token=${token}`;

    //     const mail = changeMail
    //       .replace(new RegExp('--PersonName--', 'g'), name)
    //       .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
    //       .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
    //       .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
    //       .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
    //       .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
    //       .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
    //       .replace(new RegExp('--Socials--', 'g'), this.socials)
    //       .replace(new RegExp('--ButtonLink--', 'g'), buttonLink);

    //     const mailOptions = {
    //       from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
    //       to: email, // list of receivers (separated by ,)
    //       subject: `Change Your ${config.project.name} Account's Email`,
    //       html: mail,
    //     };

    //     return new Promise<boolean>((resolve) =>
    //       this.transporter.sendMail(mailOptions, async (error) => {
    //         if (error) {
    //           this.logger.warn(
    //             'Mail sending failed, check your service credentials.',
    //           );
    //           resolve(false);
    //         }
    //         resolve(true);
    //       }),
    //     );
    //   }

    async sendResetPasswordMail(username: string, email: string, token: string, iv: string): Promise<boolean> {
        const buttonLink = `${process.env.CLIENT_URL}/reset-password?token=${token}&email=${email}&iv=${iv}`;

        const mail = resetPassword
            .replace(new RegExp('--ProjectName--', 'g'), process.env.PROJECT_NAME)
            .replace(new RegExp('--Username--', 'g'), username)
            .replace(new RegExp('--ProjectLogo--', 'g'), process.env.PROJECT_LOGO_URL)
            .replace(new RegExp('--ResetPasswordLink--', 'g'), buttonLink);

        const mailOptions = {
            from: `"${process.env.MAILER_DEFAULT_NAME}" <${process.env.MAILER_DEFAULT_EMAIL}>`,
            to: email, // list of receivers (separated by ,)
            subject: `Reset Your ${process.env.PROJECT_NAME} Account's Password`,
            html: mail,
        };

        return new Promise<boolean>((resolve) =>
            this.transporter.sendMail(mailOptions, async (error) => {
                if (error) {
                    this.logger.warn('Mail sending failed, check your service credentials.');
                    resolve(false);
                }
                resolve(true);
            })
        );
    }

    //   async sendPasswordChangeInfoMail(
    //     name: string,
    //     email: string,
    //   ): Promise<boolean> {
    //     const buttonLink = config.project.url;
    //     const mail = changePasswordInfo
    //       .replace(new RegExp('--PersonName--', 'g'), name)
    //       .replace(new RegExp('--ProjectName--', 'g'), config.project.name)
    //       .replace(new RegExp('--ProjectAddress--', 'g'), config.project.address)
    //       .replace(new RegExp('--ProjectLogo--', 'g'), config.project.logoUrl)
    //       .replace(new RegExp('--ProjectSlogan--', 'g'), config.project.slogan)
    //       .replace(new RegExp('--ProjectColor--', 'g'), config.project.color)
    //       .replace(new RegExp('--ProjectLink--', 'g'), config.project.url)
    //       .replace(new RegExp('--Socials--', 'g'), this.socials)
    //       .replace(new RegExp('--ButtonLink--', 'g'), buttonLink);

    //     const mailOptions = {
    //       from: `"${config.mail.senderCredentials.name}" <${config.mail.senderCredentials.email}>`,
    //       to: email, // list of receivers (separated by ,)
    //       subject: `Your ${config.project.name} Account's Password is Changed`,
    //       html: mail,
    //     };

    //     return new Promise<boolean>((resolve) =>
    //       this.transporter.sendMail(mailOptions, async (error) => {
    //         if (error) {
    //           this.logger.warn(
    //             'Mail sending failed, check your service credentials.',
    //           );
    //           resolve(false);
    //         }
    //         resolve(true);
    //       }),
    //     );
    //   }
}
