import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Enum pour les rôles des utilisateurs
export enum UserRole {
  PATIENT = 'PATIENT', // utilisateur patient
  PSY = 'PSY',         // psychologue
  ADMIN = 'ADMIN',     // administrateur
}

@Entity({ name: 'users' }) // table "users"
export class User {
  @PrimaryGeneratedColumn('uuid') // identifiant unique généré automatiquement
  id: string;

  @Index({ unique: true }) // email unique dans la base
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false, // ne sera pas sélectionné par défaut dans les requêtes
  })
  passwordHash: string; // mot de passe hashé (hachage côté front)

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT, // rôle par défaut = PATIENT
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 100 })
  firstName: string; // prénom de l'utilisateur

  @Column({ type: 'varchar', length: 100 })
  lastName: string; // nom de famille

  @CreateDateColumn({ name: 'created_at' }) // date de création automatique
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // date de mise à jour automatique
  updatedAt: Date;

  @Column({
    name: 'refresh_token_hash',
    type: 'text',
    nullable: true,
    select: false, // ne sera pas sélectionné par défaut, stocke le hash du refresh token
  })
  refreshTokenHash: string | null;
}
