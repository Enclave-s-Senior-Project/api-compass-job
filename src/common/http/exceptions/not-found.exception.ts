import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ErrorType } from '../../enums';

export class NotFoundUserException extends NotFoundException {
    constructor(errorType?: ErrorType) {
        console.log(errorType);
        super({
            message: errorType ?? ErrorType.NotFoundUserException,
        });
    }
}
