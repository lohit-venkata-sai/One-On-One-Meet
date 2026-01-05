import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MeetService {
  constructor(private http: HttpClient) {}
  apiUrl = environment.apiUrl;
  createMeet(): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, {});
  }
  joinMeet(meetId: string, identity: string): Observable<JoinMeetResponse> {
    return this.http.post<JoinMeetResponse>(`${this.apiUrl}/join`, { meetId, identity });
  }
  leaveMeet(meetId: string, identity: string): Observable<MeetValidationAndLeaveMeetResponse> {
    return this.http.post<MeetValidationAndLeaveMeetResponse>(`${this.apiUrl}/leave`, {
      meetId,
      identity,
    });
  }
  isMeetIdvalid(meetId: string) {
    return this.http.get<MeetValidationAndLeaveMeetResponse>(`${this.apiUrl}/isvalid/${meetId}`);
  }
}
export interface MeetValidationAndLeaveMeetResponse {
  success?: boolean;
  status: number;
  message?: string;
}
export interface JoinMeetResponse {
  success: boolean;
  token: string;
}
