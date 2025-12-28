import { Component, OnInit, OnDestroy, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StateService } from '../services/state.service';

import {
  connect,
  Room,
  RemoteParticipant,
  LocalTrackPublication,
  LocalTrack,
  createLocalVideoTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
} from 'twilio-video';
import { Header } from '../header/header';
import { ChatMsg, SocketService } from '../services/socket.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-meeting',
  templateUrl: './meeting.html',
  styleUrl: './meeting.css',
  imports: [Header, FormsModule],
  host: {
    class: 'block flex flex-col flex-1 bg-black h-screen',
  },
})
export class Meeting implements OnInit, OnDestroy {
  room!: Room;
  isCamOn = signal(true);
  isMicOn = signal(true);
  msgText = '';
  socketId: string | undefined = '';
  chatMessages: Signal<ChatMsg[]>;

  constructor(
    private state: StateService,
    private router: Router,
    private socketService: SocketService
  ) {
    this.chatMessages = this.state.chatMessages;
    this.socketId = this.socketService.socket.id;
  }

  async ngOnInit() {
    const token = this.state.token();
    const meetId = this.state.meetId();

    if (!token || !meetId) {
      this.router.navigateByUrl('/lobby');
      return;
    }

    try {
      this.camOn();
      this.isMicOn();
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

    const attachTrack = (track: any) => {
      if (track.kind !== 'video' && track.kind !== 'audio') return;

      const el = track.attach();
      el.setAttribute('data_track_sid', track.sid);
      if (track.kind == 'video') {
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.objectFit = 'cover';
      }

      container.appendChild(el);
    };

    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed && publication.track) {
        attachTrack(publication.track);
      }
    });

    participant.on('trackSubscribed', attachTrack);
    participant.on('trackDisabled', (track) => {
      if (track.kind !== 'video') return;

      const el = document.querySelector(
        `[data_track_sid="${(track as any).sid}"]`
      ) as HTMLElement | null;

      if (el) {
        el.style.display = 'none';
      }
    });

    participant.on('trackEnabled', (track) => {
      if (track.kind !== 'video') return;

      const el = document.querySelector(
        `[data_track_sid="${(track as any).sid}"]`
      ) as HTMLElement | null;

      if (el) {
        el.style.display = 'block';
      }
    });

    participant.on('trackUnsubscribed', (track: RemoteVideoTrack | RemoteAudioTrack) => {
      track.detach().forEach((el) => el.remove());
    });
  }

  muteMic() {
    this.room.localParticipant.audioTracks.forEach((publication) => publication.track?.disable());
  }
  unMuteMic() {
    this.room.localParticipant.audioTracks.forEach((publication) => publication.track?.enable());
  }
  async camOn() {
    const container = document.getElementById('local-video');
    if (!container) return;

    container.replaceChildren();

    const track = await createLocalVideoTrack();

    await this.room.localParticipant.publishTrack(track);
    const ele = track.attach();
    // ele.classList.add('local_video_ele');
    ele.style.width = '100%';
    ele.style.height = '100%';
    ele.style.objectFit = 'cover';
    container.appendChild(ele);
  }
  camOff() {
    this.room.localParticipant.videoTracks.forEach((pub) => {
      pub.track?.stop();
      pub.unpublish();
    });
  }
  toggleCam() {
    this.isCamOn() ? this.camOff() : this.camOn();
    this.isCamOn.update((x) => !x);
  }
  toggleMic() {
    this.isMicOn() ? this.muteMic() : this.unMuteMic();
    this.isMicOn.update((x) => !x);
  }

  sendMsg() {
    console.log(this.msgText);
    if (this.msgText == '') return;

    this.socketService.socket.emit('new:message', {
      socketId: this.socketService.socket.id,
      message: this.msgText,
      room: this.state.meetId(),
    });
    this.state.addChatMsg({
      socketId: this.socketService.socket.id,
      message: this.msgText,
      room: this.state.meetId(),
    });
  }
  leaveMeeting() {
    if (!this.room) return;
    this.room.localParticipant.audioTracks.forEach((pub) => {
      pub.track.stop();
      pub.track.detach().forEach((el) => el.remove());
    });

    this.room.localParticipant.videoTracks.forEach((pub) => {
      pub.track.stop();
      pub.track.detach().forEach((el) => el.remove());
    });

    this.room.disconnect();
    this.router.navigateByUrl('/lobby');
  }
}
