import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
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
  LocalAudioTrack,
  LocalVideoTrack,
} from 'twilio-video';

import { Header } from '../header/header';
import { ChatMsg, SocketService } from '../services/socket.service';
import { FormsModule } from '@angular/forms';
import { GaussianBlurBackgroundProcessor } from '@twilio/video-processors';
import { Popupcomponent } from '../popup/popup';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeetService } from '../services/meet.service';

@Component({
  selector: 'app-meeting',
  templateUrl: './meeting.html',
  styleUrl: './meeting.css',
  imports: [Header, FormsModule, Popupcomponent, RouterModule, CommonModule],
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
  isScreenSharing = false;
  screenTrack?: LocalVideoTrack;

  blurEnabled: boolean = false;
  noiseCancellationEnabled: boolean = false;

  msgText = '';
  socketId: string | undefined = '';
  chatMessages: ChatMsg[] = [];

  permissionRejected = false;
  isFullScreenOn = false;
  constructor(
    private state: StateService,
    private router: Router,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef,
    private MeetService: MeetService
  ) {
    this.chatMessages = this.state.chatMessages;
    this.socketId = this.socketService.socket.id;

    this.blurEnabled = this.state.blurBackground;
    this.noiseCancellationEnabled = this.state.noiseCancellation;
  }

  async ngOnInit() {
    const token = this.state.token;
    const meetId = this.state.meetId;

    if (!token || !meetId) {
      this.router.navigateByUrl('/lobby');
      return;
    }

    document.addEventListener('fullscreenchange', () => {
      console.log('full screenTriggred');
      this.isFullScreenOn = !!document.fullscreenElement;
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        console.log('user pressed F11 to toggle browser fullscreen');
        this.isFullScreenOn = !!document.fullscreenElement;
      }
    });
    try {
      console.log('Blur enabled:', this.blurEnabled);
      console.log('Noise cancellation enabled:', this.noiseCancellationEnabled);

      this.room = await connect(token, {
        name: meetId,
        audio: false,
        video: false,
      });

      this.room.participants.forEach((p) => this.handleParticipant(p));
      this.room.on('participantConnected', (p) => this.handleParticipant(p));
      this.room.on('participantDisconnected', (p) => console.log('Participant left:', p.identity));

      await this.setupAudioTrack();
      await this.camOn();
    } catch (err) {
      console.error('Failed to connect to Twilio', err);
      this.router.navigateByUrl('/lobby');
    }
  }

  ngOnDestroy() {
    this.leaveMeeting();
  }

  async setupAudioTrack() {
    try {
      // browser processed stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: this.noiseCancellationEnabled,
          echoCancellation: true,
          autoGainControl: true,
        },
      });

      const audioTrack = stream.getAudioTracks()[0];

      const { createLocalAudioTrack } = await import('twilio-video');

      const localAudioTrack = await createLocalAudioTrack({
        deviceId: audioTrack.getSettings().deviceId,
        noiseSuppression: this.noiseCancellationEnabled,
      });

      await this.room.localParticipant.publishTrack(localAudioTrack);

      stream.getTracks().forEach((t) => t.stop());

      console.log('Noise cancellation:', this.noiseCancellationEnabled ? 'ENABLED' : 'DISABLED');
    } catch (err) {
      console.error('audio track setup failed', err);
    }
  }
  async camOn() {
    this.permissionRejected = false;

    try {
      if (!this.room) return;

      const container = document.getElementById('local-video');
      if (!container) return;

      Array.from(container.querySelectorAll('video')).forEach((v) => v.remove());

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

        console.log('Blur enabled');
      }

      await this.room.localParticipant.publishTrack(track);

      const ele = track.attach();
      ele.style.width = '100%';
      ele.style.height = '100%';
      ele.style.objectFit = 'cover';

      container.appendChild(ele);
    } catch (err: any) {
      console.error('Camera error:', err);

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
    if (container) container.innerHTML = '';
  }

  toggleCam() {
    this.isCamOn ? this.camOff() : this.camOn();
    this.isCamOn = !this.isCamOn;
  }

  muteMic() {
    this.room.localParticipant.audioTracks.forEach((p) => p.track?.disable());
  }

  unMuteMic() {
    this.room.localParticipant.audioTracks.forEach((p) => p.track?.enable());
  }

  toggleMic() {
    this.isMicOn ? this.muteMic() : this.unMuteMic();
    this.isMicOn = !this.isMicOn;
  }

  handleParticipant(participant: RemoteParticipant) {
    const container = document.getElementById('remote-video');
    if (!container) return;

    const attachTrack = (track: any) => {
      if (track.kind !== 'video' && track.kind !== 'audio') return;

      const el = track.attach();
      el.setAttribute('data_track_sid', track.sid);

      if (track.kind === 'video') {
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.objectFit = 'cover';
      }

      container.appendChild(el);
    };

    participant.tracks.forEach((pub) => {
      if (pub.isSubscribed && pub.track) attachTrack(pub.track);
    });

    participant.on('trackSubscribed', attachTrack);

    participant.on('trackUnsubscribed', (track: RemoteVideoTrack | RemoteAudioTrack) => {
      track.detach().forEach((el) => el.remove());
    });
  }

  async startScreenShare() {
    try {
      this.camOff();
      // if (this.isScreenSharing == false) return;
      const stream = navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenMediaTrack = (await stream).getVideoTracks()[0];

      const { LocalVideoTrack } = await import('twilio-video');

      this.screenTrack = new LocalVideoTrack(screenMediaTrack, { name: 'screen' });

      await this.room.localParticipant.publishTrack(this.screenTrack);
      this.isScreenSharing = true;
      screenMediaTrack.onended = () => {
        this.stopScreenShare();
      };
      this.fullScreen();
    } catch (error) {
      console.log('error at start screen share', error);
    }
  }
  async stopScreenShare() {
    if (!this.screenTrack) return;

    this.room.localParticipant.unpublishTrack(this.screenTrack);
    this.screenTrack.stop();

    this.screenTrack = undefined;
    this.isScreenSharing = false;
    this.camOn();
  }
  toggleScreenShare() {
    this.isScreenSharing = !this.isScreenSharing;
    console.log('is screen sharing', this.isScreenSharing);
    this.isScreenSharing ? this.startScreenShare() : this.stopScreenShare();
    this.cdr.detectChanges();
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
    this.MeetService.leaveMeet(this.state.meetId!, this.state.identity!).subscribe({
      next: (res) => {
        console.log('res from leave meet', res);
      },
      error: (error) => {
        console.log('error from leave meet', error);
      },
    });
    this.router.navigateByUrl('/lobby');
  }
  sendMsg() {
    if (!this.msgText) return;

    this.socketService.socket.emit('new:message', {
      socketId: this.socketService.socket.id,
      message: this.msgText,
      room: this.state.meetId,
    });

    this.state.addChatMsg({
      socketId: this.socketService.socket.id,
      message: this.msgText,
      room: this.state.meetId,
    });
  }
  fullScreen() {
    console.log('f11 triggered');
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      elem.requestFullscreen();
      this.isFullScreenOn = true;
    } else {
      document.exitFullscreen();
      this.isFullScreenOn = false;
    }
  }
  // checkFullscreen() {
  //   this.isFullScreenOn = !!document.fullscreenElement;
  // }
}
