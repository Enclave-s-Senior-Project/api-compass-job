import { Controller } from '@nestjs/common';
import { EnterpriseService } from './service/enterprise.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Enterprise')
@Controller({
    path: 'enterprise',
    version: '1',
})
export class EnterpriseController {
    constructor(private readonly enterpriseService: EnterpriseService) {}
}
