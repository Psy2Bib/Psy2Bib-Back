import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  sender: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  recipient: User;

  /**
   * Contenu du message chiffré côté client (AES-GCM).
   * Le serveur ne peut pas le lire.
   */
  @Column({ type: 'text' })
  encryptedContent: string;

  /**
   * Vecteur d'initialisation (IV) pour le déchiffrement.
   * Public (nécessaire mais ne compromet pas la sécurité sans la clé).
   */
  @Column({ type: 'text' })
  iv: string;

  @CreateDateColumn()
  createdAt: Date;
}
