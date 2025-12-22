import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { StateService } from '../services/state.service';

import {
  connect,
  Room,
  RemoteParticipant,
  LocalTrackPublication,
  LocalTrack,
  RemoteTrack,
} from 'twilio-video';
import { Header } from '../header/header';

@Component({
  selector: 'app-meeting',
  templateUrl: './meeting.html',
  styleUrl: './meeting.css',
  imports: [Header],
  host: {
    class: 'block flex flex-col flex-1 bg-black',
  },
})
export class Meeting implements OnInit, OnDestroy {
  room!: Room;

  constructor(private state: StateService, private router: Router) {}

  async ngOnInit() {
    const token = this.state.token();
    const meetId = this.state.meetId();

    if (!token || !meetId) {
      this.router.navigateByUrl('/lobby');
      return;
    }

    try {
      this.room = await connect(token, {
        name: meetId,
        audio: true,
        video: true,
      });

      this.attachLocalTracks();

      this.room.participants.forEach((p) => this.handleParticipant(p));

      this.room.on('participantConnected', (p) => this.handleParticipant(p));

      this.room.on('participantDisconnected', (p) => {
        console.log('Participant left:', p.identity);
      });
    } catch (err) {
      console.error('Failed to connect to Twilio', err);
      this.router.navigateByUrl('/lobby');
    }
  }

  ngOnDestroy() {
    this.leaveMeeting();
  }

  attachLocalTracks() {
    const container = document.getElementById('local-video');
    if (!container) return;

    this.room.localParticipant.tracks.forEach((publication: LocalTrackPublication) => {
      const track = publication.track as LocalTrack | null;
      if (!track) return;

      if (track.kind === 'video' || track.kind === 'audio') {
        container.appendChild(track.attach());
      }
    });
  }

  handleParticipant(participant: RemoteParticipant) {
    const container = document.getElementById('remote-video');
    if (!container) return;

    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed && publication.track) {
        if (publication.track.kind === 'video' || publication.track.kind === 'audio') {
          container.appendChild(publication.track.attach());
        }
      }
    });

    participant.on('trackSubscribed', (track) => {
      if (track.kind === 'video' || track.kind === 'audio') {
        container.appendChild(track.attach());
      }
    });

    participant.on('trackUnsubscribed', (track) => {
      if (track.kind === 'video' || track.kind === 'audio') {
        track.detach().forEach((el) => el.remove());
      }
    });
  }

  leaveMeeting() {
    if (this.room) {
      this.room.disconnect();
    }
    this.router.navigateByUrl('/lobby');
  }
}
