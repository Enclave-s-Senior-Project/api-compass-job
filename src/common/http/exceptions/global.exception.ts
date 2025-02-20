import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        let message = 'An unknown error occurred';

        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse; // If it's a simple string message
        } else if (typeof exceptionResponse === 'object' && exceptionResponse && 'message' in exceptionResponse) {
            // If message is an array or string inside the response object
            message = (exceptionResponse as any).message;
        }

        response.status(status).json({
            payload: {
                code: status,
                message_code: exception.message || 'UNKNOWN_ERROR',
                message,
            },
            timestamp: Date.now(),
        });
    }
}
