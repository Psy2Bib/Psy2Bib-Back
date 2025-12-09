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

@Injectable() // Rend le service injectable via NestJS
export class AuthService {
  // Nombre de rounds pour bcrypt, utilisé uniquement pour hasher les refresh tokens
  private readonly rounds = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly patientsService: PatientsService,
    private readonly psychologistsService: PsychologistsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Inscription d'un nouvel utilisateur
   * - Crée un User avec hash déjà calculé côté front
   * - Si PATIENT : crée un profil patient avec blobs chiffrés (E2EE)
   * - Si PSY : crée un profil psychologue vide (invisible)
   * - Renvoie : accessToken, refreshToken, blobs ZK et rôle
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered'); // Email déjà utilisé
    }

    const role: UserRole = dto.role ? dto.role : UserRole.PATIENT;

    // On ne re-hash pas le mot de passe, on stocke directement le hash envoyé par le front
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash: dto.passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
    });

    let encryptedMasterKey: string | null = null;
    let salt: string | null = null;
    let encryptedProfile: string | null = null;

    if (role === UserRole.PATIENT) {
      // Création du profil patient avec les données chiffrées
      const patient = await this.patientsService.createForUser(user, {
        encryptedMasterKey: dto.encryptedMasterKey,
        salt: dto.salt,
        encryptedProfile: dto.encryptedProfile,
      });

      encryptedMasterKey = patient.encryptedMasterKey;
      salt = patient.salt;
      encryptedProfile = patient.encryptedProfile;
    } else if (role === UserRole.PSY) {
      // Création d'un profil psychologue vide (invisible)
      await this.psychologistsService.updateProfile(user.id, {
        isVisible: false,
        title: 'Psychologue',
        description: '',
        specialties: [],
        languages: [],
        hourlyRate: 0,
      });
    }

    // Génération des tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Hash du refresh token avant stockage en base
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, this.rounds);
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    return {
      ...tokens,
      userId: user.id,
      encryptedMasterKey,
      salt,
      encryptedProfile,
      role: user.role,
    };
  }

  /**
   * Validation de l'utilisateur pour le login
   * - Compare le hash envoyé par le front avec celui stocké en BDD
   * - NE RE-HASH PAS ici, car le front envoie déjà le hash
   */
  async validateUserWithHash(email: string, incomingPasswordHash: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;

    // Comparaison stricte de deux hash
    if (user.passwordHash !== incomingPasswordHash) {
      return null;
    }

    return user;
  }

  /**
   * Login :
   * - Vérifie email + passwordHash
   * - Génère de nouveaux tokens JWT
   * - Récupère les blobs chiffrés si PATIENT
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUserWithHash(dto.email, dto.passwordHash);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials'); // Identifiants invalides
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, this.rounds);
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    let encryptedMasterKey: string | null = null;
    let salt: string | null = null;
    let encryptedProfile: string | null = null;

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
    };
  }

  /**
   * Rafraîchissement des tokens
   * - JwtRefreshGuard doit avoir validé le refresh token
   * - Recharge le user et son profil patient si nécessaire
   * - Renvoie accessToken + refreshToken + blobs ZK
   */
  async refreshTokens(userId: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found'); // Utilisateur non trouvé
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    let encryptedMasterKey: string | null = null;
    let salt: string | null = null;
    let encryptedProfile: string | null = null;

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
    };
  }

  /**
   * Déconnexion
   * - Supprime le refresh token stocké en base
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  /**
   * Génère accessToken et refreshToken
   * - Payload = { sub, email, role }
   * - Les secrets et durées d'expiration sont pris depuis le .env
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET') as string,
      expiresIn: this.configService.get<number>('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') as string,
      expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }
}
