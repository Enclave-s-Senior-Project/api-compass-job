import { JobService } from './../../job/service/job.service';
import { BadRequestException, Injectable, MethodNotAllowedException, NotFoundException } from '@nestjs/common';
import { CreateApplyJobDto } from '../dtos/create-apply-job.dto';
import { ApplyJobRepository } from '../repositories/apply-job.repository';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { ApplyJobResponseDtoBuilder } from '../dtos';
import { JobErrorType, UserErrorType } from '@common/errors';
import { CvService } from '@modules/cv/services/cv.service';
import { CvErrorType } from '@common/errors/cv-error-type';
import { UserService } from '@modules/user/service';
import { AppliedJobEntity, FCMTokenEntity } from '@database/entities';
import { AppliedJobErrorType } from '@common/errors/applied-job-error-type';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { GlobalErrorType } from '@src/common/errors/global-error';
import { ValidationHelper } from '@src/helpers/validation.helper';
import { ApplyJobStatus } from '@src/database/entities/applied-job.entity';
import { UpdateApplicationStatusDto } from '../dtos/update-application-status.dto';
import { In } from 'typeorm';
import { WarningException } from '@src/common/http/exceptions/warning.exception';
import { NotificationService } from '@src/modules/notification/notification.service';
import { CreateNotificationDto } from '@src/modules/notification/dto/create-notification.dto';
import { NotificationType } from '@src/database/entities/notification.entity';
import { MailSenderService } from '@src/mail/mail.service';

