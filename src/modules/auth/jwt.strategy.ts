// import { UsersRepository } from '@modules/admin/access/users/users.repository';
import { UserStatus } from '@admin/access/users/user-status.enum';
import { UserEntity } from '@admin/access/users/user.entity';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
// import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './dtos';
import {
  DisabledUserException,
  InvalidCredentialsException,
} from '../../common/http/exceptions';
import { ErrorType } from '../../common/enums';

@Injectable()
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    // @InjectRepository(UsersRepository)
    // private userRepository: UsersRepository,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<any> {
    const user: any = payload.id;
    // const user = await this.userRepository.findUserByUsername(userId);
    if (!user) {
      throw new InvalidCredentialsException();
    }
    if (user.status === UserStatus.Inactive) {
      throw new DisabledUserException(ErrorType.InactiveUser);
    }
    if (user.status === UserStatus.Blocked) {
      throw new DisabledUserException(ErrorType.BlockedUser);
    }
    return {
      user,
      role: ['admin', 'user'],
    };
  }
}
