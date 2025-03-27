import { JobService } from './../../job/service/job.service';
import { BadRequestException, Injectable } from '@nestjs/common';
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
            const [job, cv, profile] = await Promise.all([
                this.jobService.getJobById(jobId),
                this.cvService.getCvByID(cvId),
                this.userService.getUserByAccountId(user.accountId),
            ]);
            if (!job) {
                return new ApplyJobResponseDtoBuilder().badRequestContent(JobErrorType.JOB_NOT_FOUND).build();
            }
            if (!cv) {
                return new ApplyJobResponseDtoBuilder().badRequestContent(CvErrorType.CV_NOT_FOUND).build();
            }
            if (!profile) {
                return new ApplyJobResponseDtoBuilder().badRequestContent(UserErrorType.USER_NOT_FOUND).build();
            }
            const applyJob = this.applyJobRepository.create({
                cv,
                coverLetter,
                job,
                profile,
            });
            await this.applyJobRepository.save(applyJob);
            return new ApplyJobResponseDtoBuilder().success().build();
        } catch (error) {
            throw new BadRequestException('Failed to do apply job. Please check the provided data.');
        }
    }

    async listCandidatesApplyJob(id: string, pagination: PaginationDto) {
        try {
            // Fetch candidates with pagination
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

            // Group candidates by status
            const groupedByStatus = candidates.reduce((acc, candidate) => {
                const statusKey = candidate.status.toLowerCase();
                if (!acc[statusKey]) {
                    acc[statusKey] = [];
                }
                acc[statusKey].push(candidate);
                return acc;
            }, {});

            // Define column titles based on status
            const columns: any[] = [
                {
                    id: 'pending',
                    title: 'Pending',
                    count: groupedByStatus['pending']?.length || 0,
                    applicants: (groupedByStatus['pending'] || []).map((candidate) => ({
                        id: candidate.appliedJobId,
                        name: candidate.profile.fullName,
                        position: candidate.job.name,
                        experience: candidate.job.experience ? `${candidate.job.experience} Years Experience` : 'N/A',
                        education: candidate.job.education || 'N/A',
                        applied: new Date(candidate.createdAt).toLocaleDateString(),
                        avatar: candidate.profile.profileUrl || '/placeholder.svg?height=40&width=40',
                    })),
                },
                {
                    id: 'approved',
                    title: 'Review', // Or "Approved" if that fits your use case better
                    count: groupedByStatus['approved']?.length || 0,
                    applicants: (groupedByStatus['approved'] || []).map((candidate) => ({
                        id: candidate.appliedJobId,
                        name: candidate.profile.fullName,
                        position: candidate.job.name,
                        experience: candidate.job.experience ? `${candidate.job.experience} Years Experience` : 'N/A',
                        education: candidate.job.education || 'N/A',
                        applied: new Date(candidate.createdAt).toLocaleDateString(),
                        avatar: candidate.profile.profileUrl || '/placeholder.svg?height=40&width=40',
                    })),
                },
                {
                    id: 'denied',
                    title: 'Denied',
                    count: groupedByStatus['denied']?.length || 0,
                    applicants: (groupedByStatus['denied'] || []).map((candidate) => ({
                        id: candidate.appliedJobId,
                        name: candidate.profile.fullName,
                        position: candidate.job.name,
                        experience: candidate.job.experience ? `${candidate.job.experience} Years Experience` : 'N/A',
                        education: candidate.job.education || 'N/A',
                        applied: new Date(candidate.createdAt).toLocaleDateString(),
                        avatar: candidate.profile.profileUrl || '/placeholder.svg?height=40&width=40',
                    })),
                },
            ];

            // Build the response
            return new ApplyJobResponseDtoBuilder().success().setValue(columns).build();
        } catch (error) {
            console.log(error);
            throw new BadRequestException('Failed to list candidates. Please check the provided data.');
        }
    }
}
