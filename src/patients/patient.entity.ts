import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../users/user.entity';
  
  @Entity({ name: 'patients' })
  export class Patient {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({ type: 'text' })
    encryptedMasterKey: string;
  
    @Column({ type: 'text' })
    salt: string;
  
    @Column({ type: 'text' })
    encryptedProfile: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  