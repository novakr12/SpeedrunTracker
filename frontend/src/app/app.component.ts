import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header>
      <h1>🏁 SpeedrunTracker</h1>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
  styles: [
    `
      header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #222;
      }
      h1 {
        margin: 0;
        font-size: 1.4rem;
      }
      main {
        padding: 1.5rem;
      }
    `,
  ],
})
export class AppComponent {}
