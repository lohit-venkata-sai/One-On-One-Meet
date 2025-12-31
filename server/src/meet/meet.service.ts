import { Injectable } from '@nestjs/common';
import { jwt } from 'twilio';
import { ConfigService } from '@nestjs/config';
import { VideoGrant } from 'twilio/lib/jwt/AccessToken';

type UserState = 'in_room' | 'left' | 'disconnected';

interface RoomInfo {
  count: number;
  users: Map<string, UserState>;
}

@Injectable()
export class MeetService {
  rooms = new Map<string, RoomInfo>();

  constructor(private config: ConfigService) {}

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  createMeet() {
    const meetId = this.generateCode();

    this.rooms.set(meetId, {
      count: 0,
      users: new Map<string, UserState>(),
    });

    return { meetId };
  }

  joinMeet(meetId: string, identity: string) {
    if (!meetId) return { status: 400, message: 'meet id is required' };
    if (!identity) return { status: 400, message: 'identity is required' };

    const room = this.rooms.get(meetId);
    if (!room) return { status: 404, message: 'room not found' };

    if (room.count >= 2) {
      return { status: 409, message: 'room is full' };
    }
    room.users.set(identity, 'in_room');
    room.count++;

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

    return {
      token: token.toJwt(),
      meetId,
      success: true,
    };
  }

  leaveMeet(meetId: string, identity: string) {
    if (!meetId) return { status: 400, message: 'meet id is required' };

    const room = this.rooms.get(meetId);
    if (!room) return { status: 404, message: 'room not found' };

    if (identity) {
      room.users.set(identity, 'left');
    }

    if (room.count > 0) {
      room.count--;
    }

    if (room.count === 0) {
      this.rooms.delete(meetId);
    }

    return { status: 200, success: true };
  }

  markDisconnected(meetId: string, identity: string) {
    const room = this.rooms.get(meetId);
    if (!room) return;

    room.users.set(identity, 'disconnected');
  }

  rejoin(meetId: string, identity: string) {
    const room = this.rooms.get(meetId);
    if (!room) return;

    room.users.set(identity, 'in_room');
  }

  isValidMeetId(meetId: string) {
    if (this.rooms.has(meetId)) {
      return { status: 200, success: true };
    } else {
      return { status: 404, success: false };
    }
  }

  // getRoomState(meetId: string) {
  //   const room = this.rooms.get(meetId);
  //   if (!room) return { status: 404, message: 'room not found' };

  //   return {
  //     status: 200,
  //     count: room.count,
  //     users: Object.fromEntries(room.users),
  //   };
  // }
}
