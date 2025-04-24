import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import * as Mail from 'nodemailer/lib/mailer';
import { confirmMail } from './templates';
import { resetPassword } from './templates/reset-password.html';
import { jobExpirationMail } from './templates/job-expiration.html';
import { jobClosureMail } from './templates/job-closure.html';
import { reopenJobMail } from './templates/job-reopened.html';
import { JobExpiredData } from '@src/modules/job-cron/job-cron.service';
import { applicationStatusMail } from './templates/application-status.html';
import { NotificationType } from '@src/database/entities/notification.entity';
import { EnterpriseStatus } from '@src/common/enums';
import { enterpriseStatusTemplate } from './templates/enterprise-status.html';

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

    async sendApplicationStatusMail(
        username: string,
        email: string,
        jobTitle: string,
        companyName: string,
        status: NotificationType.APPLICATION_ACCEPTED | NotificationType.APPLICATION_REJECTED,
        message?: string
    ): Promise<boolean> {
        const statusText = status === NotificationType.APPLICATION_ACCEPTED ? 'Approved' : 'Rejected';
        const statusColor = status === NotificationType.APPLICATION_ACCEPTED ? '#28a745' : '#dc3545';

        const mail = applicationStatusMail
            .replace(/--ProjectName--/g, process.env.PROJECT_NAME)
            .replace(/--ProjectLogo--/g, process.env.PROJECT_LOGO_URL)
            .replace(/--ProjectLink--/g, process.env.PROJECT_URL)
            .replace(/--ProjectAddress--/g, process.env.PROJECT_ADDRESS)
            .replace(/--Socials--/g, this.socials)
            .replace(/--Username--/g, username)
            .replace(/--JobTitle--/g, jobTitle)
            .replace(/--CompanyName--/g, companyName)
            .replace(/--ApplicationStatus--/g, statusText)
            .replace(/--StatusColor--/g, statusColor)
            .replace(/--FeedbackMessage--/g, message || 'No additional feedback provided.');

        const mailOptions: Mail.Options = {
            from: `"${process.env.MAILER_DEFAULT_NAME}" <${process.env.MAILER_DEFAULT_EMAIL}>`,
            to: email,
            subject: `Your Application for ${jobTitle} at ${companyName} has been ${statusText}`,
            html: mail,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Application status email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.warn(`Mail sending failed: ${error.message}`);
            return false;
        }
    }

    async sendNotificationJobExpiredMail(data: JobExpiredData): Promise<boolean> {
        const mail = jobExpirationMail
            .replace(/--ProjectLink--/g, process.env.PROJECT_URL)
            .replace(/--ProjectLogo--/g, process.env.PROJECT_LOGO_URL)
            .replace(/--ProjectName--/g, process.env.PROJECT_NAME)
            .replace(/--EnterpriseName--/g, data.enterprise.name)
            .replace(/--JobTitle--/g, data.jobName)
            .replace(/--JobID--/g, data.jobId)
            .replace(/--ExpirationDate--/g, new Date(data.deadline).toLocaleDateString())
            .replace(/--DashboardLink--/g, '')
            .replace(/--ProjectAddress--/g, process.env.PROJECT_ADDRESS)
            .replace(/--Socials--/g, this.socials);

        const mailOptions = {
            from: `"${process.env.MAILER_DEFAULT_NAME}" <${process.env.MAILER_DEFAULT_EMAIL}>`,
            to: data.enterprise.email, // list of receivers (separated by ,)
            subject: `Your ${process.env.PROJECT_NAME} Job Listing has Expired`,
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
        )
            .then((result) => {
                this.logger.log(`Job expired email sent to ${data.enterprise.email}`);
                return result;
            })
            .catch((error) => {
                this.logger.error(`Failed to send job expired email: ${error.message}`);
                return false;
            });
    }

    /**
     * Send email notification when a job is closed by admin or other reasons
     */
    async sendJobClosureNotificationMail(
        email: string,
        jobName: string,
        jobId: string,
        enterpriseName: string,
        reason: string
    ): Promise<boolean> {
        const mail = jobClosureMail
            .replace(/--ProjectLink--/g, process.env.PROJECT_URL)
            .replace(/--ProjectLogo--/g, process.env.PROJECT_LOGO_URL)
            .replace(/--ProjectName--/g, process.env.PROJECT_NAME)
            .replace(/--EnterpriseName--/g, enterpriseName)
            .replace(/--JobTitle--/g, jobName)
            .replace(/--JobID--/g, jobId)
            .replace(/--ClosureReason--/g, reason)
            .replace(/--DashboardLink--/g, process.env.CLIENT_URL + process.env.ENTERPRISE_JOB_DASHBOARD)
            .replace(/--ProjectAddress--/g, process.env.PROJECT_ADDRESS)
            .replace(/--Socials--/g, this.socials);

        const mailOptions: Mail.Options = {
            from: `"${process.env.MAILER_DEFAULT_NAME}" <${process.env.MAILER_DEFAULT_EMAIL}>`,
            to: email,
            subject: `Your ${process.env.PROJECT_NAME} Job Listing has been Closed`,
            html: mail,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Job closure email sent to ${email}`);
            return true;
        } catch (error) {
            this.logger.error(`Mail sending failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Sends a notification to the enterprise when their job posting has been reopened by an admin
     * @param to - Enterprise email address
     * @param jobTitle - Title of the job that has been reopened
     * @param jobId - ID of the job that has been reopened
     * @param enterpriseName - Name of the enterprise
     */
    async sendJobReopenedNotificationMail(
        to: string,
        jobTitle: string,
        jobId: string,
        enterpriseName: string
    ): Promise<boolean> {
        const mail = reopenJobMail
            .replace(/--ProjectLink--/g, process.env.PROJECT_URL)
            .replace(/--ProjectLogo--/g, process.env.PROJECT_LOGO_URL)
            .replace(/--ProjectName--/g, process.env.PROJECT_NAME)
            .replace(/--EnterpriseName--/g, enterpriseName)
            .replace(/--JobTitle--/g, jobTitle)
            .replace(/--JobID--/g, jobId)
            .replace(/--DashboardLink--/g, process.env.CLIENT_URL + process.env.ENTERPRISE_JOB_DASHBOARD)
            .replace(/--ProjectAddress--/g, process.env.PROJECT_ADDRESS)
            .replace(/--Socials--/g, this.socials);

        const mailOptions: Mail.Options = {
            from: `"${process.env.MAILER_DEFAULT_NAME}" <${process.env.MAILER_DEFAULT_EMAIL}>`,
            to: to,
            subject: `Your job posting "${jobTitle}" has been reopened on ${process.env.PROJECT_NAME}`,
            html: mail,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Job reopened notification sent to ${to} for job ${jobId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send job reopened notification email: ${error.message}`);
            return false;
        }
    }

    /**
     * Send email to enterprise when their registration status is updated.
     */
    async sendEnterpriseStatusMail(
        emails: string[],
        enterpriseName: string,
        status: EnterpriseStatus,
        reason?: string
    ): Promise<boolean> {
        let subject = '';
        let message = '';

        switch (status) {
            case EnterpriseStatus.ACTIVE:
                subject = `Your Enterprise Registration is Approved`;
                message = `Congratulations, ${enterpriseName}! Your enterprise registration has been approved. You can now access all features.`;
                break;
            case EnterpriseStatus.BLOCKED:
                subject = `Your Enterprise Registration is Blocked`;
                message = `Dear ${enterpriseName}, your enterprise registration has been blocked. Please contact support for more information.`;
                break;
            case EnterpriseStatus.PENDING:
                subject = `Your Enterprise Registration is Pending`;
                message = `Dear ${enterpriseName}, your enterprise registration is still pending. We will notify you once it is reviewed.`;
                break;
            default:
                subject = `Your Enterprise Registration is Rejected`;
                message = `Dear ${enterpriseName}, unfortunately, your enterprise registration has been rejected. Please contact support for details.`;
        }

        const html = enterpriseStatusTemplate(
            process.env.PROJECT_NAME,
            process.env.PROJECT_LOGO_URL,
            process.env.PROJECT_URL,
            process.env.PROJECT_ADDRESS,
            this.socials,
            enterpriseName,
            subject,
            message,
            reason
        );

        const mailOptions: Mail.Options = {
            from: `"${process.env.MAILER_DEFAULT_NAME}" <${process.env.MAILER_DEFAULT_EMAIL}>`,
            to: emails,
            subject,
            html,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Enterprise status email sent to ${emails.join(', ')}`);
            return true;
        } catch (error) {
            this.logger.warn(`Mail sending failed: ${error.message}`);
            return false;
        }
    }
}
