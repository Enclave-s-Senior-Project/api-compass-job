import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): void {
        console.log('CustomExceptionFilter triggered'); // Add this to check if filter runs

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        interface ExceptionResponse {
            message?: string | string[];
            error?: string;
        }

        let message: string;

        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        } else if (exceptionResponse && typeof exceptionResponse === 'object') {
            const responseObj = exceptionResponse as ExceptionResponse;
            message = Array.isArray(responseObj.message)
                ? responseObj.message.join(', ')
                : responseObj.message || 'An unknown error occurred';
        } else {
            message = 'An unknown error occurred';
        }

        console.error('Error occurred:', {
            status,
            message,
            exceptionResponse,
        });

        response.status(status).json({
            payload: {
                code: status,
                message_code: message || 'UNKNOWN_ERROR',
                message: exception.message,
            },
            timestamp: new Date().toISOString(),
        });
    }
}
