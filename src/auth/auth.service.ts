/**
 * Service d'authentification - Cœur de la sécurité de l'application
 * 
 * Ce service gère tout le cycle de vie de l'authentification :
 * - Inscription (register)
 * - Connexion (login)
 * - Rafraîchissement des tokens (refresh)
 * - Déconnexion (logout)
 * 
 * Architecture Zero-Knowledge :
 * - Le backend ne connaît JAMAIS les mots de passe en clair.
 * - Le frontend envoie un hash pré-calculé (ex: Argon2).
 * - Le backend stocke ce hash tel quel et le compare lors du login.
 * 
 * Les refresh tokens sont également hashés côté backend avec bcrypt.
 * 
 * @module auth
 */

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PatientsService } from '../patients/patients.service';
import { PsychologistsService } from '../psychologists/psychologists.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRole } from '../users/user.entity';

/**
 * Service AuthService
 * 
 * Responsable de toute la logique d'authentification de l'application.
 * Travaille en étroite collaboration avec UsersService, PatientsService et PsychologistsService.
 */
@Injectable()
export class AuthService {
  /**
   * Nombre de rounds bcrypt pour le hashing des refresh tokens
   * 
   * 12 rounds = bon équilibre entre sécurité et performance
   * - Plus c'est élevé, plus c'est sécurisé (mais plus lent)
   * - 12 rounds prend environ 200-300ms sur un serveur moderne
   * - Recommandé par l'OWASP pour 2024
   */
  private readonly rounds = 12;

