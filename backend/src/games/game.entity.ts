import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Run } from '../runs/run.entity';
import { User } from '../users/user.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('simple-array', { nullable: true })
  platforms: string[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ type: 'int', nullable: true })
  releaseYear: number;

  @Column({ nullable: true })
  coverImage: string;

  @OneToMany(() => Category, (category) => category.game)
  categories: Category[];

  @OneToMany(() => Run, (run) => run.game)
  runs: Run[];

  @ManyToMany(() => User, (user) => user.followedGames)
  followers: User[];

  @CreateDateColumn()
  createdAt: Date;
}
