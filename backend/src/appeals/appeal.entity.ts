import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type AppealStatus = 'open' | 'accepted' | 'rejected';

@Entity('ban_appeals')
export class BanAppeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'timestamp' })
  banIssuedAt: Date;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'open' })
  status: AppealStatus;

  @Column({ type: 'text', nullable: true })
  adminComment: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
