import { JobFilterDto } from './job-filter.dto';
import { PickType } from '@nestjs/mapped-types';

export class GetAllJob extends PickType(JobFilterDto, [
    'enterpriseId',
    'education',
    'maxWage',
    'minWage',
    'type',
    'experience',
    'majorityCategoryId',
    'industryCategoryId',
    'name',
    'location',
]) {}
