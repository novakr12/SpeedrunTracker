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

  @OneToMany(() => Run, (run) => run.user)
  runs: Run[];

  @CreateDateColumn()
  createdAt: Date;
}
