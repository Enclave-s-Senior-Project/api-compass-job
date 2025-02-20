import { PartialType } from '@nestjs/swagger';
import { CreateEnterpriseDto } from './create-enterprise.dto';

export class UpdateEnterpriseDto extends PartialType(CreateEnterpriseDto) {}
