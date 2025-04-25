import { Component, OnInit } from '@angular/core';
import { SspaService } from '../../services/sspa.service';
import { RouterService } from '@app/services/router.service';
import {
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { IntegrationDialogComponent } from '@app/components/integration-dialog/integration-dialog.component';
import { environment } from '@environments/environment';


@Component({
  selector: 'app-calendar-connect',
  templateUrl: './calendar-connect.component.html',
  styleUrls: ['./calendar-connect.component.scss']
})
export class CalendarConnectComponent implements OnInit {
  readonly isVortex = environment.isSspa;
  calendars = [
    {
      id: 'google_calendar',
      summary: '',
      video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
      image: '',
      type: 'Calendar',
      title: 'Google Calendar',
      icon: 'img/google_calendar.svg',
      description: 'integration_google_calendar',
      isConnected: false,
      popular: true,
      authorizedInfo: [],
      isMultiple: true,
      guide: []
    },
    {
      id: 'outlook_calendar',
      summary: '',
      video: 'https://player.vimeo.com/video/798804584?h=e15a230d40',
      image: '',
      type: 'Calendar',
      title: 'Outlook Calendar',
      icon: 'img/outlook_calendar.svg',
      description: 'integration_outlook_calendar',
      isConnected: false,
      popular: false,
      authorizedInfo: [],
      isMultiple: true,
      guide: []
    }
  ];
  constructor(
    public sspaService: SspaService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CalendarConnectComponent>,
    private routerService: RouterService
  ) {}

  ngOnInit(): void {}

  close(): void {
    this.dialogRef.close();
    this.routerService.goBack();
  }

  connectCalendar(calendarIdx: number): void {
    this.dialog.open(IntegrationDialogComponent, {
      width: '96%',
      maxWidth: '880px',
      height: '80vh',
      maxHeight: '650px',
      data: {
        integration: this.calendars[calendarIdx]
      }
    });
  }
}
