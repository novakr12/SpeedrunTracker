import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Game } from '../games/game.entity';
import { Category } from '../categories/category.entity';

// A single speedrun attempt submitted by a user.
@Entity('runs')
export class Run {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.runs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Game, (game) => game.runs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column()
  gameId: string;

  @ManyToOne(() => Category, (category) => category.runs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  // Run duration in milliseconds (basis for leaderboard ranking).
  @Column({ type: 'int' })
  timeMs: number;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  playedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
