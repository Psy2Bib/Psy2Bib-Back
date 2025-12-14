/**
 * DTO (Data Transfer Object) pour l'inscription
 * 
 * Ce DTO définit la structure des données attendues lors de l'inscription
 * d'un nouvel utilisateur (patient ou psychologue).
 * 
 * Il utilise class-validator pour valider automatiquement les données reçues,
 * et Swagger pour générer la documentation API interactive.
 * 
 * @module auth/dto
 */

import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

/**
 * Classe RegisterDto - Données d'inscription
 * 
 * Cette classe valide que les données envoyées par le client sont correctes
 * avant de les traiter. Si une validation échoue, NestJS renvoie automatiquement
 * une erreur 400 Bad Request avec les détails du problème.
 * 
 * Architecture Zero-Knowledge :
 * Les champs encryptedMasterKey, salt et encryptedProfile sont des blobs
 * chiffrés côté client. Le backend ne les déchiffre jamais.
 */
export class RegisterDto {
  /**
   * Adresse email de l'utilisateur
   * 
   * Validation :
   * - Doit être un email valide (format vérifié par @IsEmail)
   * - Sera vérifié en base pour l'unicité (dans le service)
   * 
   * Utilisation :
   * - Identifiant de connexion
   * - Communication avec l'utilisateur
   */
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "Adresse email de l'utilisateur",
  })
  @IsEmail()
  email: string;

  /**
   * Hash du mot de passe
   * 
   * ⚠️ IMPORTANT : Architecture Zero-Knowledge
   * Ce champ contient un hash déjà calculé par le frontend.
   * Le backend ne reçoit JAMAIS le mot de passe en clair.
   * 
   * Validation :
   * - Doit être une chaîne de caractères
   * - Minimum 8 caractères (pour éviter les hashs trop courts/invalides)
   * 
   * Le frontend peut utiliser :
   * - bcrypt (ex: $2a$12$abcd...)
   * - argon2 (ex: $argon2id$v=19$...)
   * - ou tout autre algorithme sécurisé
   * 
   * Le backend se contente de stocker ce hash tel quel.
   */
  @ApiProperty({
    example: 'hashedPassword123',
    description: 'Hash du mot de passe (minimum 8 caractères)',
  })
  @IsString()
  @MinLength(8)
  passwordHash: string;

  /**
   * Pseudo/nom d'utilisateur
   * 
   * Validation :
   * - Doit être une chaîne de caractères
   * - Doit être unique (vérifié en base)
   * 
   * Utilisation :
   * - Nom affiché dans l'application
   * - Peut servir d'anonymat relatif pour les patients
   * - Important pour l'identité publique des psychologues
   */
  @ApiProperty({ 
    example: 'john_doe42', 
    description: "Pseudo unique de l'utilisateur" 
  })
  @IsString()
  pseudo: string;

  /**
   * Clé maîtresse chiffrée (patients uniquement)
   * 
   * Architecture Zero-Knowledge :
   * Cette clé maîtresse est utilisée pour chiffrer/déchiffrer toutes les
   * données sensibles du patient. Elle est elle-même chiffrée avec une clé
   * dérivée du mot de passe de l'utilisateur.
   * 
   * Workflow :
   * 1. Frontend : mot de passe → dérivation KDF → clé de chiffrement
   * 2. Frontend : génération d'une clé maîtresse aléatoire
   * 3. Frontend : chiffrement de la clé maîtresse avec la clé dérivée
   * 4. Frontend : envoi du blob chiffré au backend
   * 5. Backend : stockage du blob (sans jamais pouvoir le déchiffrer)
   * 
   * Optionnel : requis pour les PATIENT, ignoré pour les PSY
   */
  @ApiPropertyOptional({
    example: 'encryptedMasterKey123',
    description: 'Clé maître chiffrée (patient uniquement)',
  })
  @IsOptional()
  @IsString()
  encryptedMasterKey?: string;

  /**
   * Sel cryptographique (patients uniquement)
   * 
   * Le sel est une valeur aléatoire utilisée dans la fonction de dérivation
   * de clé (KDF) pour générer la clé de chiffrement à partir du mot de passe.
   * 
   * Pourquoi un sel ?
   * - Empêche les attaques par rainbow tables
   * - Garantit que deux utilisateurs avec le même mot de passe auront
   *   des clés différentes
   * - Rend les attaques par dictionnaire beaucoup plus coûteuses
   * 
   * Le sel est stocké en clair côté serveur car il n'est pas secret.
   * Il est nécessaire pour recalculer la clé de déchiffrement lors du login.
   */
  @ApiPropertyOptional({ 
    example: 'salt123', 
    description: 'Salt pour le chiffrement (patient)' 
  })
  @IsOptional()
  @IsString()
  salt?: string;

  /**
   * Profil utilisateur chiffré (patients uniquement)
   * 
   * Ce blob contient toutes les données médicales sensibles du patient :
   * - Antécédents médicaux
   * - Notes personnelles
   * - Historique de consultations
   * - Informations privées
   * 
   * Le profil est chiffré côté client avec la clé maîtresse.
   * Le backend ne peut jamais le lire, il ne fait que le stocker.
   * 
   * Format typique : JSON chiffré avec AES-GCM, encodé en base64
   */
  @ApiPropertyOptional({
    example: 'encryptedProfile123',
    description: 'Profil utilisateur chiffré (patient)',
  })
  @IsOptional()
  @IsString()
  encryptedProfile?: string;

  /**
   * Rôle de l'utilisateur
   * 
   * Détermine le type de compte à créer :
   * - PATIENT : Utilisateur cherchant une aide psychologique
   * - PSY : Psychologue offrant ses services
   * - ADMIN : Administrateur (généralement créé manuellement)
   * 
   * Par défaut : PATIENT
   * 
   * Important :
   * - Les comptes PSY devraient nécessiter une vérification (diplômes, ADELI)
   * - En production, limiter la création de PSY à un processus validé
   */
  @ApiPropertyOptional({
    enum: UserRole,
    description: "Rôle de l'utilisateur (PSY ou PATIENT)",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
