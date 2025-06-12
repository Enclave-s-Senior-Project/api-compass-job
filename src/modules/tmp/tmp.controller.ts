import { Controller } from '@nestjs/common';
import { TmpService } from './tmp.service';

@Controller('tmp')
export class TmpController {
    constructor(private readonly tmpService: TmpService) {}
}
