import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'patients' })
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Identifiant unique du patient (différent de l'ID User)

  /**
   * Relation 1:1 avec la table User.
   * Chaque patient correspond exactement à un utilisateur.
   * `onDelete: 'CASCADE'` → si l'utilisateur est supprimé, son profil patient l'est aussi.
   */
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // Ce champ devient la clé étrangère dans la table patients
  user: User;

  /**
   * Master key chiffrée côté client avec la clé dérivée du mot de passe utilisateur.
   * Le backend N’A JAMAIS accès à la master key en clair (Zero Knowledge).
   */
  @Column({ type: 'text' })
  encryptedMasterKey: string;

  /**
   * Salt utilisé côté client pour dériver la clé locale (PBKDF2, Argon2, etc.)
   * Le serveur stocke uniquement ce salt et ne calcule JAMAIS de clé.
   */
  @Column({ type: 'text' })
  salt: string;

  /**
   * Profil patient chiffré (données médicales, infos sensibles).
   * Il est intégralement chiffré côté client, généralement en AES-GCM.
   */
  @Column({ type: 'text' })
  encryptedProfile: string;

  /**
   * Date de création du profil patient.
   * Automatique grâce à TypeORM.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Dernière mise à jour du profil patient.
   * Mise à jour automatique à chaque modification.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
