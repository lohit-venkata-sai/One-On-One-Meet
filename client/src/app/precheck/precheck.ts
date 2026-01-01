import { Component, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeetService } from '../services/meet.service';
import { StateService } from '../services/state.service';
import { faker } from '@faker-js/faker';
import { connect, LocalVideoTrack, createLocalVideoTrack } from 'twilio-video';
import { firstValueFrom } from 'rxjs';
import type { GaussianBlurBackgroundProcessor } from '@twilio/video-processors';
import { Popupcomponent } from '../popup/popup';

@Component({
  selector: 'app-precheck',
  imports: [CommonModule, FormsModule, RouterModule, Popupcomponent],
  templateUrl: './precheck.html',
  styleUrl: './precheck.css',
})
export class Precheck implements OnInit {
  constructor(
    private meetService: MeetService,
    private stateService: StateService,
    private cdRef: ChangeDetectorRef
  ) {}
  private router = inject(Router);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLVideoElement>;
  stream: MediaStream | null = null;
  errorMessage = '';

  testState: TestState = 'idle';
  cameraStatus: CheckStatus = 'pending';
  micStatus: CheckStatus = 'pending';
  networkStatus: CheckStatus = 'pending';

  hasAgreed: boolean = false;
  permissionRejected = false;

  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  recordedBlobUrl: string | null = null;
  isPlaying = false;
  currentRecordingStream: any;

  selectedSpeaker = 'default';
  selectedMic = 'default';
  selectedCamera = 'default';

  audioOutputDevices: MediaDeviceInfo[] = [];
  audioInputDevices: MediaDeviceInfo[] = [];
  videoInputDevices: MediaDeviceInfo[] = [];

  blur: boolean = false;
  originalTrack?: MediaStreamTrack;
  localVideoTrack?: LocalVideoTrack;
  blurProcessor?: GaussianBlurBackgroundProcessor;
  noiseCancellation = false;
  ncProcessor?: any;

  async toggleNoiseCancellation() {
    this.noiseCancellation = !this.noiseCancellation;

    if (this.noiseCancellation) {
      await this.enableNoiseCancellation();
    } else {
      await this.disableNoiseCancellation();
    }
    this.cdRef.detectChanges();
  }
  async enableNoiseCancellation() {
    const track = this.stream?.getAudioTracks()[0];
    if (!track) return;

    await track.applyConstraints({
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
    });

    // this.videoElement.nativeElement.srcObject = this.stream;
    this.cdRef.detectChanges();
  }

  async disableNoiseCancellation() {
    const track = this.stream?.getAudioTracks()[0];
    if (!track) return;

    await track.applyConstraints({
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false,
    });

    this.videoElement.nativeElement.srcObject = this.stream;
    this.cdRef.detectChanges();
  }

