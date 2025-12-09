import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('messages') // Table "messages" en base de données
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Identifiant unique du message (UUID)

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  sender: User; // Expéditeur du message, relation avec User. Suppression en cascade.

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  recipient: User; // Destinataire du message, relation avec User. Suppression en cascade.

  /**
   * Contenu du message chiffré côté client (AES-GCM)
   * Le serveur ne peut pas le lire, respect de l'E2EE (End-to-End Encryption)
   */
  @Column({ type: 'text' })
  encryptedContent: string;

  /**
   * Vecteur d'initialisation (IV) pour le déchiffrement côté client
   * Public mais nécessaire pour déchiffrer le message avec la clé
   */
  @Column({ type: 'text' })
  iv: string;

  @CreateDateColumn()
  createdAt: Date; // Date de création automatique du message
}
