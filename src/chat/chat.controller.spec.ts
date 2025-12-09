import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';

describe('ChatController', () => {
  let controller: ChatController;

  /**
   * Avant chaque test, on crée un module de test NestJS
   * et on récupère une instance du ChatController
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController], // Contrôleur à tester
    }).compile();

    controller = module.get<ChatController>(ChatController); // Récupère l'instance pour les tests
  });

  /**
   * Test de base : vérifie que le ChatController est défini
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
