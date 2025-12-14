/**
 * Entité Message - Messages chiffrés de bout en bout (E2EE)
 * 
 * Représente un message privé entre deux utilisateurs (patient-psy, patient-patient, psy-psy).
 * Architecture Zero-Knowledge : le contenu est chiffré côté client avec AES-GCM.
 * Le serveur ne peut jamais lire les messages, il ne fait que les router et les stocker.
 * 
 * @module chat
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

/**
 * Entité Message
 * 
 * Stocke les messages chiffrés. Workflow E2EE :
 * 1. Expéditeur chiffre le contenu avec une clé de session
 * 2. Envoi du blob chiffré + IV au serveur
 * 3. Serveur stocke et route vers le destinataire
 * 4. Destinataire déchiffre avec la clé de session partagée
 */
@Entity('messages')
export class Message {
  /**
   * ID unique du message
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Expéditeur du message
   * 
   * onDelete: CASCADE => Si l'utilisateur est supprimé, ses messages aussi (RGPD)
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  sender: User;

  /**
   * Destinataire du message
   * 
   * onDelete: CASCADE => Si le destinataire est supprimé, les messages reçus aussi
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  recipient: User;

  /**
   * Contenu chiffré du message
   * 
   * Format : Blob AES-GCM chiffré en base64
   * Contient le texte du message chiffré avec une clé de session.
   * 
   * Le serveur ne peut PAS déchiffrer ce contenu car il n'a pas la clé.
   * Seuls l'expéditeur et le destinataire ont accès à la clé de session.
   * 
   * Workflow de chiffrement :
   * 1. Génération d'une clé de session (dérivée d'un secret partagé)
   * 2. Chiffrement AES-GCM du message
   * 3. Encodage en base64
   * 4. Envoi au serveur
   */
  @Column({ type: 'text' })
  encryptedContent: string;

  /**
   * Vecteur d'initialisation (IV)
   * 
   * Nécessaire pour le déchiffrement AES-GCM.
   * Public et non-secret (stocké en clair), mais doit être unique par message.
   * 
   * Format : 12 bytes (96 bits) pour AES-GCM, encodé en base64.
   * 
   * Sans l'IV correct, même avec la bonne clé, le déchiffrement échoue.
   */
  @Column({ type: 'text' })
  iv: string;

  /**
   * Indicateur de lecture
   * 
   * false = Message non lu
   * true = Message lu par le destinataire
   * 
   * Permet d'afficher les "non lus" dans l'interface (badge, notification).
   */
  @Column({ default: false })
  isRead: boolean;

  /**
   * Date de lecture
   * 
   * Timestamp précis de la lecture du message.
   * null si pas encore lu.
   * 
   * Utile pour l'accusé de réception et les statistiques.
   */
  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  /**
   * Chemin vers une pièce jointe chiffrée (Optionnel)
   * 
   * Stocke le chemin relatif du fichier sur le serveur (ex: "uploads/uuid-blob.enc").
   * Le fichier lui-même est chiffré côté client avant l'upload.
   * Le backend ne connaît pas le type MIME réel ni le contenu.
   */
  @Column({ type: 'varchar', nullable: true })
  attachmentPath: string | null;

  /**
   * Conversation associée (optionnel)
   * 
   * Relation vers une entité Conversation pour grouper les messages.
   * Permet d'organiser l'historique par fil de discussion.
   */
  @ManyToOne('Conversation', { nullable: true, onDelete: 'CASCADE' })
  conversation?: any;

  /**
   * Date d'envoi du message
   */
  @CreateDateColumn()
  createdAt: Date;
}
