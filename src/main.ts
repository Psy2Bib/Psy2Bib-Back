import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as nodeCrypto from 'crypto';


if (!(global as any).crypto) {
  (global as any).crypto = nodeCrypto as any;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 5500);
}
bootstrap();
