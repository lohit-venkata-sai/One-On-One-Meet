import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-precheck',
  imports: [RouterModule],
  templateUrl: './precheck.html',
  styleUrl: './precheck.css',
})
export class Precheck {
  router = inject(Router);
  isAgreed: boolean = false;
  checkListItems: CheckListItems[] = [
    {
      path: 'video-02 (1).svg',
      title: 'Camera',
      description: "Camera is working well. You're clearly visible.",
    },
    {
      path: 'mic-02 (1).svg',
      title: 'Microphone',
      description: 'Mic is functioning properly. Your voice is clear.',
    },
    {
      path: 'signal-full-02.svg',
      title: 'Network',
      description: 'Network quality is poor.',
    },
  ];
  handleIsAgreed() {
    this.isAgreed = !this.isAgreed;
  }
  handleClick() {
    this.router.navigateByUrl('/meeting');
  }
}

interface CheckListItems {
  path: String;
  title: String;
  description: String;
}
