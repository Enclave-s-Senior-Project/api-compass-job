import { ErrorType } from '@common/enums';
import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common';

export class ErrorCatchHelper {
    private static logger = new Logger(ErrorCatchHelper.name);
    public static serviceCatch(error: any) {
        // Only log error in non-production environments
        this.logger.error('Error in service:', { ...error });
        console.table(error);

        if (error instanceof HttpException) {
            return error;
        }
        return new InternalServerErrorException(ErrorType.InternalErrorServer);
    }
}
