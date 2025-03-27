import { ErrorType } from '@common/enums';
import { HttpException, InternalServerErrorException } from '@nestjs/common';

export class ErrorCatchHelper {
    public static serviceCatch(error: any) {
        console.log(typeof error);
        if (error instanceof HttpException) {
            return error;
        }
        return new InternalServerErrorException(ErrorType.InternalErrorServer);
    }
}
