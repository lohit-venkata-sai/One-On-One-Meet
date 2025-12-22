import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MeetService } from '../services/meet.service';
import { StateService } from '../services/state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lobby',
  imports: [RouterModule, CommonModule],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class Lobby {
  constructor(
    private meetService: MeetService,
    private stateService: StateService,
    private route: ActivatedRoute
  ) {}
  router = inject(Router);
  name = 'Aravid';
  expert_name = 'Abhishek';
  title = 'Technology';
  experience = '0-2';
  duration = '30 mins';
  isAgreed: boolean = false;
  loading = false;
  error = '';
  showPopUp: boolean = false;

  onNextBtnClick() {
    const meetId = this.route.snapshot.paramMap.get('meetId');
    if (meetId) {
      this.NavigateUserToNextPage(meetId);
    } else {
      this.createMeet();
    }
  }
  NavigateUserToNextPage(meetId: string) {
    this.loading = true;
    this.meetService.isMeetIdvalid(meetId).subscribe({
      next: (res) => {
        if (res.success) {
          console.log(meetId);
          this.stateService.setMeetId(meetId);
          this.router.navigateByUrl('/precheck');
        } else {
          this.error = '404 — Meeting not found';
          this.router.navigateByUrl('/*');
        }
        this.loading = false;
        // console.log(this.stateService.meetId);
      },
      error: () => {
        this.error = '404 — Meeting not found';
        this.loading = false;
      },
    });
  }
  createMeet() {
    this.loading = true;

    this.meetService.createMeet().subscribe({
      next: (res) => {
        this.stateService.setMeetId(res.meetId);
        this.router.navigateByUrl('/precheck');
      },
      error: () => {
        this.error = 'Failed to create meeting';
        this.loading = false;
      },
    });
  }

  handleIsAgreed() {
    this.isAgreed = !this.isAgreed;
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.checkMediaPermissions();
  }

  async checkMediaPermissions() {
    try {
      const streamMic = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamMic.getTracks().forEach((track) => track.stop());
      const streamCam = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      streamCam.getTracks().forEach((track) => track.stop());
      this.showPopUp = false;
      console.log(this.showPopUp);
      document.body.style.overflow = '';
    } catch (error) {
      this.showPopUp = true;
    }
  }
}
