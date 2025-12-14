/**
 * Entité Patient - Stockage des données sensibles chiffrées
 * 
 * Cette entité contient UNIQUEMENT des données chiffrées côté client.
 * Le backend ne peut jamais déchiffrer ces blobs, garantissant le Zero-Knowledge.
 * 
 * Relation : Un patient = un utilisateur avec role PATIENT
 * 
 * @module patients
 */

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

/**
 * Entité Patient
 * 
 * Table séparée de 'users' pour stocker les données médicales sensibles
 * sous forme chiffrée. Cette séparation permet :
 * - De protéger les données sensibles (architecture Zero-Knowledge)
 * - D'avoir des psychologues sans dossier patient
 * - De gérer les droits d'accès finement
 */
@Entity({ name: 'patients' })
export class Patient {
  /**
   * ID unique du dossier patient
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Relation OneToOne avec User
   * 
   * Un patient est lié à exactement un utilisateur.
   * onDelete: 'CASCADE' => Si l'utilisateur est supprimé, le dossier patient l'est aussi.
   * 
   * Ça garantit la cohérence des données et facilite la conformité RGPD
   * (suppression complète des données utilisateur).
   */
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Clé maîtresse chiffrée (blob)
   * 
   * Workflow Zero-Knowledge :
   * 1. Client génère une clé maîtresse aléatoire
   * 2. Client dérive une clé du mot de passe utilisateur (PBKDF2, argon2...)
   * 3. Client chiffre la clé maîtresse avec cette clé dérivée
   * 4. Client envoie le blob chiffré (ce champ)
   * 
   * Le serveur ne voit qu'un blob opaque et ne peut jamais le déchiffrer.
   */
  @Column({ type: 'text' })
  encryptedMasterKey: string;

  /**
   * Sel cryptographique (stocké en clair)
   * 
   * Utilisé dans la fonction de dérivation de clé (KDF).
   * Doit être unique par utilisateur et généré aléatoirement.
   * 
   * Le sel n'est pas secret, il est nécessaire pour recalculer
   * la clé de déchiffrement lors du prochain login.
   */
  @Column({ type: 'text' })
  salt: string;

  /**
   * Profil médical chiffré (blob)
   * 
   * Contient toutes les données sensibles du patient :
   * - Antécédents médicaux
   * - Notes personnelles
   * - Historique de consultations
   * - Informations privées
   * 
   * Format typique : JSON chiffré avec AES-GCM, encodé en base64.
   * Le client déchiffre localement avec la clé maîtresse.
   */
  @Column({ type: 'text' })
  encryptedProfile: string;

  /**
   * Date de création du dossier
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Date de dernière modification
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
