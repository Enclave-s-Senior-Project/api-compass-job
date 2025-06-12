import { PickType } from '@nestjs/mapped-types';
import { CreateCvDto } from './create-cv.dto';

export class UpdateCvDto extends PickType(CreateCvDto, ['cvName', 'isPublished'] as const) {}
