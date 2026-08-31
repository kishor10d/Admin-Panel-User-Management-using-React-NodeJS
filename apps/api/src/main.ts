import 'reflect-metadata';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

  app.enableCors({ origin: webOrigin, credentials: true });
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (!request.cookies?.csrf_token) {
      response.cookie('csrf_token', randomBytes(32).toString('hex'), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.setGlobalPrefix('api');

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
