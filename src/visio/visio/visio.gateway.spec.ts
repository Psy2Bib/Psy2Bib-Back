import { Test, TestingModule } from '@nestjs/testing';
import { VisioGateway } from './visio.gateway';

describe('VisioGateway', () => {
  let gateway: VisioGateway;

  beforeEach(async () => {
    // Création d'un module de test NestJS
    // On fournit simplement le VisioGateway pour pouvoir l'instancier
    const module: TestingModule = await Test.createTestingModule({
      providers: [VisioGateway],
    }).compile();

    // Récupération de l'instance du gateway depuis le module de test
    gateway = module.get<VisioGateway>(VisioGateway);
  });

  it('should be defined', () => {
    // Test très basique : vérifie que l'instance a bien été créée
    expect(gateway).toBeDefined();
  });
});
