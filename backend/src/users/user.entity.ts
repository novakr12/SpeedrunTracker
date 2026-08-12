import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Run } from '../runs/run.entity';
import { Game } from '../games/game.entity';

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

  @Column({ type: 'uuid', nullable: true })
  banRunId: string | null;

  @OneToMany(() => Run, (run) => run.user)
  runs: Run[];

  @ManyToMany(() => Game, (game) => game.followers)
  @JoinTable({
    name: 'user_followed_games',
    joinColumn: { name: 'userId' },
    inverseJoinColumn: { name: 'gameId' },
  })
  followedGames: Game[];

  @CreateDateColumn()
  createdAt: Date;
}
