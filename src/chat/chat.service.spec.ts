import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    // Création d'un module de test isolé contenant uniquement ChatService
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService], // On déclare uniquement le service à tester
    }).compile();

    // Récupération de l'instance du service depuis le module de test
    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    // Vérifie que le service est instancié correctement
    expect(service).toBeDefined();
  });
});
