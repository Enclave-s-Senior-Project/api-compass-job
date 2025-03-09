import { UnauthorizedException } from '@nestjs/common';
import { ErrorType } from '../../enums';

export class InvalidCredentialsException extends UnauthorizedException {
    constructor() {
        super({
            message: ErrorType.InvalidCredentials,
        });
    }
}
