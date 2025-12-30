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
    //validation --
    if (!meetId) return { status: 400, message: 'meet id is required' };
    if (!identity) return { status: 400, message: 'identity is required' };
    if (!this.isValidMeetId(meetId)?.success)
      return { status: 404, message: 'meet id doest exists' };
    //
    const count: number = this.rooms.get(meetId) ?? 0;
    if (count > 2) {
      return { status: 409, messsage: 'room is full' };
    }
    const { AccessToken } = jwt;
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID || '',
      process.env.TWILIO_API_SID || '',
      process.env.TWILIO_API_SECRET || '',
      {
        identity,
        ttl: 3600,
      },
    );

    token.addGrant(new VideoGrant({ room: meetId }));
    this.rooms.set(meetId, count + 1);
    console.log(this.rooms.get(meetId));
    return {
      token: token.toJwt(),
      meetId,
      success: true,
    };
  }
  leaveMeet(meetId: String) {
    //validation --
    if (!meetId) return { status: 400, message: 'meet id is required' };

    if (!this.isValidMeetId(meetId)?.success)
      return { status: 404, message: 'meet id is doest exists' };
    const count = this.rooms.get(meetId) ?? 0;
    if (count > 0) {
      this.rooms.set(meetId, count - 1);
    }
    return { status: 200, success: true };
  }
  isValidMeetId(meetId: String) {
    if (!meetId) return;
    console.log(meetId);
    if (this.rooms.has(meetId)) {
      return { status: 200, success: true };
    } else {
      return { status: 404, success: false };
    }
  }
}