  /**
   * Constructeur - Injection des dépendances
   * 
   * @param usersService - Gestion des utilisateurs (CRUD de base)
   * @param patientsService - Gestion des données chiffrées des patients
   * @param psychologistsService - Gestion des profils psychologues
   * @param jwtService - Service NestJS pour générer et valider les JWT
   * @param configService - Accès aux variables d'environnement (secrets JWT, durées, etc.)
   */
  constructor(
    private readonly usersService: UsersService,
    private readonly patientsService: PatientsService,
    private readonly psychologistsService: PsychologistsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Inscription d'un nouvel utilisateur
   * 
   * Cette méthode gère l'inscription complète d'un nouvel utilisateur,
   * qu'il soit patient ou psychologue. Elle crée :
   * 
   * 1. Un compte utilisateur (table users)
   * 2. Pour les PATIENTS : un dossier chiffré (table patients) avec les blobs Zero-Knowledge
   * 3. Pour les PSY : un profil psychologue vide et invisible (à compléter plus tard)
   * 4. Des tokens JWT (access + refresh) pour connexion automatique
   * 
   * Architecture Zero-Knowledge (patients) :
   * Le frontend envoie déjà les données chiffrées :
   * - encryptedMasterKey : Clé maîtresse chiffrée avec le mot de passe
   * - salt : Sel utilisé pour la dérivation de clé
   * - encryptedProfile : Profil médical chiffré (antécédents, notes, etc.)
   * 
   * Le backend ne fait que stocker ces blobs sans jamais pouvoir les déchiffrer.
   * 
   * @param dto - Données d'inscription (email, passwordHash, role, blobs chiffrés, etc.)
   * @returns Tokens JWT + données chiffrées + informations utilisateur
   * @throws ConflictException si l'email est déjà utilisé
   * 
   * @example
   * ```typescript
   * const response = await authService.register({
   *   email: 'patient@example.com',
   *   passwordHash: 'hash_calculé_par_le_frontend',
   *   pseudo: 'JohnD',
   *   role: UserRole.PATIENT,
   *   encryptedMasterKey: 'blob_chiffré_base64',
   *   salt: 'salt_base64',
   *   encryptedProfile: 'profil_chiffré_base64',
   * });
   * // Le client reçoit accessToken + refreshToken + blobs
   * ```
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Vérification : l'email est-il déjà utilisé ?
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Détermination du rôle (par défaut : PATIENT)
    const role: UserRole = dto.role ? dto.role : UserRole.PATIENT;

    /**
     * Création de l'utilisateur
     * 
     * POINT CRITIQUE : Pas de re-hash côté serveur
     * - Le frontend envoie déjà un hash (ex: Argon2) => le backend ne voit jamais le mot de passe.
     * - On stocke ce hash tel quel.
     */
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash: dto.passwordHash, // Hash frontend (ex: Argon2)
      pseudo: dto.pseudo,
      role,
    });

    // Variables pour stocker les blobs Zero-Knowledge (null par défaut)
    let encryptedMasterKey: string | null = null;
    let salt: string | null = null;
    let encryptedProfile: string | null = null;

    /**
     * Création du dossier patient chiffré
     * 
     * Si l'utilisateur s'inscrit en tant que PATIENT, on crée une entrée
     * dans la table patients avec tous les blobs chiffrés envoyés par le frontend.
     * 
     * Ces données sont stockées en base64 et ne peuvent être déchiffrées que
     * par le client qui possède le mot de passe.
     */
    if (role === UserRole.PATIENT) {
      const patient = await this.patientsService.createForUser(user, {
        encryptedMasterKey: dto.encryptedMasterKey ?? '',
        salt: dto.salt ?? '',
        encryptedProfile: dto.encryptedProfile ?? '',
      });

      // On récupère les blobs pour les renvoyer au client
      encryptedMasterKey = patient.encryptedMasterKey;
      salt = patient.salt;
      encryptedProfile = patient.encryptedProfile;
    } 
    /**
     * Création du profil psychologue
     * 
     * Si l'utilisateur s'inscrit en tant que PSY, on crée automatiquement
     * un profil psychologue vide et invisible.
     * 
     * Le psychologue pourra ensuite compléter son profil :
     * - Titre et description
     * - Spécialités (TCC, psychanalyse, etc.)
     * - Langues parlées
     * - Tarifs
     * 
     * Le profil reste invisible (isVisible: false) tant qu'il n'est pas complet.
     */
    else if (role === UserRole.PSY) {
      await this.psychologistsService.updateProfile(user.id, {
        isVisible: false, // Invisible par défaut
        title: 'Psychologue',
        description: '',
        specialties: [],
        languages: [],
        hourlyRate: 0,
      });
    }

    /**
     * Génération des tokens JWT
     * 
     * On génère deux tokens :
     * - Access Token : Courte durée (15 min), utilisé pour les requêtes API
     * - Refresh Token : Longue durée (7 jours), utilisé pour renouveler l'access token
     */
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    
    /**
     * Sécurisation du refresh token
     * 
     * On hash le refresh token avec bcrypt avant de le stocker en base.
     * Ça permet de :
     * - Vérifier la validité du token lors du refresh
     * - Invalider tous les tokens en cas de logout
     * - Protéger contre les fuites de BDD (le token brut ne peut pas être extrait)
     */
    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      this.rounds,
    );
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    /**
     * Réponse complète
     * 
     * On renvoie :
     * - Les tokens JWT (accès + refresh)
     * - L'ID et le pseudo de l'utilisateur
     * - Le rôle (PATIENT / PSY / ADMIN)
     * - Les blobs chiffrés (pour les patients)
     * 
     * Le frontend peut ainsi stocker ces données en local (SecureStore)
     * et commencer immédiatement à utiliser l'application.
     */
    return {
      ...tokens,
      userId: user.id,
      encryptedMasterKey,
      salt,
      encryptedProfile,
      role: user.role,
      pseudo: user.pseudo,
    };
  }

  /**
   * Validation d'un utilisateur avec son hash de mot de passe
   * 
   * Méthode interne utilisée lors du login pour vérifier les identifiants.
   * 
   * Architecture Zero-Knowledge :
   * - Le frontend envoie un hash pré-calculé (même hash qu'à l'inscription)
   * - On compare directement le hash envoyé avec celui stocké
   * 
   * Cette approche garantit que :
   * 1. Le serveur ne voit jamais le mot de passe en clair
   * 2. Le client utilise Argon2 avec les mêmes paramètres à l'inscription et au login
   * 3. Les calculs cryptographiques sont faits côté client (moins de charge serveur)
   * 
   * @param email - L'adresse email de l'utilisateur
   * @param incomingPasswordHash - Le hash envoyé par le frontend
   * @returns L'utilisateur avec ses champs sensibles, ou null si invalide
   * 
   * @example
   * ```typescript
   * const user = await authService.validateUserWithHash(
   *   'alice@example.com',
   *   'hash_from_frontend'
   * );
   * if (user) {
   *   // Identifiants valides
   * }
   * ```
   */
  async validateUserWithHash(email: string, incomingPasswordHash: string) {
    // Récupération de l'utilisateur avec ses champs sensibles (passwordHash, refreshTokenHash)
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;

    if (user.passwordHash !== incomingPasswordHash) return null;

    return user;
  }

  /**
   * Connexion d'un utilisateur
   * 
   * Authentifie un utilisateur avec son email et son hash de mot de passe,
   * puis génère de nouveaux tokens JWT.
   * 
   * Flux :
   * 1. Validation des identifiants (email + passwordHash)
   * 2. Génération de nouveaux tokens JWT (access + refresh)
   * 3. Stockage du hash du refresh token en BDD
   * 4. Si PATIENT : récupération des blobs chiffrés
   * 5. Retour de la réponse complète au client
   * 
   * @param dto - Email et passwordHash envoyés par le frontend
   * @returns Tokens JWT + données chiffrées (si patient) + infos utilisateur
   * @throws UnauthorizedException si les identifiants sont invalides
   * 
   * @example
   * ```typescript
   * const response = await authService.login({
   *   email: 'alice@example.com',
   *   passwordHash: 'hash_calculé_par_le_frontend',
   * });
   * // Le client reçoit accessToken, refreshToken, et les blobs chiffrés
   * ```
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Validation des identifiants
    const user = await this.validateUserWithHash(dto.email, dto.passwordHash);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Génération des tokens JWT
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    
    /**
     * Stockage sécurisé du refresh token
     * 
     * On hash le refresh token avec bcrypt avant de le stocker.
     * Ça permet de vérifier plus tard si le token présenté est valide,
     * sans stocker le token en clair dans la BDD.
     */
    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      this.rounds,
    );
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    // Variables pour les blobs Zero-Knowledge
    let encryptedMasterKey: string | null = null;
    let salt: string | null = null;
    let encryptedProfile: string | null = null;

    /**
     * Récupération des données chiffrées pour les patients
     * 
     * Si l'utilisateur est un patient, on récupère ses blobs chiffrés
     * pour les renvoyer au frontend. Le client en a besoin pour
     * déchiffrer localement le profil médical.
     */
    if (user.role === UserRole.PATIENT) {
      const patient = await this.patientsService.findByUserId(user.id);
      if (patient) {
        encryptedMasterKey = patient.encryptedMasterKey;
        salt = patient.salt;
        encryptedProfile = patient.encryptedProfile;
      }
    }

    /**
     * Réponse complète
     * 
     * On retourne tout ce dont le client a besoin pour fonctionner :
     * - Tokens pour les requêtes API
     * - ID et rôle pour la navigation
     * - Blobs chiffrés pour le déchiffrement local (patients)
     */
    return {
      ...tokens,
      userId: user.id,
      encryptedMasterKey,
      salt,
      encryptedProfile,
      role: user.role,
      pseudo: user.pseudo,
    };
  }

  /**
   * Rafraîchissement des tokens JWT
   * 
   * Permet d'obtenir de nouveaux tokens (access + refresh) sans redemander
   * les identifiants à l'utilisateur. Utilisé quand l'access token expire.
   * 
   * Prérequis :
   * - Le JwtRefreshGuard a déjà validé le refresh token
   * - L'utilisateur est authentifié et son ID est disponible
   * 
   * Sécurité :
   * Cette route est protégée par JwtRefreshGuard qui vérifie :
   * 1. La validité du JWT (signature, expiration)
   * 2. La correspondance du hash en BDD avec le token présenté
   * 
   * @param userId - L'ID de l'utilisateur (extrait du JWT par le guard)
   * @returns Nouveaux tokens + blobs chiffrés + infos utilisateur
   * @throws UnauthorizedException si l'utilisateur n'existe plus
   * 
   * @example
   * ```typescript
   * // Après validation du refresh token par le guard
   * const response = await authService.refreshTokens(userId);
   * // Le client reçoit de nouveaux tokens tout neufs
   * ```
   */
  async refreshTokens(userId: string): Promise<AuthResponseDto> {
    // Récupération de l'utilisateur
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Génération de nouveaux tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Variables pour les blobs Zero-Knowledge
    let encryptedMasterKey: string | null = null;
    let salt: string | null = null;
    let encryptedProfile: string | null = null;

    /**
     * Récupération des blobs chiffrés pour les patients
     * 
     * Même lors d'un refresh, on renvoie les blobs chiffrés.
     * Ça peut être utile si le client a perdu ses données locales
     * ou après une réinstallation de l'app.
     */
    if (user.role === UserRole.PATIENT) {
      const patient = await this.patientsService.findByUserId(user.id);
      if (patient) {
        encryptedMasterKey = patient.encryptedMasterKey;
        salt = patient.salt;
        encryptedProfile = patient.encryptedProfile;
      }
    }

    return {
      ...tokens,
      userId: user.id,
      encryptedMasterKey,
      salt,
      encryptedProfile,
      role: user.role,
      pseudo: user.pseudo,
    };
  }

  /**
   * Déconnexion d'un utilisateur
   * 
   * Invalide le refresh token en le supprimant de la base de données.
   * Après cette opération, l'utilisateur devra se reconnecter avec
   * son email et mot de passe pour obtenir de nouveaux tokens.
   * 
   * Comportement :
   * - Met le champ refreshTokenHash à null
   * - Tous les refresh tokens existants deviennent invalides
   * - L'access token reste valide jusqu'à son expiration naturelle
   * 
   * Note : Pour une sécurité maximale, on pourrait aussi implémenter
   * une blacklist des access tokens, mais ça complexifie l'architecture.
   * 
   * @param userId - L'ID de l'utilisateur qui se déconnecte
   * 
   * @example
   * ```typescript
   * await authService.logout(userId);
   * // L'utilisateur est déconnecté, son refresh token est invalidé
   * ```
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  /**
   * Génération des tokens JWT (Access + Refresh)
   * 
   * Méthode privée qui crée les deux types de tokens nécessaires :
   * 
   * 1. Access Token :
   *    - Courte durée de vie (ex: 15 minutes)
   *    - Utilisé pour chaque requête API
   *    - Contient l'ID, l'email et le rôle de l'utilisateur
   * 
   * 2. Refresh Token :
   *    - Longue durée de vie (ex: 7 jours)
   *    - Utilisé uniquement pour obtenir un nouvel access token
   *    - Stocké de manière sécurisée côté client
   * 
   * Structure du payload JWT :
   * ```json
   * {
   *   "sub": "user-uuid",           // Subject (identifiant utilisateur)
   *   "email": "user@example.com",  // Email de l'utilisateur
   *   "role": "PATIENT",            // Rôle (PATIENT / PSY / ADMIN)
   *   "iat": 1234567890,            // Issued At (timestamp de création)
   *   "exp": 1234569999             // Expiration (timestamp)
   * }
   * ```
   * 
   * Sécurité :
   * - Chaque type de token a son propre secret (JWT_ACCESS_SECRET vs JWT_REFRESH_SECRET)
   * - Les secrets viennent des variables d'environnement
   * - Les durées d'expiration sont configurables
   * 
   * @param userId - UUID de l'utilisateur
   * @param email - Email de l'utilisateur
   * @param role - Rôle de l'utilisateur (PATIENT / PSY / ADMIN)
   * @returns Objet contenant accessToken et refreshToken
   * 
   * @example
   * Variables d'environnement requises :
   * ```
   * JWT_ACCESS_SECRET=secret_super_securise_access
   * JWT_REFRESH_SECRET=secret_super_securise_refresh
   * JWT_ACCESS_EXPIRES_IN=900      # 15 minutes en secondes
   * JWT_REFRESH_EXPIRES_IN=604800  # 7 jours en secondes
   * ```
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    /**
     * Payload JWT standard
     * 
     * - sub (subject) : Identifiant unique de l'utilisateur
     * - email : Email (utile pour l'affichage sans requête BDD)
     * - role : Rôle pour les contrôles d'autorisation
     */
    const payload = { sub: userId, email, role };

    /**
     * Génération de l'access token
     * 
     * Ce token est court-vivant et doit être inclus dans chaque requête API
     * via l'en-tête Authorization: Bearer <accessToken>
     */
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') as string,
      expiresIn: this.configService.get<number>('JWT_ACCESS_EXPIRES_IN'),
    });

    /**
     * Génération du refresh token
     * 
     * Ce token est long-vivant et permet d'obtenir un nouvel access token
     * sans redemander le mot de passe. Il doit être stocké de manière sécurisée
     * côté client (SecureStore sur mobile, httpOnly cookie sur web).
     */
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') as string,
      expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }
}
