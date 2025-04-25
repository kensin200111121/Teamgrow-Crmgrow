import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from '@services/notification.service';
import { UserService } from '@services/user.service';
import { DialerService } from '@services/dialer.service';

@Component({
  selector: 'app-dialer-report',
  templateUrl: './dialer-report.component.html',
  styleUrls: ['./dialer-report.component.scss']
})
export class DialerReportComponent implements OnInit, OnDestroy {
  dialCallNote = '';
  dialCallStatus = '';
  logs = [];
  saving = false;

  constructor(
    public userService: UserService,
    private dialerService: DialerService,
    private dialogRef: MatDialogRef<DialerReportComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    if (!this.data?.deal) {
      this.dialogRef.close();
    }
  }

  ngOnInit(): void {
    this._initLogs();
  }

  ngOnDestroy(): void {}

  private _initLogs(): void {
    const _contactNameDic = (this.dialerService.command?.contacts || []).reduce(
      (names, e) => ({ ...names, [e.contactId]: e.name }),
      {}
    );
    const savedLogs = this.dialerService.logs
      .getValue()
      .filter((e) => e.contactId !== 'callCursor');
    this.logs = JSON.parse(JSON.stringify(savedLogs));
    this.logs.forEach((log) => {
      log.label = this.getLabel(log);
      log.name = _contactNameDic[log.contactId];
    });
  }

  close(): void {
    const contacts = this.logs.map((e) => e.contactId);
    const user = this.userService.profile.getValue();
    const userId = user._id;
    if (!this.dialCallNote) {
      return;
    }
    const notification = {
      user: userId, //user information
      type: 'personal',
      criteria: 'dialer_call',
      detail: {
        data: this.logs,
        content: this.dialCallNote,
        status: this.dialCallStatus
      },
      contact: contacts,
      content: this.dialCallNote,
      status: this.dialCallStatus,
      deal: this.dialerService?.command?.deal,
      uuid: this.dialerService?.command?.uuid
    };
    this.saving = true;
    this.dialerService.saveDealDialer(notification).subscribe((res) => {
      this.saving = false;
      this.dialerService.isCallLogged.next(true);
      if (res && res.status) {
        this.dialogRef.close({ data: res.data });
      }
    });
  }

  private getLabel(log): string {
    if (log.outcome === 'VOICEMAIL') {
      return 'Voice Message';
    } else if (log.outcome === 'CALLBACK') {
      return 'Callback Set';
    } else if (log.answered) {
      return 'Interested';
    }
    return 'No Answer';
  }
}
