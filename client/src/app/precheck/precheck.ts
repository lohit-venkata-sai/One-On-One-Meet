import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { StateService } from '../services/state.service';
import { MeetService } from '../services/meet.service';
import { faker } from '@faker-js/faker';
@Component({
  selector: 'app-precheck',
  imports: [RouterModule],
  templateUrl: './precheck.html',
  styleUrl: './precheck.css',
})
export class Precheck {
  constructor(private stateService: StateService, private meetService: MeetService) {}
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
    const meetId = this.stateService.meetId();

    if (!meetId) {
      this.router.navigateByUrl('/lobby');
      return;
    }

    const identity = faker.person.fullName();
    console.log('this is identity', identity);
    this.meetService.joinMeet(meetId, identity).subscribe({
      next: (res) => {
        console.log(res.success, res.token);
        if (res.success && res.token) {
          this.stateService.setToken(res.token);
          this.router.navigateByUrl('/meeting');
        } else {
          console.error('Failed to join meeting');
        }
      },
      error: (err) => {
        console.error('Join meeting error', err);
      },
    });
  }
  ngOnInit() {
    console.log(this.stateService.meetId());
  }
  ngOnDestroy() {
    console.log(this.stateService.token());
  }
}

interface CheckListItems {
  path: String;
  title: String;
  description: String;
}
