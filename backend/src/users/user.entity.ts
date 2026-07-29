import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Run } from '../runs/run.entity';

export type UserRole = 'user' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: 'user' })
  role: UserRole;

  @Column({ default: false })
  banned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  bannedUntil: Date | null;

  @Column({ type: 'text', nullable: true })
  banReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  bannedAt: Date | null;

  // The run that triggered this ban, when it was issued from the review queue.
  // Plain column rather than a relation: the ban must survive the run being
  // deleted, and a dangling id is better than losing the ban record with it.
  @Column({ type: 'uuid', nullable: true })
  banRunId: string | null;

  @OneToMany(() => Run, (run) => run.user)
  runs: Run[];

  @CreateDateColumn()
  createdAt: Date;
}
