/**
 * Entité Availability - Créneaux de disponibilité des psychologues
 * 
 * Représente un slot de 30 minutes durant lequel un psychologue est disponible
 * pour une consultation. Les patients peuvent réserver ces créneaux pour
 * créer des rendez-vous.
 * 
 * @module appointments
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Appointment } from './appointment.entity';

/**
 * Entité Availability
 * 
 * Chaque créneau = exactement 30 minutes.
 * Le psychologue crée ses créneaux en indiquant une plage (ex: 9h-12h),
 * et le backend la découpe automatiquement en slots de 30 min.
 */
@Entity('availabilities')
export class Availability {
  /**
   * ID unique du créneau
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Psychologue propriétaire de ce créneau
   * 
   * ManyToOne car un psychologue peut avoir de nombreux créneaux
   * (plusieurs jours, plusieurs heures par jour).
   * 
   * Non nullable : un créneau appartient forcément à un psy.
   */
  @ManyToOne(() => User, { nullable: false })
  psy: User;

  /**
   * Début du créneau
   * 
   * Format : timestamptz (timestamp avec timezone)
   * Exemple : "2025-12-15T09:00:00+01:00"
   * 
   * Stocké en UTC en base, converti en timezone locale à l'affichage.
   */
  @Column({ type: 'timestamptz' })
  start: Date;

  /**
   * Fin du créneau
   * 
   * Toujours exactement start + 30 minutes.
   * Les consultations standard durent 30 minutes (norme en psychologie).
   * 
   * Exemple : si start = 09:00, alors end = 09:30
   */
  @Column({ type: 'timestamptz' })
  end: Date;

  /**
   * Statut de réservation du créneau
   * 
   * - false : Créneau libre, disponible pour réservation
   * - true : Créneau réservé, un rendez-vous existe dessus
   * 
   * Permet de filtrer rapidement les créneaux disponibles :
   * WHERE isBooked = false
   * 
   * Mis à jour automatiquement lors de la création/annulation d'un rendez-vous.
   */
  @Column({ default: false })
  isBooked: boolean;

  /**
   * Rendez-vous associé à ce créneau
   * 
   * Relation OneToOne optionnelle.
   * - null si le créneau est libre (isBooked = false)
   * - Appointment si réservé (isBooked = true)
   * 
   * Cette relation permet de :
   * - Récupérer les détails du rendez-vous depuis le créneau
   * - Libérer le créneau lors d'une annulation
   * - Afficher qui a réservé le créneau
   */
  @OneToOne(() => Appointment, (appointment) => appointment.availability, {
    nullable: true,
  })
  appointment?: Appointment;

  /**
   * Date de création du créneau
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * Date de dernière modification
   * 
   * Mise à jour lors de la réservation/libération du créneau.
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
