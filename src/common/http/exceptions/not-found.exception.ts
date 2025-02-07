import { UnauthorizedException } from '@nestjs/common';
import { ErrorType } from '../../enums';

export class NotFoundUserException extends UnauthorizedException {
    constructor(errorType: ErrorType) {
        super({
            errorType,
            message: 'User not found',
        });
    }
}
