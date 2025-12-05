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

export enum AppointmentType {
  IN_PERSON = 'IN_PERSON',
  ONLINE = 'ONLINE',
}

export enum AppointmentStatus {
  PENDING = 'PENDING', // en attente
  CONFIRMED = 'CONFIRMED', // réservé
  CANCELLED = 'CANCELLED', // annulé
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Psychologue concerné par le rendez-vous
   */
  @ManyToOne(() => User, { nullable: false })
  psy: User;

  /**
   * Patient ayant réservé le rendez-vous
   */
  @ManyToOne(() => User, { nullable: false })
  patient: User;

  /**
   * Créneau réservé (30 minutes)
   */
  @OneToOne(() => Availability, (availability) => availability.appointment, {
    nullable: false,
  })
  @JoinColumn()
  availability: Availability;

  @Column({
    type: 'enum',
    enum: AppointmentType,
  })
  type: AppointmentType;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.CONFIRMED,
  })
  status: AppointmentStatus;

  /**
   * Identifiant de meeting pour la visio (futur module WebRTC / LiveKit / etc.)
   * Renseigné uniquement si type = ONLINE
   */
  @Column({ type: 'varchar', nullable: true })
  meetingId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
