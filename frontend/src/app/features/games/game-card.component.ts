import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Game } from '../../core/models/game.model';

@Component({
  selector: 'app-game-card',
  standalone: true,
  template: `
    <article class="card" (click)="select.emit(game)">
      <div class="cover">
        @if (game.coverImage) {
          <img [src]="game.coverImage" [alt]="game.title" />
        } @else {
          <span>{{ game.title.charAt(0) }}</span>
        }
      </div>
      <h3>{{ game.title }}</h3>
      <p class="meta">
        {{ game.platform || 'Unknown platform' }}
        @if (game.releaseYear) {
          · {{ game.releaseYear }}
        }
      </p>
      @if (game.categories?.length) {
        <p class="cats">{{ game.categories!.length }} categories</p>
      }
      <button type="button" (click)="onAddRun($event)">+ Add run</button>
    </article>
  `,
  styleUrl: './game-card.css',
})
export class GameCardComponent {
  @Input({ required: true }) game!: Game;
  @Output() select = new EventEmitter<Game>();

  onAddRun(event: Event): void {
    event.stopPropagation();
    this.select.emit(this.game);
  }
}
