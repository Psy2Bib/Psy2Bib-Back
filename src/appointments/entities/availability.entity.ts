import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'; // Import des décorateurs TypeORM pour définir l'entité et ses relations
import { User } from '../../users/user.entity'; // Import de l'entité User
import { Appointment } from './appointment.entity'; // Import de l'entité Appointment

@Entity('availabilities') // Déclaration de l'entité "availabilities" dans la base de données
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Identifiant unique du créneau (UUID)

  /**
   * Psychologue propriétaire de ce créneau
   */
  @ManyToOne(() => User, { nullable: false })
  psy: User; // Relation ManyToOne avec l'entité User pour le psychologue propriétaire

  /**
   * Début du créneau (30 minutes)
   */
  @Column({ type: 'timestamptz' })
  start: Date; // Date/heure de début du créneau

  /**
   * Fin du créneau (30 minutes)
   */
  @Column({ type: 'timestamptz' })
  end: Date; // Date/heure de fin du créneau

  /**
   * Indique si le créneau est déjà réservé
   */
  @Column({ default: false })
  isBooked: boolean; // Booléen pour savoir si le créneau est déjà réservé

  /**
   * Relation 1-1 (optionnelle) vers le rendez-vous réservé sur ce créneau
   */
  @OneToOne(() => Appointment, (appointment) => appointment.availability, {
    nullable: true,
  })
  appointment?: Appointment; // Référence au rendez-vous associé, si réservé

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date; // Date de création du créneau

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date; // Date de dernière mise à jour du créneau
}
