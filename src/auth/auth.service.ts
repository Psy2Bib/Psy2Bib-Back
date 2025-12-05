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

@Injectable()
export class AuthService {
  // On garde bcrypt uniquement pour les refresh tokens
  private readonly rounds = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly patientsService: PatientsService,
    private readonly psychologistsService: PsychologistsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Inscription :
   * - crée un User (nom, prénom, email, hash du mot de passe déjà calculé côté front, rôle)
   * - si PATIENT : crée aussi un Patient avec les blobs chiffrés
   * - si PSY : crée un profil psychologue vide (invisible)
   * - renvoie : tokens + blobs ZK + rôle
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const role: UserRole = dto.role ? dto.role : UserRole.PATIENT;

    // On ne re-hash pas, on stocke le hash envoyé par le front
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
      const patient = await this.patientsService.createForUser(user, {
        encryptedMasterKey: dto.encryptedMasterKey,
        salt: dto.salt,
        encryptedProfile: dto.encryptedProfile,
      });

      encryptedMasterKey = patient.encryptedMasterKey;
      salt = patient.salt;
      encryptedProfile = patient.encryptedProfile;
    } else if (role === UserRole.PSY) {
      // Création auto du profil psy (vide et invisible) pour qu'il existe en base
      await this.psychologistsService.updateProfile(user.id, {
        isVisible: false,
        title: 'Psychologue',
        description: '',
        specialties: [],
        languages: [],
        hourlyRate: 0,
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      this.rounds,
    );
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
   * Validation pour le login :
   * - charge le user
   * - compare les hash envoyés par le front et stockés en BDD
   *
   * NB: le front envoie déjà un hash, on NE re-hash PAS ici.
   */
  async validateUserWithHash(email: string, incomingPasswordHash: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;

    // comparaison stricte de deux hash
    if (user.passwordHash !== incomingPasswordHash) {
      return null;
    }

    return user;
  }

  /**
   * Login :
   * - vérifie email + passwordHash (déjà hashé côté front)
   * - génère de nouveaux tokens
   * - récupère les blobs chiffrés s'il s'agit d'un PATIENT
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUserWithHash(dto.email, dto.passwordHash);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      this.rounds,
    );
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
   * Refresh :
   * - suppose que le JwtRefreshGuard a validé le refreshToken
   * - recharge le user + patient
   * - renvoie tokens + blobs ZK
   */
  async refreshTokens(userId: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
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
   * Déconnexion : supprime le refresh token en base
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  /**
   * Génère un accessToken + refreshToken
   * - payload = { sub, email, role }
   * - secrets & expiresIn viennent du .env
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
