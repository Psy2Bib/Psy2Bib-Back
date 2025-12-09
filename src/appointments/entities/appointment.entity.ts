import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'; // Import des décorateurs TypeORM pour définir l'entité et ses relations
import { User } from '../../users/user.entity'; // Import de l'entité User
import { Availability } from './availability.entity'; // Import de l'entité Availability

// Enum pour les types de rendez-vous
export enum AppointmentType {
  IN_PERSON = 'IN_PERSON', // Rendez-vous en personne
  ONLINE = 'ONLINE',       // Rendez-vous en ligne
}

// Enum pour les statuts de rendez-vous
export enum AppointmentStatus {
  PENDING = 'PENDING',     // En attente de confirmation
  CONFIRMED = 'CONFIRMED', // Rendez-vous confirmé
  CANCELLED = 'CANCELLED', // Rendez-vous annulé
}

@Entity('appointments') // Déclaration de l'entité "appointments" dans la base de données
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Identifiant unique du rendez-vous (UUID)

  /**
   * Psychologue concerné par le rendez-vous
   */
  @ManyToOne(() => User, { nullable: false })
  psy: User; // Relation ManyToOne avec l'entité User pour le psychologue

  /**
   * Patient ayant réservé le rendez-vous
   */
  @ManyToOne(() => User, { nullable: false })
  patient: User; // Relation ManyToOne avec l'entité User pour le patient

  /**
   * Créneau réservé (30 minutes)
   */
  @OneToOne(() => Availability, (availability) => availability.appointment, {
    nullable: false,
  })
  @JoinColumn() // Relation OneToOne avec l'entité Availability + création de la clé étrangère
  availability: Availability; // Référence au créneau réservé

  @Column({
    type: 'enum',
    enum: AppointmentType,
  })
  type: AppointmentType; // Type de rendez-vous (IN_PERSON ou ONLINE)

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.CONFIRMED,
  })
  status: AppointmentStatus; // Statut du rendez-vous, par défaut CONFIRMED

  /**
   * Identifiant de meeting pour la visio (futur module WebRTC / LiveKit / etc.)
   * Renseigné uniquement si type = ONLINE
   */
  @Column({ type: 'varchar', nullable: true })
  meetingId: string | null; // Identifiant pour les rendez-vous en ligne

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date; // Date de création du rendez-vous

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date; // Date de dernière mise à jour du rendez-vous
}
