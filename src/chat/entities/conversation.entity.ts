import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Column,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('conversations')
@Unique(['userA', 'userB'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // On impose un ordre (userA.id < userB.id) pour éviter les doublons
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  userA: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  userB: User;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