@Injectable()
export class ApplyJobService {
    constructor(
        private readonly applyJobRepository: ApplyJobRepository,
        private readonly jobService: JobService,
        private readonly cvService: CvService,
        private readonly userService: UserService,
        private readonly notificationService: NotificationService,
        private readonly mailService: MailSenderService
    ) {}
    async applyJob(createApplyJobDto: CreateApplyJobDto, user: JwtPayload) {
        try {
            const { cvId, coverLetter, jobId } = createApplyJobDto;

            const [job, cv, profile, existingApply] = await Promise.all([
                this.jobService.getJobById(jobId),
                this.cvService.getCvByID(cvId),
                this.userService.getUserByAccountId(user.accountId),
                this.applyJobRepository.findOne({
                    where: {
                        job: { jobId },
                        profile: { profileId: user.profileId },
                    },
                }),
            ]);

            if (!job) {
                throw new NotFoundException(JobErrorType.JOB_NOT_FOUND);
            }

            if (job?.enterprise?.enterpriseId === user.enterpriseId) {
                throw new NotFoundException(JobErrorType.CAN_NOT_APPLY_OWN_JOB);
            }

            if (!cv) {
                throw new NotFoundException(CvErrorType.CV_NOT_FOUND);
            }
            if (!profile) {
                throw new NotFoundException(UserErrorType.USER_NOT_FOUND);
            }

            if (existingApply) {
                throw new NotFoundException(AppliedJobErrorType.ALREADY_APPLIED);
            }

            const applyJob = this.applyJobRepository.create({
                cv: { cvId: cv.cvId },
                coverLetter,
                job: { jobId: job.jobId },
                profile: { profileId: profile.profileId },
                status: ApplyJobStatus.PENDING,
            });

            await this.applyJobRepository.save(applyJob);
            return new ApplyJobResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async listCandidatesApplyJob(enterpriseId: string, jobId: string, pagination: PaginationDto) {
        const responseBuilder = new ApplyJobResponseDtoBuilder();
        try {
            const candidates = await this.applyJobRepository.find({
                skip: (Number(pagination.page) - 1) * Number(pagination.take),
                take: Number(pagination.take),
                where: { job: { jobId: jobId, enterprise: { enterpriseId: enterpriseId } } },
                relations: {
                    profile: true,
                    job: true,
                    cv: true,
                },
                select: {
                    appliedJobId: true,
                    coverLetter: true,
                    createdAt: true,
                    status: true,
                    updatedAt: true,
                    profile: {
                        profileId: true,
                        fullName: true,
                        experience: true,
                        education: true,
                        profileUrl: true,
                        gender: true,
                        nationality: true,
                    },
                    job: { type: true },
                    cv: { cvId: true, cvUrl: true, cvName: true },
                },
            });

            const grouped = {
                [ApplyJobStatus.PENDING]: [],
                [ApplyJobStatus.APPROVED]: [],
                [ApplyJobStatus.DENIED]: [],
            };

            for (const candidate of candidates) {
                grouped[candidate.status].push(candidate);
            }

            let responseColumns = [
                {
                    id: ApplyJobStatus.PENDING.toLowerCase(),
                    title: ApplyJobStatus.PENDING,
                    count: grouped.PENDING.length,
                    applicants: grouped.PENDING,
                },
                {
                    id: ApplyJobStatus.APPROVED.toLowerCase(),
                    title: ApplyJobStatus.APPROVED,
                    count: grouped.APPROVED.length,
                    applicants: grouped.APPROVED,
                },
                {
                    id: ApplyJobStatus.DENIED.toLowerCase(),
                    title: ApplyJobStatus.DENIED,
                    count: grouped.DENIED.length,
                    applicants: grouped.DENIED,
                },
            ];

            return responseBuilder.setValue(responseColumns).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async getAppliedJobByProfileId(profileId: string, pagination: PaginationDto) {
        try {
            if (!ValidationHelper.isValidateUUIDv4(profileId)) {
                throw new BadRequestException(GlobalErrorType.INVALID_ID);
            }

            const [appliedJobs, total] = await this.applyJobRepository.findAndCount({
                skip: Number(pagination.skip),
                take: Number(pagination.take),
                where: { profile: { profileId } },
                relations: ['job', 'job.addresses'],
                order: {
                    createdAt: pagination.order,
                },
            });

            const meta = new PageMetaDto({
                itemCount: total,
                pageOptionsDto: pagination,
            });

            return new ApplyJobResponseDtoBuilder().setValue(new PageDto<AppliedJobEntity>(appliedJobs, meta)).build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async updateApplicationStatus(payload: UpdateApplicationStatusDto, user: JwtPayload) {
        try {
            // Validate that the enterprise has permission to update these applications
            await this.validateApplicationUpdatePermissions(payload, user.enterpriseId);

            // Group applications by status
            const statusGroups = this.groupApplicationsByStatus(payload.applications);

            // Check for invalid pending status update
            if (statusGroups.pendingId.length > 0) {
                throw new WarningException(AppliedJobErrorType.NOT_ALLOWED_UPDATE_APPLICATION_APPROVED_OR_DENIED);
            }

            // Update application statuses in database
            await this.updateApplicationsInDatabase(statusGroups);

            // Get job information for notification
            const jobInfo = await this.getJobInfoForApplications(payload.applications[0].appliedJobId);

            // Get all user accounts for notifications
            const applicationAccounts = await this.getApplicationAccounts(payload.applications);

            // Send notifications for each application
            // Remove await for quick response to the client, notifications will be sent in the background
            this.sendApplicationStatusNotifications(payload.applications, applicationAccounts, jobInfo);

            return new ApplyJobResponseDtoBuilder().success().build();
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    private async validateApplicationUpdatePermissions(
        payload: UpdateApplicationStatusDto,
        enterpriseId: string
    ): Promise<void> {
        const isValidUpdate = await this.applyJobRepository.exists({
            where: {
                appliedJobId: In(payload.applications.map((app) => app.appliedJobId)),
                job: { enterprise: { enterpriseId } },
            },
            relations: {
                job: {
                    enterprise: true,
                },
            },
        });

        if (!isValidUpdate) {
            throw new MethodNotAllowedException(AppliedJobErrorType.NOT_ALLOWED_UPDATE_APPLICATION_STATUS);
        }
    }

    private groupApplicationsByStatus(applications: { appliedJobId: string; status: ApplyJobStatus }[]) {
        const statusGroups = {
            approvedId: [],
            deniedId: [],
            pendingId: [],
        };

        for (const item of applications) {
            if (item.status === ApplyJobStatus.APPROVED) {
                statusGroups.approvedId.push(item.appliedJobId);
            } else if (item.status === ApplyJobStatus.DENIED) {
                statusGroups.deniedId.push(item.appliedJobId);
            } else if (item.status === ApplyJobStatus.PENDING) {
                statusGroups.pendingId.push(item.appliedJobId);
            }
        }

        return statusGroups;
    }

    private async updateApplicationsInDatabase(statusGroups: {
        approvedId: string[];
        deniedId: string[];
        pendingId: string[];
    }): Promise<void> {
        const updatePromises = [];

        if (statusGroups.deniedId.length > 0) {
            updatePromises.push(
                this.applyJobRepository.update(
                    { appliedJobId: In(statusGroups.deniedId) },
                    { status: ApplyJobStatus.DENIED }
                )
            );
        }

        if (statusGroups.approvedId.length > 0) {
            updatePromises.push(
                this.applyJobRepository.update(
                    { appliedJobId: In(statusGroups.approvedId) },
                    { status: ApplyJobStatus.APPROVED }
                )
            );
        }

        await Promise.all(updatePromises);
    }

    private async getJobInfoForApplications(sampleAppliedJobId: string) {
        return this.applyJobRepository.findOne({
            where: {
                appliedJobId: sampleAppliedJobId,
            },
            relations: {
                job: {
                    enterprise: true,
                },
            },
            select: {
                job: {
                    jobId: true,
                    name: true,
                    enterprise: {
                        name: true,
                    },
                },
            },
        });
    }

    private async getApplicationAccounts(applications: { appliedJobId: string; status: ApplyJobStatus }[]) {
        // Get all applied job IDs
        const appliedJobIds = applications.map((app) => app.appliedJobId);

        // Fetch all accounts in a single query
        const appliedJobs = await this.applyJobRepository.find({
            where: {
                appliedJobId: In(appliedJobIds),
            },
            relations: {
                profile: {
                    account: {
                        fcmTokens: true,
                    },
                },
            },
            select: {
                appliedJobId: true,
                profile: {
                    profileId: true,
                    fullName: true,
                    account: {
                        accountId: true,
                        email: true,
                        fcmTokens: {
                            isActive: true,
                            token: true,
                        },
                    },
                },
            },
        });

        // Create a map for quick lookup
        return new Map(
            appliedJobs.map((job) => [
                job.appliedJobId,
                {
                    accountId: job.profile.account.accountId,
                    email: job.profile.account.email,
                    fullName: job.profile.fullName,
                    fcmTokens: job.profile.account.fcmTokens,
                },
            ])
        );
    }

    private async sendApplicationStatusNotifications(
        applications: { appliedJobId: string; status: ApplyJobStatus }[],
        accountMap: Map<string, any>,
        jobInfo: any
    ): Promise<void> {
        const notificationPromises = applications.map(async (item) => {
            const { accountId } = accountMap.get(item.appliedJobId);
            const notificationType =
                item.status === ApplyJobStatus.APPROVED
                    ? NotificationType.APPLICATION_ACCEPTED
                    : NotificationType.APPLICATION_REJECTED;

            const notification = await this.createNotificationApplication(notificationType, {
                accountId,
                link: `${process.env.CLIENT_URL}${process.env.APPLIED_JOB_PAGE_CLIENT_PATH}`,
                jobName: jobInfo.job.name,
            });

            const { email, fcmTokens, fullName } = accountMap.get(item.appliedJobId);

            // Send email notification
            this.mailService.sendApplicationStatusMail(
                fullName,
                email,
                jobInfo.job.name,
                jobInfo.job.enterprise.name,
                notificationType,
                notification.message
            );

            // Send push notification
            this.notificationService.sendNotificationToMany(
                { ...notification, message: notification.title, title: notification.notificationId },
                fcmTokens.map((token: Pick<FCMTokenEntity, 'token' | 'tokenId'>) => token.token)
            );
        });

        await Promise.all(notificationPromises);
    }

    async createNotificationApplication(
        type: NotificationType.APPLICATION_ACCEPTED | NotificationType.APPLICATION_REJECTED,
        payload: Pick<CreateNotificationDto, 'accountId' | 'link'> & { jobName: string }
    ) {
        try {
            const isAccepted = type === NotificationType.APPLICATION_ACCEPTED;
            const status = isAccepted ? 'accepted' : 'rejected';
            const emoji = isAccepted ? '🎉' : '📝';

            const notificationPayload = {
                ...payload,
                type,
                title: `${emoji} Application for ${payload.jobName}`,
                message: `Your application for ${payload.jobName} has been ${status}. ${
                    isAccepted
                        ? 'Congratulations! The employer would like to proceed with your application.'
                        : 'Thank you for your interest. You may continue exploring other opportunities.'
                }`,
            };

            const notification = await this.notificationService.create(notificationPayload);

            return notification;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
