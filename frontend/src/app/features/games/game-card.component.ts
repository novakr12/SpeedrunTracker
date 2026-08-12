import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Category, Game } from '../../core/models/game.model';

@Component({
  selector: 'app-game-card',
  standalone: true,
  template: `
    <article
      class="card"
      role="link"
      tabindex="0"
      [attr.aria-label]="'Open ' + game.title"
      (click)="open.emit(game)"
      (keydown.enter)="open.emit(game)"
      (keydown.space)="onSpace($event)"
    >
      <div class="cover">
        @if (game.coverImage && !coverFailed) {
          <img class="cover-blur" [src]="game.coverImage" alt="" aria-hidden="true" />
          <img
            class="cover-main"
            [src]="game.coverImage"
            [alt]="game.title"
            (error)="coverFailed = true"
          />
        } @else {
          <span>{{ game.title.charAt(0) }}</span>
        }
      </div>
      <h3>{{ game.title }}</h3>
      @if (game.releaseYear) {
        <p class="meta">{{ game.releaseYear }}</p>
      }

      @if (game.platforms?.length) {
        <div class="chips">
          @for (platform of game.platforms; track platform) {
            <span class="chip platform">{{ platform }}</span>
          }
        </div>
      }
      @if (game.tags?.length) {
        <div class="chips">
          @for (tag of game.tags; track tag) {
            <span class="chip tag">#{{ tag }}</span>
          }
        </div>
      }
      @if (categories.length) {
        <div class="chips">
          @for (category of categories; track category.id) {
            <span class="chip">{{ category.name }}</span>
          }
        </div>
      } @else {
        <p class="empty">No categories</p>
      }

      <div class="actions">
        <button
          type="button"
          class="follow"
          [class.following]="isFollowed"
          [attr.aria-pressed]="isFollowed"
          (click)="onToggleFollow($event)"
        >
          {{ isFollowed ? '★ Following' : '☆ Follow' }}
        </button>
        @if (canManage) {
          <button type="button" class="danger" (click)="onDelete($event)">
            Delete
          </button>
        }
      </div>
    </article>
  `,
  styleUrl: './game-card.css',
})
export class GameCardComponent {
  @Input({ required: true }) game!: Game;
  @Input() categories: Category[] = [];
  @Input() canManage = false;
  @Input() isFollowed = false;
  @Output() open = new EventEmitter<Game>();
  @Output() remove = new EventEmitter<string>();
  @Output() toggleFollow = new EventEmitter<string>();

  coverFailed = false;

  onDelete(event: Event): void {
    event.stopPropagation();
    this.remove.emit(this.game.id);
  }

  onToggleFollow(event: Event): void {
    event.stopPropagation();
    this.toggleFollow.emit(this.game.id);
  }

  onSpace(event: Event): void {
    event.preventDefault();
    this.open.emit(this.game);
  }
}
