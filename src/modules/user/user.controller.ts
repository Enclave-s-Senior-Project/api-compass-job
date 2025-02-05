import { Controller } from '@nestjs/common';
import { UserService } from './service/user.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller({
    path: 'user',
    version: '1',
})
export class UserController {
    constructor(private readonly userService: UserService) {}
}
