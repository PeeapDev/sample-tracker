import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
// Import the COMPILED module: `nest build` (tsc) emits the decorator metadata
// that Nest's DI relies on. esbuild (used to bundle this function) does not emit
// that metadata, so we must never import from ../src here.
import { AppModule } from '../dist/app.module';

const server = express();
let ready: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
}

// Vercel invokes this for every request (see rewrites in vercel.json). The Nest
// app is bootstrapped once per warm instance and reused across invocations.
export default async function handler(req: express.Request, res: express.Response) {
  if (!ready) {
    ready = bootstrap();
  }
  await ready;
  server(req, res);
}
