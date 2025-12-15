/**
 * Entité User - Représentation des utilisateurs dans la base de données
 * 
 * Cette entité est au cœur du système d'authentification et de gestion des rôles.
 * Elle stocke les informations de base de tous les utilisateurs (patients, psychologues, admins).
 * 
 * Note importante sur la sécurité :
 * Le password hash est généré côté client (ex: Argon2) puis re-hashé côté serveur avec bcrypt.
 * Le backend ne voit jamais le mot de passe en clair.
 * 
 * @module users
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Énumération des rôles utilisateur
 * 
 * L'application Psy2Bib distingue trois types d'utilisateurs :
 * - PATIENT : Utilisateur cherchant une aide psychologique
 * - PSY : Psychologue offrant ses services
 * - ADMIN : Administrateur de la plateforme (gestion, modération)
 * 
 * Ce rôle détermine les permissions et les fonctionnalités accessibles.
 */
export enum UserRole {
  PATIENT = 'PATIENT',
  PSY = 'PSY',
  ADMIN = 'ADMIN',
}

/**
 * Entité User
 * 
 * Table principale stockant les utilisateurs de la plateforme.
 * Contient uniquement les données non-sensibles en clair.
 * 
 * Pour les patients, les données médicales sensibles sont stockées
 * dans une table séparée (Patient) avec chiffrement côté client.
 */
@Entity({ name: 'users' })
export class User {
  /**
   * Identifiant unique de l'utilisateur
   * 
   * UUID généré automatiquement par PostgreSQL.
   * Les UUIDs sont préférables aux IDs auto-incrémentés pour :
   * - Meilleure sécurité (non prévisibles)
   * - Facilite la fusion de bases de données
   * - Évite les conflits lors de réplications
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Adresse email de l'utilisateur
   * 
   * Utilisée pour :
   * - L'authentification (login)
   * - La récupération de compte
   * - Les notifications importantes
   * 
   * Contraintes :
   * - Unique (un email = un compte)
   * - Indexée pour des recherches rapides
   * - Longueur max : 255 caractères
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  /**
   * Hash du mot de passe
   * 
   * ⚠️ IMPORTANT : Architecture Zero-Knowledge + double hashing
   * - Le hash est généré côté CLIENT (ex: Argon2) et envoyé au backend.
   * - Le backend re-hash ce hash avec bcrypt avant stockage.
   * - Le serveur ne connaît JAMAIS le mot de passe en clair.
   * 
   * Comportement spécial :
   * - select: false => Ce champ n'est JAMAIS retourné par défaut dans les requêtes
   * - Il faut explicitement le demander avec { select: ['passwordHash'] }
   * - Ça évite les fuites accidentelles de hash dans les réponses API
   * 
   * Le frontend peut utiliser bcrypt, argon2, ou tout autre algorithme de hashing.
   * Le backend fait juste une comparaison simple : hash_reçu === hash_stocké
   */
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false, // Sécurité : ne jamais inclure ce champ par défaut
  })
  passwordHash: string;

  /**
   * Rôle de l'utilisateur
   * 
   * Détermine les permissions et l'accès aux fonctionnalités :
   * - PATIENT : Peut chercher des psychologues, prendre RDV, envoyer des messages
   * - PSY : Peut gérer son agenda, ses disponibilités, recevoir des patients
   * - ADMIN : Accès à toutes les fonctionnalités + gestion de la plateforme
   * 
   * Par défaut, un nouvel utilisateur est PATIENT.
   * Le rôle PSY doit être vérifié/validé (ex: diplômes, numéro ADELI).
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  /**
   * Pseudo/nom d'utilisateur
   * 
   * Nom affiché publiquement dans l'application (surtout pour les psychologues).
   * Pour les patients, peut servir d'anonymat relatif.
   * 
   * Contraintes :
   * - Unique (pas de doublons)
   * - Indexé pour recherche rapide
   * - Longueur max : 100 caractères
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  pseudo: string;

  /**
   * Date de création du compte
   * 
   * Timestamp automatiquement défini lors de l'insertion en base.
   * Utile pour :
   * - Statistiques (nombre d'inscriptions par période)
   * - Conformité RGPD (durée de conservation des données)
   * - Tri des utilisateurs par ancienneté
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Date de dernière modification
   * 
   * Mise à jour automatiquement à chaque modification de l'entité.
   * Permet de suivre l'activité et détecter des comptes abandonnés.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Hash du refresh token JWT
   * 
   * Le refresh token permet d'obtenir un nouveau access token sans redemander
   * les identifiants. Pour la sécurité, on stocke un hash bcrypt du refresh token.
   * 
   * Workflow :
   * 1. Login réussi → génération d'un refresh token unique
   * 2. Hash bcrypt du token → stockage dans ce champ
   * 3. Client envoie le token → on compare avec bcrypt.compare()
   * 4. Logout ou rotation → on met ce champ à null
   * 
   * Sécurité :
   * - select: false => jamais exposé par défaut
   * - nullable: true => null quand l'utilisateur est déconnecté
   * - Permet d'invalider tous les tokens en changeant ce hash
   */
  @Column({
    name: 'refresh_token_hash',
    type: 'text',
    nullable: true,
    select: false, // Sécurité : sensible, jamais exposé
  })
  refreshTokenHash: string | null;
}
