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

  // Snapshot of the user's bannedAt when the appeal was filed. UsersService.ban()
  // stamps a fresh bannedAt on every ban, so this column is what enforces "one
  // appeal per ban": a later ban carries a different timestamp and therefore
  // opens up a new appeal, while the same ban cannot be appealed twice.
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
