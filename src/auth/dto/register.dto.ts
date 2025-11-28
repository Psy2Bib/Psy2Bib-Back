import {
    IsEmail,
    IsOptional,
    IsString,
    MinLength,
    IsEnum,
  } from 'class-validator';
  import { UserRole } from '../../users/user.entity';
  
  export class RegisterDto {
    @IsEmail()
    email: string;
  
    @IsString()
    @MinLength(8)
    password: string;
  
    @IsString()
    firstName: string;
  
    @IsString()
    lastName: string;
  
    @IsString()
    encryptedMasterKey: string;
  
    @IsString()
    encryptionSalt: string;
  
    @IsString()
    encryptedProfile: string;
  
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
  }
  