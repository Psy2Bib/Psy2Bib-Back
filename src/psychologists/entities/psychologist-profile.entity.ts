import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('psychologist_profiles')
export class PsychologistProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'text', nullable: true })
  title: string; // ex: "Psychologue Clinicien"

  @Column({ type: 'text', nullable: true })
  description: string; // Bio courte

  @Column('simple-array', { nullable: true })
  specialties: string[]; // ex: ["TCC", "Anxiété", "Dépression"]

  @Column('simple-array', { nullable: true })
  languages: string[]; // ex: ["Français", "Anglais"]

  @Column({ type: 'boolean', default: true })
  isVisible: boolean; // Pour apparaître ou non dans la recherche

  @Column({ type: 'int', nullable: true })
  hourlyRate: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
