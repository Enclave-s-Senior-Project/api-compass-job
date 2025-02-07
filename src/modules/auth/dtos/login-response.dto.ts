// import { UserResponseDto } from '../../admin/access/users/dtos';
// import { AuthAccessDto } from './auth-access.dto';
// import { TokenDto } from './token.dto';
import { BaseResponseDtoBuilder } from '@builder/response.builder';
import { BaseResponseDto } from '@common/dtos/response.dto';

export class LoginResponseDto extends BaseResponseDto {}

export class LoginResponseDtoBuilder extends BaseResponseDtoBuilder<LoginResponseDto> {
    constructor() {
        super(LoginResponseDto);
    }
}
