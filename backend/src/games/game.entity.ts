import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Run } from '../runs/run.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  platform: string;

  @Column({ type: 'int', nullable: true })
  releaseYear: number;

  @Column({ nullable: true })
  coverImage: string;

  @OneToMany(() => Category, (category) => category.game)
  categories: Category[];

  @OneToMany(() => Run, (run) => run.game)
  runs: Run[];

  @CreateDateColumn()
  createdAt: Date;
}
