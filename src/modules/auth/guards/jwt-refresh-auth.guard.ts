import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
    /**
     * Handle request and verify if exist an error or there's not user
     * @param error
     * @param user
     * @returns user || error
     */
    handleRequest(error, user) {
        if (error || !user) {
            throw new BadRequestException();
        }
        return user;
    }
}
