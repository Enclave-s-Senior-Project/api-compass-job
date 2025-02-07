// import { UsersRepository } from '@modules/admin/access/users/users.repository';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
// import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './dtos';
import { DisabledUserException, InvalidCredentialsException } from '../../common/http/exceptions';
import { ErrorType } from '../../common/enums';
import { UserStatus } from '@database/entities/account.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('ACCESS_TOKEN_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPayload): Promise<any> {
        const user: any = payload.accountId;
        // const user = await this.userRepository.findUserByUsername(userId);
        if (!user) {
            throw new InvalidCredentialsException();
        }
        if (user.status === UserStatus.INACTIVE) {
            throw new DisabledUserException(ErrorType.InactiveUser);
        }
        if (user.status === UserStatus.BLOCKED) {
            throw new DisabledUserException(ErrorType.BlockedUser);
        }
        return {
            user,
            role: ['ADMIN', 'USER'],
        };
    }
}
