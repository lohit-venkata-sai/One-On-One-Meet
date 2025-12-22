import { Injectable } from '@nestjs/common';
import { jwt } from 'twilio';
import { ConfigService } from '@nestjs/config';
import { VideoGrant } from 'twilio/lib/jwt/AccessToken';
@Injectable()
export class MeetService {
  rooms = new Map<String, number>();
  constructor(private config: ConfigService) {}
  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  createMeet() {
    const meetId = this.generateCode();
    this.rooms.set(meetId, 0);
    return { meetId };
  }
  joinMeet(meetId: string, identity: string) {
    const count: number = this.rooms.get(meetId) ?? 0;
    if (!identity) {
      return { status: 400, message: 'identity is required' };
    }

    if (!this.rooms.has(meetId)) {
      return { status: 404, message: 'meet doest exists' };
    }
    if (count >= 2) {
      return { status: 409, messsage: 'room is full' };
    }
    this.rooms.set(meetId, count + 1);
    const { AccessToken } = jwt;
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_SID!,
      process.env.TWILIO_API_SECRET!,
      {
        identity,
        ttl: 3600,
      },
    );
    console.log('this is count', count + 1);
    token.addGrant(new VideoGrant({ room: meetId }));
    return {
      token: token.toJwt(),
      meetId,
      success: true,
    };
  }
  leaveMeet(meetId: String) {
    const count = this.rooms.get(meetId);
    if (!count) {
      return;
    }
    if (count <= 1) {
      this.rooms.delete(meetId);
    } else {
      this.rooms.set(meetId, count - 1);
    }
    return { status: 200, success: true };
  }
  isValidMeetId(meetId: String) {
    console.log(meetId);
    if (this.rooms.has(meetId)) {
      return { status: 200, success: true };
    } else {
      return { status: 404, success: false };
    }
  }
}
