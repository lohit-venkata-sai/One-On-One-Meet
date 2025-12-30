import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { GaussianBlurBackgroundProcessor } from '@twilio/video-processors';
import { LocalVideoTrack } from 'twilio-video';

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
  isCamOn = true;
  isMicOn = true;
  blurProcessor?: GaussianBlurBackgroundProcessor;
  localVideoTrack?: LocalVideoTrack;
  blurEnabled: boolean = false;

  msgText = '';
  socketId: string | undefined = '';
  chatMessages: ChatMsg[] = [];

  permissionRejected = false;
  constructor(
    private state: StateService,
    private router: Router,
    private socketService: SocketService
  ) {
    this.chatMessages = this.state.chatMessages;
    this.socketId = this.socketService.socket.id;
    this.blurEnabled = this.state.blurBackground;
  }

  async ngOnInit() {
    const token = this.state.token();
    const meetId = this.state.meetId();

    if (!token || !meetId) {
      this.router.navigateByUrl('/lobby');
      return;
    }

    try {
      console.log('i have my blur value', this.blurEnabled);

      // this.unMuteMic();
      this.room = await connect(token, {
        name: meetId,
        audio: true,
        video: false,
      });

      this.attachLocalTracks();

      this.room.participants.forEach((p) => this.handleParticipant(p));

      this.room.on('participantConnected', (p) => this.handleParticipant(p));

      this.room.on('participantDisconnected', (p) => {
        console.log('Participant left:', p.identity);
      });
      await this.camOn();
      this.unMuteMic();
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
    this.permissionRejected = true;
    try {
      if (!this.room) {
        console.warn('camOn called before room exists');
        return;
      }
      const container = document.getElementById('local-video');
      if (!container) return;

      container.replaceChildren();

      const track = await createLocalVideoTrack();
      this.localVideoTrack = track;

      if (this.blurEnabled) {
        const { GaussianBlurBackgroundProcessor } = await import('@twilio/video-processors');
        this.blurProcessor = new GaussianBlurBackgroundProcessor({
          assetsPath: '/twilio/build',
          blurFilterRadius: 5,
          maskBlurRadius: 5,
        });

        await this.blurProcessor.loadModel();
        track.addProcessor(this.blurProcessor);
        console.log('blur emabled', this.blurEnabled);
      }
      await this.room.localParticipant.publishTrack(track);
      const ele = track.attach();
      // ele.classList.add('local_video_ele');
      ele.style.width = '100%';
      ele.style.height = '100%';
      ele.style.objectFit = 'cover';
      container.appendChild(ele);
    } catch (err: any) {
      console.error('error:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('permission')
      ) {
        this.permissionRejected = true;
      }
    }
  }
  camOff() {
    this.room.localParticipant.videoTracks.forEach((pub) => {
      pub.track?.stop();
      pub.unpublish();
    });
    const container = document.getElementById('local-video');
    if (container) {
      container.innerHTML = '';

      // const placeholder = document.createElement('div');
      // placeholder.style.width = '100%';
      // placeholder.style.height = '100%';
      // placeholder.style.display = 'flex';
      // placeholder.style.alignItems = 'center';
      // placeholder.style.justifyContent = 'center';
      // placeholder.style.background = '#111';
      // placeholder.style.color = '#aaa';
      // placeholder.innerText = 'Camera is off';

      // container.appendChild(placeholder);
    }
  }
  toggleCam() {
    this.isCamOn ? this.camOff() : this.camOn();
    this.isCamOn = !this.isCamOn;
  }
  toggleMic() {
    this.isMicOn ? this.muteMic() : this.unMuteMic();
    this.isMicOn = !this.isMicOn;
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
