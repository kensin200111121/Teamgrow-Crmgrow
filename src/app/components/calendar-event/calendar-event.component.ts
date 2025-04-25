import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CalendarRecurringDialogComponent } from '@components/calendar-recurring-dialog/calendar-recurring-dialog.component';
import { AppointmentService } from '@services/appointment.service';
import { ToastrService } from 'ngx-toastr';
import { CalendarEventDialogComponent } from '@components/calendar-event-dialog/calendar-event-dialog.component';
import { CalendarDeclineComponent } from '@components/calendar-decline/calendar-decline.component';
import { Subscription } from 'rxjs';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { DialogSettings } from '@constants/variable.constants';
import moment from 'moment-timezone';

@Component({
  selector: 'app-calendar-event',
  templateUrl: './calendar-event.component.html',
  styleUrls: ['./calendar-event.component.scss']
})
export class CalendarEventComponent implements OnInit {
  @Input('event') viewEvent;
  @Input('events') events;
  @Input('hasLink') hasLink = false;
  @Output() onClose: EventEmitter<any> = new EventEmitter(null);
  event = {
    title: '',
    start: '',
    end: '',
    meta: {
      calendar_id: '',
      contacts: [],
      description: '',
      event_id: '',
      guests: [],
      is_organizer: '',
      location: '',
      isGoogleMeet: false,
      hangoutLink: '',
      recurrence: '',
      recurrence_id: '',
      type: '',
      organizer: '',
      originalStartTime: '',
      originalEndTime: '',
      until: ''
    }
  };
  zoom_link =
    'https://us02web.zoom.us/j/85352609457?pwd=ZVh1Q3JtL3hja2lCamZiMG5Sbld5dz09';
  accepting = false;
  acceptSubscription: Subscription;
  declining = false;
  declineSubscription: Subscription;

  responseStatus = 'needsAction';

  constructor(
    private dialog: MatDialog,
    private appointmentService: AppointmentService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.event = this.viewEvent;
    // calendar
    if (this.viewEvent.meta) {
      const calendars = this.appointmentService.subCalendars.getValue();
      const currentCalendar = calendars[this.viewEvent.meta.calendar_id];
      if (!currentCalendar) {
        return;
      }
      const calendarEmail = currentCalendar.account;
      if (this.viewEvent.meta.guests && this.viewEvent.meta.guests.length) {
        this.viewEvent.meta.guests.some((guest) => {
          if (guest.email === calendarEmail) {
            this.responseStatus = guest.response;
            return true;
          }
        });
      }
    }
  }

