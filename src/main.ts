import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpResponseInterceptor, HttpExceptionFilter } from './common/http';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { SwaggerConfig } from './config';
import * as cookieParse from 'cookie-parser';
import helmet from 'helmet';
import { CustomExceptionFilter } from '@common/http/exceptions';
import * as morgan from 'morgan';

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule);
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
    app.use(compression());
    app.use(cookieParse());
    app.enableCors({
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        credentials: true,
    });
    app.enableVersioning();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new CustomExceptionFilter());
    app.useGlobalInterceptors(new HttpResponseInterceptor());
    app.setGlobalPrefix(AppModule.apiPrefix);
    SwaggerConfig(app, AppModule.apiVersion);
    app.use(helmet());
    await app.listen(AppModule.port);
    return AppModule.port;
};

bootstrap().then((port: number) => {
    Logger.log(`Application running on port: ${port}`, 'Main');
});
