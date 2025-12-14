/**
 * DTO de réponse d'authentification
 * 
 * Ce DTO définit la structure des données renvoyées après une opération
 * d'authentification réussie (register, login, refresh).
 * 
 * Il contient tout ce dont le client a besoin pour fonctionner :
 * tokens, informations utilisateur, et blobs chiffrés (pour les patients).
 * 
 * @module auth/dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

/**
 * Classe AuthResponseDto - Réponse d'authentification
 * 
 * Cette réponse est standardisée et retournée par :
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/refresh
 * 
 * Le client peut ainsi traiter la réponse de manière uniforme.
 */
export class AuthResponseDto {
  /**
   * Token d'accès JWT
   * 
   * Courte durée de vie (ex: 15 minutes).
   * À inclure dans chaque requête API via l'en-tête :
   * Authorization: Bearer <accessToken>
   * 
   * Contient : { sub: userId, email, role }
   */
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: "Token d'accès JWT",
  })
  accessToken: string;

  /**
   * Token de rafraîchissement JWT
   * 
   * Longue durée de vie (ex: 7 jours).
   * À stocker de manière sécurisée (SecureStore, httpOnly cookie).
   * Utilisé uniquement pour obtenir un nouvel access token.
   * 
   * Important : Ne JAMAIS envoyer ce token dans les requêtes normales,
   * seulement pour POST /auth/refresh.
   */
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de rafraîchissement JWT',
  })
  refreshToken: string;

  /**
   * Clé maîtresse chiffrée (patients uniquement)
   * 
   * Blob chiffré stocké en base. Le client en a besoin pour
   * déchiffrer le profil médical et autres données sensibles.
   * 
   * null pour les psychologues et admins.
   */
  @ApiPropertyOptional({
    example: 'encryptedMasterKey123',
    description: 'Clé maître chiffrée (pour les patients)',
  })
  encryptedMasterKey?: string | null;

  /**
   * Sel cryptographique (patients uniquement)
   * 
   * Nécessaire pour recalculer la clé de déchiffrement
   * à partir du mot de passe lors du prochain login.
   */
  @ApiPropertyOptional({
    example: 'salt123',
    description: 'Salt de dérivation (pour les patients)',
  })
  salt?: string | null;

  /**
   * Profil chiffré (patients uniquement)
   * 
   * Contient les données médicales sensibles chiffrées.
   * Le client doit le déchiffrer localement avec la clé maîtresse.
   */
  @ApiPropertyOptional({
    example: 'encryptedProfile123',
    description: 'Profil chiffré (pour les patients)',
  })
  encryptedProfile?: string | null;

  /**
   * ID de l'utilisateur
   * 
   * UUID unique. Utile pour :
   * - Identifier l'utilisateur dans l'interface
   * - Faire des requêtes personnalisées
   * - Gérer les favoris, préférences, etc.
   */
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: "ID de l'utilisateur",
  })
  userId: string;

  /**
   * Rôle de l'utilisateur
   * 
   * Détermine les fonctionnalités accessibles :
   * - PATIENT : Chercher des psys, prendre RDV, messagerie
   * - PSY : Gérer agenda, disponibilités, recevoir patients
   * - ADMIN : Tout
   */
  @ApiProperty({
    enum: UserRole,
    example: UserRole.PATIENT,
    description: "Rôle de l'utilisateur",
  })
  role: UserRole;

  /**
   * Pseudo de l'utilisateur
   * 
   * Nom affiché dans l'application.
   */
  @ApiPropertyOptional({
    example: 'john_doe42',
    description: 'Pseudo unique utilisateur',
  })
  pseudo?: string;
}
