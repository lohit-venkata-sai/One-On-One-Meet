import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-lobby',
  imports: [RouterModule],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class Lobby {
  router = inject(Router);
  name = 'Aravid'
  expert_name = 'Abhishek'
  title = 'Technology'
  experience = '0-2'
  duration = '30 mins'

  isAgreed: boolean = false
  handleIsAgreed() {
    this.isAgreed = !this.isAgreed;
  }
  handleClick() {
    console.log('btn clicked');
    this.router.navigateByUrl('/precheck');
  }

}
