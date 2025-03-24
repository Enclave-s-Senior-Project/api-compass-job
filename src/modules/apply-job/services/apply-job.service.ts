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
            const [candidates, total] = await this.applyJobRepository.findAndCount({
                skip: (Number(pagination.page) - 1) * Number(pagination.take),
                take: Number(pagination.take),
                where: { job: { jobId: id } },
                relations: ['profile'],
            });
            const meta = new PageMetaDto({
                pageOptionsDto: pagination,
                itemCount: total,
            });
            if (!candidates) {
                throw new ApplyJobResponseDtoBuilder()
                    .badRequestContent(AppliedJobErrorType.APPLIED_JOB_NOT_FOUND)
                    .build();
            }
            return new ApplyJobResponseDtoBuilder().setValue(new PageDto<AppliedJobEntity>(candidates, meta)).build();
        } catch (error) {
            console.log(error);
            throw new BadRequestException('Failed to list candidates. Please check the provided data.');
        }
    }
}
