/**
 * Service de gestion des utilisateurs
 * 
 * Ce service centralise toutes les opérations CRUD (Create, Read, Update, Delete)
 * sur l'entité User. Il sert de couche d'abstraction entre les controllers/services
 * et la base de données.
 * 
 * @module users
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

/**
 * Service UsersService
 * 
 * Fournit des méthodes pour manipuler les utilisateurs de manière sûre et cohérente.
 * Utilisé principalement par AuthService, mais aussi par d'autres modules qui ont besoin
 * d'accéder aux données utilisateur.
 * 
 * Design Pattern : Repository Pattern
 * On encapsule les appels TypeORM pour faciliter les tests et la maintenance.
 */
@Injectable()
export class UsersService {
  /**
   * Constructeur du service
   * 
   * @param usersRepo - Repository TypeORM injecté automatiquement par NestJS.
   *                    Permet d'effectuer des opérations sur la table 'users'.
   */
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * Trouve un utilisateur par son email
   * 
   * Méthode utilisée pour vérifier l'existence d'un compte ou récupérer
   * les infos publiques d'un utilisateur.
   * 
   * ⚠️ ATTENTION : Cette méthode n'inclut PAS le passwordHash ni le refreshTokenHash
   * car ils ont l'option `select: false` dans l'entité.
   * Pour récupérer ces champs sensibles, utiliser findByEmailWithPassword().
   * 
   * @param email - L'adresse email de l'utilisateur recherché
   * @returns L'utilisateur trouvé ou null si aucun utilisateur avec cet email
   * 
   * @example
   * ```typescript
   * const user = await usersService.findByEmail('alice@example.com');
   * if (user) {
   *   console.log(`Utilisateur trouvé : ${user.pseudo}`);
   * }
   * ```
   */
  findByEmail(email: string) {
    return this.usersRepo.findOne({
      where: { email },
    });
  }

  /**
   * Trouve un utilisateur par email AVEC les champs sensibles
   * 
   * Version spéciale de findByEmail qui inclut explicitement les champs
   * normalement masqués (passwordHash, refreshTokenHash).
   * 
   * ⚠️ USAGE RESTREINT : Cette méthode doit UNIQUEMENT être utilisée pour :
   * - La vérification du mot de passe lors du login
   * - La validation du refresh token
   * - Les opérations d'authentification
   * 
   * Ne JAMAIS exposer le résultat directement dans une API !
   * 
   * @param email - L'adresse email de l'utilisateur
   * @returns L'utilisateur avec tous les champs sensibles, ou null
   * 
   * @example
   * ```typescript
   * // Dans AuthService, lors du login
   * const user = await usersService.findByEmailWithPassword(email);
   * if (user && user.passwordHash === incomingHash) {
   *   // Authentification réussie
   * }
   * ```
   */
  findByEmailWithPassword(email: string) {
    return this.usersRepo.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordHash', // Normalement caché, explicitement demandé
        'role',
        'refreshTokenHash', // Normalement caché, explicitement demandé
        'pseudo',
      ],
    });
  }

  /**
   * Trouve un utilisateur par son ID
   * 
   * Méthode la plus rapide pour récupérer un utilisateur quand on connaît son ID
   * (par exemple après extraction du JWT).
   * 
   * Retourne les champs publics uniquement (pas de passwordHash).
   * 
   * @param id - L'UUID de l'utilisateur
   * @returns L'utilisateur trouvé ou null
   * 
   * @example
   * ```typescript
   * // Dans un guard après validation du JWT
   * const userId = jwtPayload.sub;
   * const user = await usersService.findById(userId);
   * ```
   */
  findById(id: string) {
    return this.usersRepo.findOne({
      where: { id },
    });
  }

  /**
   * Crée un nouvel utilisateur
   * 
   * Utilisée lors de l'inscription (register). Accepte un objet partiel
   * avec les champs nécessaires et crée l'entité en base de données.
   * 
   * Les champs créés automatiquement (id, createdAt, updatedAt) sont gérés
   * par TypeORM et PostgreSQL.
   * 
   * @param userData - Objet contenant les données du nouvel utilisateur
   *                   (email, passwordHash, role, pseudo, etc.)
   * @returns L'utilisateur créé avec son ID et timestamps
   * 
   * @example
   * ```typescript
   * const newUser = await usersService.create({
   *   email: 'alice@example.com',
   *   passwordHash: 'hash_from_frontend',
   *   role: UserRole.PATIENT,
   *   pseudo: 'Alice123',
   * });
   * console.log(`Utilisateur créé avec l'ID : ${newUser.id}`);
   * ```
   */
  create(userData: Partial<User>) {
    // create() instancie l'entité (objet en mémoire)
    const user = this.usersRepo.create(userData);
    // save() persiste l'entité dans la base de données
    return this.usersRepo.save(user);
  }

  /**
   * Met à jour le hash du refresh token
   * 
   * Cette méthode est cruciale pour la gestion des sessions JWT.
   * Elle est appelée dans plusieurs cas :
   * 
   * 1. Login réussi → stocke le nouveau refresh token hash
   * 2. Refresh token utilisé → rotation du token (optionnel)
   * 3. Logout → met le hash à null pour invalider le token
   * 
   * En mettant le hash à null, on invalide tous les refresh tokens existants
   * pour cet utilisateur. C'est une forme de "logout global" si besoin.
   * 
   * @param userId - L'UUID de l'utilisateur
   * @param hash - Le nouveau hash bcrypt du refresh token, ou null pour invalider
   * 
   * @example
   * ```typescript
   * // Login : stocker le nouveau refresh token
   * const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
   * await usersService.updateRefreshTokenHash(user.id, refreshTokenHash);
   * 
   * // Logout : invalider tous les tokens
   * await usersService.updateRefreshTokenHash(user.id, null);
   * ```
   */
  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.usersRepo.update(userId, { refreshTokenHash: hash });
  }

  /**
   * Met à jour le hash du mot de passe (hash côté serveur)
   * 
   * Utilisé pour migrer silencieusement les anciens comptes qui stockaient
   * le hash frontend tel quel, ou pour forcer un re-hash.
   */
  async updatePasswordHash(userId: string, passwordHash: string) {
    await this.usersRepo.update(userId, { passwordHash });
  }
}
