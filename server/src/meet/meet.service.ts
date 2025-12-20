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
    const count = this.rooms.get(meetId);
    if (!identity) {
      return { status: 401, message: 'identity is required' };
    }
    if (!count) {
      return { status: 404, message: 'room doest exists' };
    }
    if (count >= 2) {
      return { status: 401, messsage: 'room is full' };
    }
    this.rooms.set(meetId, count + 1);
    const { AccessToken } = jwt;
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_SECRET!,
      {
        identity,
        ttl: 3600,
      },
    );
    token.addGrant(new VideoGrant({ room: meetId }));
    return {
      token: token.toJwt(),
      meetId,
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
}
