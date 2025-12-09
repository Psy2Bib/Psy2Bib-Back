import { Test, TestingModule } from '@nestjs/testing';
import { PsychologistsService } from './psychologists.service';

describe('PsychologistsService', () => {
  // Variable pour stocker l'instance du service testée
  let service: PsychologistsService;

  beforeEach(async () => {
    // Création d’un module de test NestJS pour le service
    const module: TestingModule = await Test.createTestingModule({
      providers: [PsychologistsService], // On ajoute le service à tester
      // Si le service dépendait d'autres providers, on pourrait les mocker ici
    }).compile(); // Compilation du module de test

    // Récupération de l'instance du service depuis le module de test
    service = module.get<PsychologistsService>(PsychologistsService);
  });

  it('should be defined', () => {
    // Test de base : vérifie que le service a bien été instancié
    expect(service).toBeDefined();
  });

  /**
   * 💡 Ici, on pourrait ajouter d'autres tests unitaires pour :
   * - la récupération d'un profil psychologue
   * - la mise à jour du profil via DTO
   * - la recherche de psychologues selon filtres (spécialités, langues, visibilité)
   * - gestion des erreurs (404, 401)
   */
});
