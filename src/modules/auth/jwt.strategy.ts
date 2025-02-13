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
import { UserService } from '@modules/user/service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('ACCESS_TOKEN_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPayload): Promise<any> {
        return {
            payload,
        };
    }
}
