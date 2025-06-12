import { PartialType } from '@nestjs/swagger';
import { CreateApplyJobDto } from './create-apply-job.dto';

export class UpdateApplyJobDto extends PartialType(CreateApplyJobDto) {}
