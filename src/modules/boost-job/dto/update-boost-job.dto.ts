import { PartialType } from '@nestjs/swagger';
import { CreateBoostJobDto } from './create-boost-job.dto';

export class UpdateBoostJobDto extends PartialType(CreateBoostJobDto) {}
