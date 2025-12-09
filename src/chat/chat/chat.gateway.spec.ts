import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  /**
   * Avant chaque test, on crée un module de test NestJS
   * et on récupère une instance du ChatGateway
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway], // Fournisseur du gateway à tester
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway); // Récupère l'instance pour les tests
  });

  /**
   * Test de base : vérifie que le ChatGateway est défini
   */
  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
