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

@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Psychologue propriétaire de ce créneau
   */
  @ManyToOne(() => User, { nullable: false })
  psy: User;

  /**
   * Début du créneau (30 minutes)
   */
  @Column({ type: 'timestamptz' })
  start: Date;

  /**
   * Fin du créneau (30 minutes)
   */
  @Column({ type: 'timestamptz' })
  end: Date;

  /**
   * Indique si le créneau est déjà réservé
   */
  @Column({ default: false })
  isBooked: boolean;

  /**
   * Relation 1-1 (optionnelle) vers le rendez-vous réservé sur ce créneau
   */
  @OneToOne(() => Appointment, (appointment) => appointment.availability, {
    nullable: true,
  })
  appointment?: Appointment;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
