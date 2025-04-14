import { JobService } from './../../job/service/job.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateApplyJobDto } from '../dtos/create-apply-job.dto';
import { ApplyJobRepository } from '../repositories/apply-job.repository';
import { JwtPayload, PageDto, PageMetaDto, PaginationDto } from '@common/dtos';
import { ApplyJobResponseDtoBuilder } from '../dtos';
import { JobErrorType, UserErrorType } from '@common/errors';
import { CvService } from '@modules/cv/services/cv.service';
import { CvErrorType } from '@common/errors/cv-error-type';
import { UserService } from '@modules/user/service';
import { AppliedJobEntity } from '@database/entities';
import { AppliedJobErrorType } from '@common/errors/applied-job-error-type';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { GlobalErrorType } from '@src/common/errors/global-error';
import { ValidationHelper } from '@src/helpers/validation.helper';
import { ApplyJobStatus } from '@src/database/entities/applied-job.entity';

@Injectable()
export class ApplyJobService {
    constructor(
        private readonly applyJobRepository: ApplyJobRepository,
        private readonly jobService: JobService,
        private readonly cvService: CvService,
        private readonly userService: UserService
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

    async listCandidatesApplyJob(id: string, pagination: PaginationDto) {
        try {
            const [candidates, total] = await this.applyJobRepository.findAndCount({
                skip: (Number(pagination.page) - 1) * Number(pagination.take),
                take: Number(pagination.take),
                where: { job: { jobId: id } },
                relations: ['profile', 'job'],
            });

            if (!candidates || candidates.length === 0) {
                throw new ApplyJobResponseDtoBuilder()
                    .badRequestContent(AppliedJobErrorType.APPLIED_JOB_NOT_FOUND)
                    .build();
            }
            console.log('Candidates:', candidates);
            const grouped = {
                [ApplyJobStatus.PENDING]: [],
                [ApplyJobStatus.APPROVED]: [],
                [ApplyJobStatus.DENIED]: [],
            };

            for (const candidate of candidates) {
                console.log('Candidate:', candidate);
                const applicant = {
                    id: candidate.profile?.profileId,
                    name: candidate.profile?.fullName || 'Unknown',
                    position: candidate.job.type || 'Not specified',
                    experience: candidate.profile?.experience || 'Not specified',
                    education: candidate.profile?.education || 'Not specified',
                    applied: candidate.createdAt?.toISOString() || new Date().toISOString(),
                    avatar: candidate.profile?.profileUrl || '',
                    gender: candidate.profile.gender,
                    nationality: candidate.profile.nationality,
                };

                grouped[candidate.status].push(applicant);
            }

            const responseColumns = [
                {
                    id: ApplyJobStatus.PENDING.toLowerCase(),
                    title: 'Pending',
                    count: grouped.PENDING.length,
                    applicants: grouped.PENDING,
                },
                {
                    id: ApplyJobStatus.APPROVED.toLowerCase(),
                    title: 'Approved',
                    count: grouped.APPROVED.length,
                    applicants: grouped.APPROVED,
                },
                {
                    id: ApplyJobStatus.DENIED.toLowerCase(),
                    title: 'Denied',
                    count: grouped.DENIED.length,
                    applicants: grouped.DENIED,
                },
            ];

            return new ApplyJobResponseDtoBuilder().success().setValue(responseColumns).build();
        } catch (error) {
            console.log(error);
            throw new BadRequestException('Failed to list candidates. Please check the provided data.');
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
}
