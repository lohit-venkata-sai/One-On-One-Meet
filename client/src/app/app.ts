import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SocketService } from './services/socket.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styleUrl: './app.css',
})
export class App {
  constructor(private router: Router, private socketService: SocketService) {}
}
