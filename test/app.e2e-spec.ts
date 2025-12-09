import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  // Déclaration de l’application Nest pour les tests end-to-end
  let app: INestApplication<App>;

  beforeEach(async () => {
    // Création d’un module de test qui importe tout AppModule
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Création d’une instance de l’application Nest basée sur le module
    app = moduleFixture.createNestApplication();

    // Initialisation réelle de l’application (middlewares, controllers, etc.)
    await app.init();
  });

  it('/ (GET)', () => {
    // Envoie une requête HTTP GET sur la racine "/"
    return request(app.getHttpServer())
      .get('/')
      .expect(200)         // Vérifie que le statut HTTP est 200
      .expect('Hello World!'); // Vérifie que la réponse renvoie "Hello World!"
  });
});
