import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MsToTimePipe } from '../../shared/ms-to-time.pipe';
import { Run, RunStatus } from '../../core/models/run.model';

@Component({
  selector: 'tr[app-run-row]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MsToTimePipe],
  template: `
    <td>{{ run.game?.title || '—' }}</td>
    <td>{{ run.category?.name || '—' }}</td>
    <td>{{ run.user?.username || '—' }}</td>
    <td class="time">{{ run.timeMs | msToTime }}</td>
    <td class="status-cell">
      @if (run.status === 'pending') {
        <span class="status-badge pending">Pending</span>
      } @else {
        <button
          type="button"
          class="status-badge"
          [class.accepted]="run.status === 'accepted'"
          [class.rejected]="run.status === 'rejected'"
          [attr.aria-expanded]="expanded"
          (click)="onToggle($event)"
        >
          {{ statusLabel(run.status) }}
        </button>

        @if (expanded) {
          <div class="review-popover" (click)="$event.stopPropagation()">
            <p class="label">{{ statusLabel(run.status) }} by</p>
            <p class="value">
              {{ run.reviewedBy?.username || 'Unknown moderator' }}
            </p>

            @if (run.reviewedAt) {
              <p class="label">When</p>
              <p class="value">{{ run.reviewedAt | date: 'medium' }}</p>
            }

            @if (run.reviewComment) {
              <p class="label">Comment</p>
              <p class="value quote">{{ run.reviewComment }}</p>
            }
          </div>
        }
      }
    </td>
  `,
  styleUrl: './run-row.css',
})
export class RunRowComponent {
  @Input({ required: true }) run!: Run;
  @Input() expanded = false;
  @Output() toggle = new EventEmitter<string>();

  onToggle(event: MouseEvent): void {
    event.stopPropagation();
    this.toggle.emit(this.run.id);
  }

  statusLabel(status: RunStatus): string {
    if (status === 'accepted') {
      return 'Accepted';
    }
    if (status === 'rejected') {
      return 'Rejected';
    }
    return 'Pending';
  }
}
