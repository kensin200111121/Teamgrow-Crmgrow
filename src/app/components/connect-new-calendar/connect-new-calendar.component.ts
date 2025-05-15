import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from '@environments/environment';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-connect-new-calendar',
  templateUrl: './connect-new-calendar.component.html',
  styleUrls: ['./connect-new-calendar.component.scss']
})
export class ConnectNewCalendarComponent implements OnInit {
  isVortex = environment.isSspa;

  constructor(
    public dialogRef: MatDialogRef<ConnectNewCalendarComponent>,
    private userService: UserService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  connectCalendar(type: string): void {
    if (environment.isSspa) {
      const urls = {
        gmail: `/account/integrations?provider=google_calendar`,
        outlook: `/account/integrations?provider=microsoft_calendar`
      };

      if (urls[type]) {
        const nwTab = window.open(urls[type], '_blank');
        nwTab.focus();
        this.dialogRef.close();
      }
    } else {
      if (type === 'gmail' || type === 'outlook') {
        this.userService.requestCalendarSyncUrl(type).subscribe(
          (res) => {
            if (res && res['status']) {
              location.href = res['data'];
            }
          },
          () => {}
        );
      }
    }
  }
}
