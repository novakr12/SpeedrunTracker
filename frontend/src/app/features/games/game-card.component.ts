import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, Game, UpdateGameDto } from '../../core/models/game.model';
import { PLATFORMS } from '../../shared/platforms';

export interface GameUpdate {
  id: string;
  changes: UpdateGameDto;
}

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [FormsModule],
  template: `
    <article class="card">
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

      @if (!editing) {
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
          <button type="button" (click)="viewLeaderboard.emit(game)">
            Leaderboard
          </button>
          <button type="button" (click)="select.emit(game)">+ Add run</button>
          @if (canManage) {
            <button type="button" (click)="startEdit()">Edit</button>
            <button
              type="button"
              class="danger"
              (click)="remove.emit(game.id)"
            >
              Delete
            </button>
          }
        </div>
      } @else {
        <div class="platforms">
          @for (platform of allPlatforms; track platform) {
            <label class="pf">
              <input
                type="checkbox"
                [checked]="editPlatforms.has(platform)"
                (change)="toggle(platform, $any($event.target).checked)"
              />
              {{ platform }}
            </label>
          }
        </div>
        <input
          type="text"
          class="tags-input"
          placeholder="Tags (comma separated)"
          [(ngModel)]="editTags"
        />

        @if (categories.length) {
          <div class="cat-editor">
            @for (category of categories; track category.id) {
              <div class="cat-row">
                <input type="text" [(ngModel)]="categoryNames[category.id]" />
                <button
                  type="button"
                  (click)="saveCategory(category.id)"
                  [disabled]="!categoryNames[category.id]"
                >
                  Save
                </button>
                <button
                  type="button"
                  class="danger"
                  (click)="categoryDelete.emit(category.id)"
                >
                  ×
                </button>
              </div>
            }
          </div>
        }

        <div class="actions">
          <button type="button" (click)="save()">Save game</button>
          <button type="button" (click)="editing = false">Done</button>
        </div>
      }
    </article>
  `,
  styleUrl: './game-card.css',
})
export class GameCardComponent {
  @Input({ required: true }) game!: Game;
  @Input() categories: Category[] = [];
  @Input() canManage = false;
  @Output() select = new EventEmitter<Game>();
  @Output() viewLeaderboard = new EventEmitter<Game>();
  @Output() remove = new EventEmitter<string>();
  @Output() update = new EventEmitter<GameUpdate>();
  @Output() categoryUpdate = new EventEmitter<{ id: string; name: string }>();
  @Output() categoryDelete = new EventEmitter<string>();

  readonly allPlatforms = PLATFORMS;
  coverFailed = false;
  editing = false;
  editPlatforms = new Set<string>();
  editTags = '';
  categoryNames: Record<string, string> = {};

  startEdit(): void {
    this.editPlatforms = new Set(this.game.platforms ?? []);
    this.editTags = (this.game.tags ?? []).join(', ');
    this.categoryNames = {};
    this.categories.forEach((category) => {
      this.categoryNames[category.id] = category.name;
    });
    this.editing = true;
  }

  saveCategory(id: string): void {
    const name = this.categoryNames[id]?.trim();
    if (name) {
      this.categoryUpdate.emit({ id, name });
    }
  }

  toggle(platform: string, checked: boolean): void {
    if (checked) {
      this.editPlatforms.add(platform);
    } else {
      this.editPlatforms.delete(platform);
    }
  }

  save(): void {
    const tags = this.editTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    this.update.emit({
      id: this.game.id,
      changes: { platforms: Array.from(this.editPlatforms), tags },
    });
    this.editing = false;
  }
}
