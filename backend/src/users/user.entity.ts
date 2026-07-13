import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Run } from '../runs/run.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  // Excluded from default selects; only loaded explicitly during auth.
  @Column({ select: false })
  password: string;

  @OneToMany(() => Run, (run) => run.user)
  runs: Run[];

  @CreateDateColumn()
  createdAt: Date;
}
