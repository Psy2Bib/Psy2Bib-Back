import { Test, TestingModule } from '@nestjs/testing';
import { PsychologistsController } from './psychologists.controller';

describe('PsychologistsController', () => {
  // Variable pour stocker l'instance du controller testée
  let controller: PsychologistsController;

  beforeEach(async () => {
    // Création d'un module de test NestJS pour le controller
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PsychologistsController], // On ajoute le controller à tester
    }).compile(); // Compilation du module de test

    // Récupération de l'instance du controller depuis le module de test
    controller = module.get<PsychologistsController>(PsychologistsController);
  });

  it('should be defined', () => {
    // Test de base : vérifie que le controller a bien été instancié
    expect(controller).toBeDefined();
  });

  /**
   * Ici, on pourrait ajouter d'autres tests unitaires pour :
   * - vérifier les méthodes de récupération des profils
   * - tester la mise à jour d'un profil psychologue
   * - gérer les cas d'erreur ou les retours spécifiques
   */
});
