import { Controller } from '@nestjs/common';
import { RoleService } from './service/role.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller({
    path: 'user',
    version: '1',
})
export class RoleController {
    constructor(private readonly userService: RoleService) {}
}
