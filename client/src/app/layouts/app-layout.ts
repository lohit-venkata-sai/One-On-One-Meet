import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Header],
  template: `
    <header>
      <app-header />
    </header>

    <main class="flex-1 flex text-white">
      <router-outlet />
    </main>
  `,
  host: {
    class: 'block min-h-screen flex flex-col bg-[#272B30] p-5 gap-5 text-white',
  },
})
export class AppLayout {}
