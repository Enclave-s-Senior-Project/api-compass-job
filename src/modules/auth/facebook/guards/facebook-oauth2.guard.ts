import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FacebookOAuth2Guard extends AuthGuard('facebook') {
    constructor() {
        super();
    }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const activate = (await super.canActivate(context)) as boolean;
        const request = context.switchToHttp().getRequest();
        await super.logIn(request);
        return activate;
    }

    handleRequest(err, user, info, context) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
