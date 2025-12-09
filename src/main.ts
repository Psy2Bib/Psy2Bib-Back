import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as nodeCrypto from 'crypto';

// Ajoute un fallback crypto global pour certains environnements (ex: WebSocket + JWT)
if (!(global as any).crypto) {
  (global as any).crypto = nodeCrypto;
}

async function bootstrap() {
  // Création de l'application NestJS à partir du module principal
  const app = await NestFactory.create(AppModule);

  // Active CORS pour permettre les requêtes depuis le frontend
  app.enableCors();

  // Configuration du builder Swagger (documentation API)
  const config = new DocumentBuilder()
    .setTitle('Psy2Bib API') // Titre affiché sur Swagger
    .setDescription(
      'API pour la gestion des rendez-vous entre psychologues et patients',
    ) // Description générale
    .setVersion('1.0') // Version de l’API
    // Ajout d’une authentification Bearer (JWT) dans Swagger
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'JWT-auth', // Nom du schéma utilisé ensuite dans @ApiBearerAuth()
    )
    // Tags affichés dans la doc
    .addTag('auth', 'Authentification et gestion des utilisateurs')
    .addTag('appointments', 'Gestion des rendez-vous et disponibilités')
    .addTag('patients', 'Gestion des profils patients')
    .build();

  // Génère le document Swagger à partir de la configuration
  const document = SwaggerModule.createDocument(app, config);

  // Expose Swagger à l’URL /api et mémorise l’auth si activée
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Démarre le serveur sur le port défini ou 5500 par défaut
  await app.listen(process.env.PORT ?? 5500);
}

// Lance l’application (sans attendre la promesse)
void bootstrap();
