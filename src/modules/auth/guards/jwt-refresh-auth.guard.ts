import { Reflector } from '@nestjs/core';
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { InvalidTokenException } from '../../../common/http/exceptions';
import { TokenService } from '../services';
import { TokenType } from '../enums';
import { SKIP_AUTH } from '../constants';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {}
