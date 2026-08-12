import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Run } from './run.entity';
import { CategorySegment } from '../categories/category-segment.entity';

@Entity('run_segments')
export class RunSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Run, (run) => run.segments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: Run;

  @Column()
  runId: string;

  @ManyToOne(() => CategorySegment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segmentId' })
  segment: CategorySegment;

  @Column()
  segmentId: string;

  @Column({ type: 'int' })
  durationMs: number;
}
