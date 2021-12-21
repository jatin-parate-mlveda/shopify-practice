import {NestFactory} from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import {AppModule} from './app.module';
import {NestExpressApplication} from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  await app.listen(3000);
}

bootstrap();
