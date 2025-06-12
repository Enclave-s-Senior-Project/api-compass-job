import { HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ErrorType } from '../../enums';
import { HttpErrorType } from '../http-error-type';

export class WarningException extends HttpException {
    constructor(message: string) {
        super(message ?? HttpErrorType[199], 199);
    }
}
