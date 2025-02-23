import { JobService } from './../../job/service/job.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateApplyJobDto } from '../dto/create-apply-job.dto';
import { UpdateApplyJobDto } from '../dto/update-apply-job.dto';
import { ApplyJobRepository } from '../repositories/apply-job.repository';
import { JwtPayload } from '@common/dtos';
import { ApplyJobResponseDto, ApplyJobResponseDtoBuilder } from '../dto';
import { JobErrorType, UserErrorType } from '@common/errors';
import { CvService } from '@modules/cv/services/cv.service';
import { CvErrorType } from '@common/errors/cv-error-type';
import { UserService } from '@modules/user/service';

@Injectable()
export class ApplyJobService {
    constructor(
        private readonly applyJobRepository: ApplyJobRepository,
        private readonly jobService: JobService,
        private readonly cvService: CvService,
        private readonly userService: UserService
    ) {}
    async doApplyJob(createApplyJobDto: CreateApplyJobDto, user: JwtPayload) {
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

    findAll() {
        return `This action returns all applyJob`;
    }

    findOne(id: number) {
        return `This action returns a #${id} applyJob`;
    }

    update(id: number, updateApplyJobDto: UpdateApplyJobDto) {
        return `This action updates a #${id} applyJob`;
    }

    remove(id: number) {
        return `This action removes a #${id} applyJob`;
    }
}
