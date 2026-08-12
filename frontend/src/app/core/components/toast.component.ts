import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Notification } from '../../store/notifications/notifications.feature';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (notification of notifications; track notification.id) {
        <div class="toast">
          <p>{{ notification.message }}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            (click)="dismiss.emit(notification.id)"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast.css',
})
export class ToastComponent {
  @Input() notifications: Notification[] = [];
  @Output() dismiss = new EventEmitter<number>();
}
