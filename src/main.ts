/**
 * Point d'entrée principal de l'application Psy2Bib Backend
 * 
 * Ce fichier initialise l'application NestJS et configure tous les éléments
 * essentiels comme CORS, Swagger et le serveur HTTP.
 * 
 * @module main
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as nodeCrypto from 'crypto';

/**
 * Polyfill pour l'objet crypto global
 * 
 * Certaines dépendances (notamment les bibliothèques de chiffrement)
 * s'attendent à trouver un objet `crypto` dans le contexte global.
 * En environnement Node.js, on utilise le module natif 'crypto' pour
 * fournir cette API.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (!(global as any).crypto) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (global as any).crypto = nodeCrypto;
}

/**
 * Fonction de démarrage de l'application
 * 
 * Cette fonction asynchrone initialise l'application NestJS et configure :
 * - Le serveur HTTP principal
 * - CORS pour permettre les requêtes cross-origin depuis le frontend
 * - La documentation Swagger pour faciliter l'utilisation de l'API
 * - Les tags et métadonnées de l'API
 * 
 * L'application écoute sur le port défini dans la variable d'environnement PORT,
 * ou par défaut sur le port 5500.
 */
async function bootstrap() {
  // Création de l'instance NestJS avec le module racine
  const app = await NestFactory.create(AppModule);

  /**
   * Activation de CORS (Cross-Origin Resource Sharing)
   * 
   * Permet aux applications frontend (React Native, web, etc.) de
   * communiquer avec notre API même si elles sont hébergées sur
   * des domaines différents. Essentiel pour le développement et
   * la production de notre app mobile.
   */
  app.enableCors();

  /**
   * Configuration de la documentation Swagger
   * 
   * Swagger génère automatiquement une documentation interactive
   * de notre API. C'est super pratique pour tester les endpoints
   * et comprendre les structures de données attendues/retournées.
   */
  const config = new DocumentBuilder()
    // Métadonnées générales de l'API
    .setTitle('Psy2Bib API')
    .setDescription(
      'API pour la gestion des rendez-vous entre psychologues et patients',
    )
    .setVersion('1.0')
    
    /**
     * Configuration de l'authentification JWT dans Swagger
     * 
     * Permet d'ajouter le token JWT directement dans l'interface Swagger
     * pour tester les routes protégées. L'utilisateur n'a qu'à cliquer sur
     * le bouton "Authorize" et coller son token.
     */
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'JWT-auth', // Nom de référence pour les décorateurs @ApiBearerAuth()
    )
    
    /**
     * Tags pour organiser les endpoints dans Swagger
     * 
     * Les tags permettent de grouper les routes par thématique,
     * ce qui rend la documentation beaucoup plus lisible et navigable.
     */
    .addTag('auth', 'Authentification et gestion des utilisateurs')
    .addTag('appointments', 'Gestion des rendez-vous et disponibilités')
    .addTag('patients', 'Gestion des profils patients')
    .build();

  // Génération du document Swagger à partir de la configuration
  const document = SwaggerModule.createDocument(app, config);
  
  /**
   * Montage de l'interface Swagger sur la route /api
   * 
   * L'option persistAuthorization permet de conserver le token JWT
   * même après un rafraîchissement de la page, pratique en développement.
   * 
   * Une fois l'app lancée, la doc est accessible sur http://localhost:5500/api
   */
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Garde le token en mémoire entre les rechargements
    },
  });

  /**
   * Démarrage du serveur HTTP
   * 
   * Le port est défini par la variable d'environnement PORT,
   * ou par défaut 5500 si elle n'est pas définie.
   * En production Docker, on utilise généralement 3000.
   */
  await app.listen(process.env.PORT ?? 5500);
}

// Lancement de l'application
// Le 'void' indique qu'on n'attend pas la promesse (pattern NestJS standard)
void bootstrap();
