import { HttpException, InternalServerErrorException } from '@nestjs/common';

export class ErrorCatchHelper {
    public static serviceCatch(error: any) {
        if (error instanceof HttpException) {
            return error;
        }
        return new InternalServerErrorException();
    }
}
