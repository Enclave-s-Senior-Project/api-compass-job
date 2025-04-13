import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpResponseInterceptor } from './common/http';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { SwaggerConfig } from './config';
import * as cookieParse from 'cookie-parser';
import helmet from 'helmet';
import { CustomExceptionFilter } from '@common/http/exceptions';
import * as morgan from 'morgan';
import * as session from 'express-session';
import * as passport from 'passport';
import { NestExpressApplication } from '@nestjs/platform-express';

const bootstrap = async () => {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Enable session support
    app.use(
        session({
            secret: process.env.PASSP0RT_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: true, // Requires HTTPS
                sameSite: 'none', // For cross-site redirects
                path: '/',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            },
        })
    );
    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Set up middleware
    app.set('trust proxy', 1); // trust first proxy
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
    app.use(compression());
    app.use(cookieParse());
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        credentials: true,
    });
    app.enableVersioning();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: true }));
    app.useGlobalFilters(new CustomExceptionFilter());
    app.useGlobalInterceptors(new HttpResponseInterceptor());
    app.setGlobalPrefix(AppModule.apiPrefix);
    app.use(helmet());

    SwaggerConfig(app, AppModule.apiVersion);
    await app.listen(AppModule.port);
    return AppModule.port;
};

bootstrap().then((port: number) => {
    Logger.log(`Application running on port: ${port}`, 'Main');
});
