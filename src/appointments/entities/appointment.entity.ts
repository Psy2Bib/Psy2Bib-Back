/**
 * Entité Appointment - Rendez-vous entre patient et psychologue
 * 
 * Représente une réservation confirmée sur un créneau de disponibilité.
 * Gère le cycle de vie complet du rendez-vous : réservation, confirmation,
 * session en cours, terminé, ou annulé.
 * 
 * @module appointments
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Availability } from './availability.entity';

/**
 * Type de rendez-vous
 */
export enum AppointmentType {
  IN_PERSON = 'IN_PERSON',  // Consultation en présentiel au cabinet
  ONLINE = 'ONLINE',         // Téléconsultation via visio
}

/**
 * Statut du rendez-vous
 * 
 * Cycle de vie normal : PENDING → CONFIRMED → IN_PROGRESS → DONE
 * Peut être CANCELLED à tout moment avant DONE
 */
export enum AppointmentStatus {
  PENDING = 'PENDING',           // En attente de validation par le psy
  CONFIRMED = 'CONFIRMED',       // Accepté par le psy, rendez-vous fixé
  IN_PROGRESS = 'IN_PROGRESS',   // Fenêtre de consultation atteinte (session en cours)
  DONE = 'DONE',                 // Consultation terminée
  CANCELLED = 'CANCELLED',       // Annulé (par patient ou psy)
}

/**
 * Entité Appointment
 * 
 * Représente un rendez-vous réservé. Lie un patient, un psychologue
 * et un créneau de disponibilité de 30 minutes.
 */
@Entity('appointments')
export class Appointment {
  /**
   * ID unique du rendez-vous
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Psychologue concerné par le rendez-vous
   * 
   * ManyToOne car un psychologue peut avoir plusieurs rendez-vous.
   * Non nullable : un rendez-vous doit obligatoirement avoir un psy.
   */
  @ManyToOne(() => User, { nullable: false })
  psy: User;

  /**
   * Patient ayant réservé le rendez-vous
   * 
   * ManyToOne car un patient peut avoir plusieurs rendez-vous
   * (avec le même psy ou des psys différents).
   */
  @ManyToOne(() => User, { nullable: false })
  patient: User;

  /**
   * Créneau de disponibilité réservé
   * 
   * OneToOne car un créneau ne peut être réservé que pour un seul rendez-vous.
   * Contient les dates start/end du rendez-vous (30 minutes).
   * 
   * Non nullable : un rendez-vous doit obligatoirement occuper un créneau.
   */
  @OneToOne(() => Availability, (availability) => availability.appointment, {
    nullable: false,
  })
  @JoinColumn()
  availability: Availability;

  /**
   * Type de consultation
   * 
   * - IN_PERSON : Consultation au cabinet (adresse du psy)
   * - ONLINE : Téléconsultation (utilise meetingId pour la visio)
   */
  @Column({
    type: 'enum',
    enum: AppointmentType,
  })
  type: AppointmentType;

  /**
   * Statut actuel du rendez-vous
   * 
   * Par défaut PENDING pour que le psy puisse valider la demande.
   * 
   * Workflow typique :
   * 1. Patient réserve → PENDING (en attente validation)
   * 2. Psy accepte → CONFIRMED (rendez-vous confirmé)
   * 3. Heure du RDV atteinte → IN_PROGRESS (job automatique)
   * 4. Fin du créneau + 30min → DONE (job automatique)
   * 
   * Ou à tout moment → CANCELLED (annulation)
   */
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  /**
   * Date et heure de début du rendez-vous
   * 
   * Copié depuis availability.start pour faciliter les requêtes.
   * Permet de faire des queries directement sur Appointment sans
   * avoir à joindre Availability à chaque fois.
   */
  @Column({ type: 'timestamptz', nullable: true })
  scheduledStart: Date | null;

  /**
   * Date et heure de fin du rendez-vous
   * 
   * Copié depuis availability.end (toujours start + 30 minutes).
   */
  @Column({ type: 'timestamptz', nullable: true })
  scheduledEnd: Date | null;

  /**
   * Identifiant de session visio
   * 
   * Utilisé pour les rendez-vous ONLINE.
   * Peut être :
   * - Un UUID généré aléatoirement
   * - Un ID de room LiveKit/Twilio/Jitsi
   * - Un lien de visio personnalisé
   * 
   * Null pour les rendez-vous IN_PERSON.
   * 
   * Le patient et le psy utilisent ce meetingId pour rejoindre
   * la même session WebRTC au moment du rendez-vous.
   */
  @Column({ type: 'varchar', nullable: true })
  meetingId: string | null;

  /**
   * Date de création du rendez-vous
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * Date de dernière modification
   * 
   * Mise à jour notamment lors des changements de statut.
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
