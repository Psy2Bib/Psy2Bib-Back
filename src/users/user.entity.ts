import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  
  export enum UserRole {
    PATIENT = 'PATIENT',
    PSY = 'PSY',
    ADMIN = 'ADMIN',
  }
  
  @Entity({ name: 'users' })
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    email: string;
  
    @Column({
      name: 'password_hash',
      type: 'varchar',
      length: 255,
      select: false,
    })
    passwordHash: string;
  
    @Column({
      type: 'enum',
      enum: UserRole,
      default: UserRole.PATIENT,
    })
    role: UserRole;
  
    @Column({ type: 'varchar', length: 100 })
    firstName: string;
  
    @Column({ type: 'varchar', length: 100 })
    lastName: string;
    
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    @Column({
      name: 'refresh_token_hash',
      type: 'text',
      nullable: true,
      select: false,
    })
    refreshTokenHash: string | null;
  }
  