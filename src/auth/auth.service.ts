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
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  import { AuthResponseDto } from './dto/auth-response.dto';
  import { UserRole } from '../users/user.entity';
  
  @Injectable()
  export class AuthService {
    private readonly rounds = 12;
  
    constructor(
      private readonly usersService: UsersService,
      private readonly patientsService: PatientsService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    /**
     * Inscription :
     * - crée un User (nom, prénom, email, hash du mot de passe, rôle)
     * - si PATIENT : crée aussi un Patient avec les blobs chiffrés
     * - renvoie : tokens + blobs ZK + rôle
     */
    async register(dto: RegisterDto): Promise<AuthResponseDto> {
      const existing = await this.usersService.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Email already registered');
      }
  
      const passwordHash = await bcrypt.hash(dto.password, this.rounds);
      const role: UserRole = dto.role ? (dto.role as UserRole) : UserRole.PATIENT;
  
      const user = await this.usersService.create({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role,
      });
  
      // Par défaut, rien (utile si plus tard on a des roles non-patient)
      let encryptedMasterKey: string | null = null;
      let encryptionSalt: string | null = null;
      let encryptedProfile: string | null = null;
  
      if (role === UserRole.PATIENT) {
        const patient = await this.patientsService.createForUser(user, {
          encryptedMasterKey: dto.encryptedMasterKey,
          encryptionSalt: dto.encryptionSalt,
          encryptedProfile: dto.encryptedProfile,
        });
  
        encryptedMasterKey = patient.encryptedMasterKey;
        encryptionSalt = patient.encryptionSalt;
        encryptedProfile = patient.encryptedProfile;
      }
  
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, this.rounds);
      await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);
  
      return {
        ...tokens,
        encryptedMasterKey,
        encryptionSalt,
        encryptedProfile,
        role: user.role,
      };
    }
  
    /**
     * Validation interne pour le login :
     * - charge le user avec passwordHash
     * - compare le mot de passe
     */
    async validateUser(email: string, password: string) {
      const user = await this.usersService.findByEmailWithPassword(email);
      if (!user) return null;
  
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return null;
  
      return user;
    }
  
    /**
     * Login :
     * - vérifie email + mot de passe
     * - génère de nouveaux tokens
     * - récupère les blobs chiffrés s'il s'agit d'un PATIENT
     */
    async login(dto: LoginDto): Promise<AuthResponseDto> {
      const user = await this.validateUser(dto.email, dto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, this.rounds);
      await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);
  
      let encryptedMasterKey: string | null = null;
      let encryptionSalt: string | null = null;
      let encryptedProfile: string | null = null;
  
      if (user.role === UserRole.PATIENT) {
        const patient = await this.patientsService.findByUserId(user.id);
        if (patient) {
          encryptedMasterKey = patient.encryptedMasterKey;
          encryptionSalt = patient.encryptionSalt;
          encryptedProfile = patient.encryptedProfile;
        }
      }
  
      return {
        ...tokens,
        encryptedMasterKey,
        encryptionSalt,
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
    async refreshTokens(
      userId: string,
      email: string,
      role: UserRole,
    ): Promise<AuthResponseDto> {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
  
      const tokens = await this.generateTokens(user.id, user.email, user.role);
  
      let encryptedMasterKey: string | null = null;
      let encryptionSalt: string | null = null;
      let encryptedProfile: string | null = null;
  
      if (user.role === UserRole.PATIENT) {
        const patient = await this.patientsService.findByUserId(user.id);
        if (patient) {
          encryptedMasterKey = patient.encryptedMasterKey;
          encryptionSalt = patient.encryptionSalt;
          encryptedProfile = patient.encryptedProfile;
        }
      }
  
      return {
        ...tokens,
        encryptedMasterKey,
        encryptionSalt,
        encryptedProfile,
        role: user.role,
      };
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
  
      const accessSecret =
        this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret';
      const accessExpiresIn =
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '900s';
  
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ??
        'dev_refresh_secret';
      const refreshExpiresIn =
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
  
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
  
  