  async onDeviceChange(type: 'mic' | 'camera' | 'speaker', deviceId: string) {
    try {
      if (type === 'speaker') {
        this.selectedSpeaker = deviceId;
        if (this.videoElement.nativeElement.setSinkId) {
          // @ts-ignore
          await this.videoElement.nativeElement.setSinkId(deviceId);
        }
        return;
      }

      if (type === 'mic') {
        this.selectedMic = deviceId;
      }

      if (type === 'camera') {
        this.selectedCamera = deviceId;
      }

      const constraints: MediaStreamConstraints = {
        video:
          this.selectedCamera !== 'default' ? { deviceId: { exact: this.selectedCamera } } : true,

        audio: this.selectedMic !== 'default' ? { deviceId: { exact: this.selectedMic } } : true,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      this.stopCamera();

      this.stream = newStream;
      this.currentRecordingStream = newStream;

      this.videoElement.nativeElement.srcObject = newStream;
      this.videoElement.nativeElement.muted = true;
    } catch (err: any) {
      console.error('Error updating stream:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.message?.includes('permission')
      ) {
        this.permissionRejected = true;
      }
      this.errorMessage = 'Could not access device. Please check permissions.';
      this.cameraStatus = 'failure';
    }

    this.cdRef.detectChanges();
  }

  ngOnInit() {
    this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
    this.disableBlur();
    this.stopCamera();
    if (this.recordedBlobUrl) {
      URL.revokeObjectURL(this.recordedBlobUrl!);
    }
    this.stateService.setBlurBackground(this.blur);
    this.stateService.setNoiceCancellation(this.noiseCancellation);
  }

  async enableBlur() {
    if (!this.stream) return;

    const { GaussianBlurBackgroundProcessor } = await import('@twilio/video-processors');

    const originalTrack = this.stream.getVideoTracks()[0];

    this.localVideoTrack = new LocalVideoTrack(originalTrack);

    this.blurProcessor = new GaussianBlurBackgroundProcessor({
      assetsPath: '/twilio/build',
      maskBlurRadius: 10,
      blurFilterRadius: 5,
    });

    await this.blurProcessor.loadModel();
    this.localVideoTrack.addProcessor(this.blurProcessor);

    const processed = this.localVideoTrack.attach() as HTMLVideoElement;
    processed.muted = true;

    await processed.play();
    const processedStream = (processed as any).captureStream();

    this.currentRecordingStream = new MediaStream([
      ...processedStream.getVideoTracks(),
      ...this.stream.getAudioTracks(),
    ]);

    const container = this.videoContainer.nativeElement;
    container.replaceChildren(processed);

    // const processed = this.localVideoTrack.attach();
    // processed.muted = true;

    // const container = this.videoContainer.nativeElement;
    // container.replaceChildren(processed);
  }

  async disableBlur() {
    if (!this.localVideoTrack || !this.blurProcessor || !this.stream) return;

    this.localVideoTrack.removeProcessor(this.blurProcessor);
    this.blurProcessor = undefined;

    // back to original stream for recording
    this.currentRecordingStream = this.stream;

    const container = this.videoContainer.nativeElement;
    container.replaceChildren(this.videoElement.nativeElement);

    this.videoElement.nativeElement.srcObject = this.stream;
    this.videoElement.nativeElement.muted = true;
  }

  async toggleBlur() {
    this.blur = !this.blur;
    console.log('blur is', this.blur);
    if (this.blur) {
      await this.enableBlur();
    } else {
      await this.disableBlur();
    }
    // fallback
    if (!this.currentRecordingStream) {
      this.currentRecordingStream = this.stream;
    }
    this.cdRef.detectChanges();
  }

  async startCamera() {
    try {
      this.permissionRejected = false;
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.muted = true;
      }
      this.cameraStatus = 'success';
      await this.getDevices();
      navigator.mediaDevices.addEventListener('devicechange', () => this.getDevices());
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      this.errorMessage = 'Could not access camera. Please allow permissions.';
      this.cameraStatus = 'failure';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionRejected = true;
      }
      await this.getDevices();
    }
    this.cdRef.detectChanges();
  }

  async getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      this.audioOutputDevices = devices.filter((d) => d.kind === 'audiooutput');
      this.audioInputDevices = devices.filter((d) => d.kind === 'audioinput');
      this.videoInputDevices = devices.filter((d) => d.kind === 'videoinput');

      if (this.audioOutputDevices.length > 0 && this.selectedSpeaker === 'default') {
        this.selectedSpeaker = this.audioOutputDevices[0].deviceId;
      }
      if (this.audioInputDevices.length > 0 && this.selectedMic === 'default') {
        this.selectedMic = this.audioInputDevices[0].deviceId;
      }
      if (this.videoInputDevices.length > 0 && this.selectedCamera === 'default') {
        this.selectedCamera = this.videoInputDevices[0].deviceId;
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
    this.cdRef.detectChanges();
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  startRecording() {
    const streamToRecord = this.currentRecordingStream || this.stream;
    if (!streamToRecord) return;

    this.testState = 'running';
    this.recordedChunks = [];

    try {
      this.mediaRecorder = new MediaRecorder(streamToRecord);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        this.recordedBlobUrl = url;
      };
      this.mediaRecorder.start();
    } catch (e) {
      console.error('MediaRecorder not supported or error', e);
    }
  }

  stopRecordingAndCheck() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.testState = 'analyzing';

    this.cameraStatus = 'checking';
    this.micStatus = 'pending';
    this.networkStatus = 'pending';

    this.runChecks();
  }

  async runChecks() {
    if (
      this.stream &&
      this.stream.getVideoTracks().length > 0 &&
      this.stream.getVideoTracks()[0].readyState === 'live'
    ) {
      this.cameraStatus = 'success';
    } else {
      this.cameraStatus = 'failure';
    }

    this.micStatus = 'checking';

    const micWorks = await this.isAudioWorking();
    this.micStatus = micWorks ? 'success' : 'failure';

    this.networkStatus = 'checking';

    const networkWorks = await this.checkNetworkSpeed();
    this.networkStatus = networkWorks ? 'success' : 'failure';

    if (
      this.cameraStatus === 'success' &&
      this.micStatus === 'success' &&
      this.networkStatus === 'success'
    ) {
      this.testState = 'completed';
    } else {
      this.testState = 'completed';
    }
    this.cdRef.detectChanges();
  }

  isAudioWorking(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.stream) {
        resolve(false);
        return;
      }

      try {
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(this.stream);
        const analyser = ctx.createAnalyser();
        source.connect(analyser);
        const waveform = new Uint8Array(analyser.fftSize);
        console.log(analyser.fftSize);
        // analyser.getByteTimeDomainData(waveform);

        // ctx.close();

        resolve(waveform.some((v) => v !== 128));
      } catch (e) {
        console.error('Error checking audio:', e);
        resolve(false);
      }
    });
  }

  async checkNetworkSpeed(): Promise<boolean> {
    return await new Promise<boolean>(async (resolve) => {
      try {
        const identity = faker.person.firstName();

        const meetRes = await firstValueFrom(this.meetService.createMeet());
        const meetId = meetRes.meetId;

        const joinRes = await firstValueFrom(this.meetService.joinMeet(meetId, identity));

        if (!joinRes?.success || !joinRes?.token) {
          throw new Error('unexpected error: no token returned');
        }

        const token = joinRes.token;

        const room = await connect(token, {
          name: 'network-test-room',
          audio: true,
          video: false,
          networkQuality: { local: 1 },
        });

        room.localParticipant.once('networkQualityLevelChanged', (level: number) => {
          console.log('network level', level);

          room.disconnect();
          if (level >= 3) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      } catch (error) {
        console.error('network error', error);
        resolve(false);
      }
    });
    this.cdRef.detectChanges();
  }

  playRecording() {
    if (!this.recordedBlobUrl) return;

    const container = this.videoContainer.nativeElement;
    const player = container.firstChild as HTMLVideoElement;

    if (!player) return;

    player.srcObject = null;
    player.src = this.recordedBlobUrl;
    player.muted = false;
    this.isPlaying = true;

    player.play().catch((err) => {
      this.isPlaying = false;
      console.error('error playing recording:', err);
    });
    player.onpause = () => (this.isPlaying = false);
    player.onended = () => {
      this.isPlaying = false;
    };
  }

  tryAgain() {
    this.isPlaying = false;

    if (this.recordedBlobUrl) {
      URL.revokeObjectURL(this.recordedBlobUrl);
      this.recordedBlobUrl = null;
    }

    this.recordedChunks = [];
    const container = this.videoContainer.nativeElement;
    const player = container.firstChild as HTMLVideoElement;

    if (player) {
      player.pause();
      player.src = '';
      player.removeAttribute('src');
      player.srcObject = null;

      if (this.blur && this.localVideoTrack) {
        const processed = this.localVideoTrack.attach() as HTMLVideoElement;

        processed.muted = true;

        container.replaceChildren(processed);
        processed.play().catch(() => {});
      } else if (this.stream) {
        this.videoElement.nativeElement.src = '';
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.muted = true;

        container.replaceChildren(this.videoElement.nativeElement);
      }
    }

    this.testState = 'idle';
    this.cameraStatus = 'pending';
    this.micStatus = 'pending';
    this.networkStatus = 'pending';
    this.hasAgreed = false;

    this.cdRef.detectChanges();
  }

  joinMeeting() {
    if (this.testState === 'completed' && this.hasAgreed) {
      const meetId = this.stateService.meetId;
      if (!meetId) {
        this.router.navigateByUrl('/lobby');
        return;
      }

      const identity = faker.person.fullName();

      this.meetService.joinMeet(meetId, identity).subscribe({
        next: (res) => {
          if (res.success && res.token) {
            this.stateService.setToken(res.token);
            console.log(meetId);
            this.router.navigateByUrl('/meeting');
          }
        },
        error: (err) => console.error(err),
      });
      this.router.navigate(['/meeting']);
    }
  }
}
type CheckStatus = 'pending' | 'checking' | 'success' | 'failure';
type TestState = 'idle' | 'running' | 'analyzing' | 'completed';
