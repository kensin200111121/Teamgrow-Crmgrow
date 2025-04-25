import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { SMTP_CONNECT_REQUIRED } from '@constants/variable.constants';
@Injectable({
  providedIn: 'root'
})
export class SyncService {
  constructor() {}
  smtpConnectRequired: BehaviorSubject<string> = new BehaviorSubject(
    SMTP_CONNECT_REQUIRED
  );
  smtpConnectRequired$ = this.smtpConnectRequired.asObservable();
}
