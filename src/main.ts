import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as nodeCrypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (!(global as any).crypto) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (global as any).crypto = nodeCrypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer CORS pour le frontend
  app.enableCors();

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Psy2Bib API')
    .setDescription(
      'API pour la gestion des rendez-vous entre psychologues et patients',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentification et gestion des utilisateurs')
    .addTag('appointments', 'Gestion des rendez-vous et disponibilités')
    .addTag('patients', 'Gestion des profils patients')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 5500);
}
void bootstrap();
