// import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ErrorType } from '@common/enums';
import { InvalidCredentialsException, DisabledUserException } from '@common/http/exceptions';
import { UserStatus } from '@admin/access/users/user-status.enum';
import { omit } from 'lodash';
// import { UserEntity } from '@admin/access/users/user.entity';
import { AuthCredentialsRequestDto, LoginResponseDto, JwtPayload } from '../dtos';
import { TokenService } from './token.service';
import { HashHelper } from '@helpers';
// import { UserMapper } from '../users.mapper';
import { hardcodedUsers } from '../mocks/indentify-user.mock';

@Injectable()
export class AuthService {
    constructor(private tokenService: TokenService) {}

    /**
     * User authentication
     * @param authCredentialsDto {AuthCredentialsRequestDto}
     * @returns {Promise<LoginResponseDto>}
     */
    public async login({ username, password }: AuthCredentialsRequestDto): Promise<LoginResponseDto> {
        const user = hardcodedUsers.find((u) => u.username === username);
        if (!user) {
            throw new InvalidCredentialsException();
        }

        const passwordMatch = await HashHelper.compare(password, user.password);

        if (!passwordMatch) {
            throw new InvalidCredentialsException();
        }
        if (user.status == UserStatus.Blocked) {
            throw new DisabledUserException(ErrorType.BlockedUser);
        }
        if (user.status == UserStatus.Inactive) {
            throw new DisabledUserException(ErrorType.InactiveUser);
        }
        // payload ignore password using lodash
        const userPayload = omit(user, ['password', 'active']);
        console.log('userPayload', userPayload);
        const payload: JwtPayload = {
            id: userPayload.id,
            username: userPayload.username,
        };
        const token = await this.tokenService.generateAuthToken(payload);
        return {
            user: userPayload,
            token,
            access: {
                roles: user.roles.map((role) => ({ name: role })),
            },
        };
    }
}