  update(): void {
    this.dialog.open(CalendarEventDialogComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      disableClose: true,
      data: {
        mode: 'dialog',
        event: this.viewEvent,
        events: this.events
      }
    });
  }

  remove(): void {
    const calendars = this.appointmentService.subCalendars.getValue();
    const currentCalendar = calendars[this.event.meta.calendar_id];
    if (!currentCalendar) {
      // OPEN ALERT & CLOSE OVERLAY
      return;
    }
    const connected_email = currentCalendar.account;

    if (this.event.meta.recurrence_id) {
      this.dialog
        .open(CalendarRecurringDialogComponent, {
          position: { top: '40vh' },
          width: '100vw',
          maxWidth: '320px',
          disableClose: true,
          data: {
            title: 'Delete recurring event'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            if (res.type == 'own') {
              delete this.event.meta['recurrence_id'];
            }
            this.appointmentService
              .removeEvents(
                this.event.meta.event_id,
                this.event.meta.recurrence_id,
                this.event.meta.calendar_id,
                connected_email
              )
              .subscribe((res) => {
                if (res['status']) {
                  const data = {
                    event_id: this.event.meta.event_id,
                    recurrence_id: this.event.meta.recurrence_id,
                    calendar_id: this.event.meta.calendar_id,
                    connected_email: connected_email
                  };
                  this.appointmentService.updateCommand.next({
                    command: 'delete',
                    data: data
                  });
                  // this.toast.success('Event is removed successfully');
                }
              });
          }
        });
    } else {
      delete this.event['recurrence_id'];
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Delete Meeting',
            message: 'Are you sure to remove this meeting?',
            label: 'Delete',
            mode: 'warning'
          }
        })
        .afterClosed()
        .subscribe((answer) => {
          if (answer) {
            this.appointmentService
              .removeEvents(
                this.event.meta.event_id,
                this.event.meta.recurrence_id,
                this.event.meta.calendar_id,
                connected_email
              )
              .subscribe((res) => {
                if (res['status']) {
                  const data = {
                    event_id: this.event.meta.event_id,
                    recurrence_id: this.event.meta.recurrence_id,
                    calendar_id: this.event.meta.calendar_id,
                    connected_email: connected_email
                  };
                  this.appointmentService.updateCommand.next({
                    command: 'delete',
                    data: data
                  });
                  this.onClose.emit({ command: 'delete', data: data });
                  // this.toast.success('Event is removed successfully');
                }
              });
          }
        });
    }
  }

  accept(): void {
    if (!this.event || !this.event.meta) {
      return;
    }
    if (!this.event.meta.calendar_id || !this.event.meta.event_id) {
      return;
    }
    const calendars = this.appointmentService.subCalendars.getValue();
    const calendar_id = this.event.meta.calendar_id;
    const calendar = calendars[calendar_id];
    const event_id = this.event.meta.event_id;
    if (!calendar) {
      return;
    }
    if (this.event.meta.recurrence_id) {
      const recurrence_id = this.event.meta.recurrence_id;
      this.dialog
        .open(CalendarRecurringDialogComponent, {
          position: { top: '40vh' },
          width: '100vw',
          maxWidth: '320px',
          disableClose: true,
          backdropClass: 'event-backdrop',
          panelClass: 'event-panel',
          data: {
            title: 'Accept recurring event'
          }
        })
        .afterClosed()
        .subscribe((answer) => {
          if (!answer) {
            return;
          }
          if (answer.type === 'own') {
            this.acceptEventImpl(calendar.account, calendar_id, event_id, null);
          } else {
            this.acceptEventImpl(
              calendar.account,
              calendar_id,
              null,
              recurrence_id
            );
          }
        });
      return;
    }
    this.acceptEventImpl(calendar.account, calendar_id, event_id, null);
  }

  acceptEventImpl(
    connected_email: string,
    calendar_id: string,
    event_id: string,
    recurrence_id: string
  ): void {
    this.accepting = true;
    this.acceptSubscription && this.acceptSubscription.unsubscribe();
    this.acceptSubscription = this.appointmentService
      .acceptEvent(
        event_id,
        recurrence_id,
        calendar_id,
        connected_email,
        this.event.meta.organizer
      )
      .subscribe((status) => {
        this.accepting = false;
        if (status) {
          this.responseStatus = 'accepted';
          // Update the event
          this.appointmentService.updateCommand.next({
            command: 'accept',
            data: {
              event_id,
              recurrence_id,
              calendar_id,
              connected_email,
              organizer: this.event.meta.organizer
            }
          });
        }
      });
  }

  decline(): void {
    if (!this.event || !this.event.meta) {
      return;
    }
    if (!this.event.meta.calendar_id || !this.event.meta.event_id) {
      return;
    }
    const calendars = this.appointmentService.subCalendars.getValue();
    const calendar_id = this.event.meta.calendar_id;
    const calendar = calendars[calendar_id];
    const event_id = this.event.meta.event_id;
    if (!calendar) {
      return;
    }
    if (this.event.meta.recurrence_id) {
      const recurrence_id = this.event.meta.recurrence_id;
      this.dialog
        .open(CalendarRecurringDialogComponent, {
          position: { top: '40vh' },
          width: '100vw',
          maxWidth: '320px',
          disableClose: true,
          backdropClass: 'event-backdrop',
          panelClass: 'event-panel',
          data: {
            title: 'Decline recurring event'
          }
        })
        .afterClosed()
        .subscribe((answer) => {
          if (!answer) {
            return;
          }
          if (answer.type === 'own') {
            this.declineEventImpl(
              calendar.account,
              calendar_id,
              event_id,
              null
            );
          } else {
            this.declineEventImpl(
              calendar.account,
              calendar_id,
              null,
              recurrence_id
            );
          }
        });
      return;
    }
    this.declineEventImpl(calendar.account, calendar_id, event_id, null);
  }

  declineEventImpl(
    connected_email: string,
    calendar_id: string,
    event_id: string,
    recurrence_id: string
  ): void {
    this.dialog
      .open(CalendarDeclineComponent, {
        width: '96vw',
        maxWidth: '320px',
        backdropClass: 'event-backdrop',
        panelClass: 'event-panel'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.declining = true;
          this.declineSubscription && this.declineSubscription.unsubscribe();
          this.declineSubscription = this.appointmentService
            .declineEvent(
              event_id,
              recurrence_id,
              calendar_id,
              connected_email,
              this.event.meta.organizer,
              res.message
            )
            .subscribe((status) => {
              this.declining = false;
              if (status) {
                // Update the event
                this.responseStatus = 'declined';
                this.appointmentService.updateCommand.next({
                  command: 'decline',
                  data: {
                    event_id,
                    recurrence_id,
                    calendar_id,
                    connected_email,
                    organizer: this.event.meta.organizer
                  }
                });
              }
            });
        }
      });
  }

  getCalendarLink(): string[] {
    if (this.event && this.event.start) {
      const due_date = new Date(this.event.start + '');
      const month = due_date.getMonth() + 1;
      const year = due_date.getFullYear();
      const route = `/calendar/month/${year}/${month}/1`;
      return [route];
    }
    return [];
  }

  closeWithData(data: any): void {
    this.onClose.emit(data);
  }

  close(): void {
    this.onClose.emit();
  }

  getProfileDate(selectedDay) {
    return moment
      .tz(selectedDay, moment()['_z']?.name)
      .format('YYYY-MM-DDTHH:mm:ss');
  }
}
