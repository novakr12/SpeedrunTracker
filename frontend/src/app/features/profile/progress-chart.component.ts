import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { ProgressSeries } from '../../shared/progress.util';

const WIDTH = 640;
const HEIGHT = 200;
const PADDING_X = 14;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 26;

interface PlottedPoint {
  runId: string;
  x: number;
  y: number;
  timeMs: number;
  at: string | null;
  isRecord: boolean;
}

@Component({
  selector: 'app-progress-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MsToTimePipe],
  template: `
    <figure class="chart">
      <figcaption>
        <span class="title">{{ series.gameTitle }} — {{ series.categoryName }}</span>
        <span class="meta">
          {{ series.points.length }} runs · best
          <strong>{{ series.bestMs | msToTime }}</strong>
          @if (series.improvementMs > 0) {
            · improved by
            <strong class="gain">{{ series.improvementMs | msToTime }}</strong>
          }
        </span>
      </figcaption>

      <svg
        [attr.viewBox]="'0 0 ' + width + ' ' + height"
        role="img"
        [attr.aria-label]="
          'Run times for ' + series.gameTitle + ' ' + series.categoryName
        "
      >
        <line
          class="axis"
          [attr.x1]="paddingX"
          [attr.y1]="height - paddingBottom"
          [attr.x2]="width - paddingX"
          [attr.y2]="height - paddingBottom"
        />

        @if (points.length > 1) {
          <polyline class="line" [attr.points]="polyline" />
        }

        @for (point of points; track point.runId) {
          <circle
            class="point"
            [class.record]="point.isRecord"
            [attr.cx]="point.x"
            [attr.cy]="point.y"
            [attr.r]="point.isRecord ? 5 : 3.5"
            (click)="select.emit(point.runId)"
          >
            <title>
              {{ point.timeMs | msToTime }}{{ point.at ? ' · ' : ''
              }}{{ point.at | date: 'mediumDate' }}
            </title>
          </circle>
        }
      </svg>

      <div class="scale">
        <span>{{ series.bestMs | msToTime }} fastest</span>
        <span>{{ series.worstMs | msToTime }} slowest</span>
      </div>
    </figure>
  `,
  styleUrl: './progress-chart.css',
})
export class ProgressChartComponent {
  @Input({ required: true }) set series(value: ProgressSeries) {
    this.current = value;
    this.points = this.plot(value);
  }
  get series(): ProgressSeries {
    return this.current;
  }

  @Output() select = new EventEmitter<string>();

  readonly width = WIDTH;
  readonly height = HEIGHT;
  readonly paddingX = PADDING_X;
  readonly paddingBottom = PADDING_BOTTOM;

  points: PlottedPoint[] = [];

  private current!: ProgressSeries;

  get polyline(): string {
    return this.points.map((point) => `${point.x},${point.y}`).join(' ');
  }

  private plot(series: ProgressSeries): PlottedPoint[] {
    const usableWidth = WIDTH - PADDING_X * 2;
    const usableHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const span = series.worstMs - series.bestMs;
    const lastIndex = series.points.length - 1;

    return series.points.map((point, index) => {
      const ratio = span
        ? (point.timeMs - series.bestMs) / span
        : 0.5;
      return {
        runId: point.runId,
        timeMs: point.timeMs,
        at: point.at,
        isRecord: point.isRecord,
        x: lastIndex
          ? PADDING_X + (usableWidth * index) / lastIndex
          : WIDTH / 2,
        y: PADDING_TOP + usableHeight * ratio,
      };
    });
  }
}
