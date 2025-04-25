import { Component, Input } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { AppointmentService } from '@services/appointment.service';
import { HandlerService } from '@services/handler.service';
import { CALENDAR_DURATION } from '@constants/variable.constants';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { ToastrService } from 'ngx-toastr';
import { CalendarEventDialogComponent } from '@components/calendar-event-dialog/calendar-event-dialog.component';
import moment from 'moment-timezone';
import { SspaService } from '../../../services/sspa.service';

const ZONEREG = /-[0-1][0-9]:00|Z/;

@Component({
  selector: 'app-contact-meeting-action-item',
  templateUrl: './contact-meeting-action-item.component.html',
  styleUrls: ['./contact-meeting-action-item.component.scss']
})
export class ContactMeetingActionItemComponent extends ContactActivityItemSuperComponent {
  type: ContactDetailActionType = 'appointment';
  @Input() protected contactId: string;
  @Input() activity: ContactActivityActionV2;
  @Input() isPending: boolean;

  durations = CALENDAR_DURATION;
  constructor(
    protected contactDetailInfoService: ContactDetailInfoService,
    private appointmentService: AppointmentService,
    private handlerService: HandlerService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    public sspaService: SspaService
  ) {
    super();
  }

  ngOnInit(): void {}

  private formatEvents(event: any) {
    let _start = moment(event.due_start).toDate();
    let _end = moment(event.due_end).toDate();
    if (event.service_type === 'outlook') {
      if (!event.is_full) {
        if (!ZONEREG.test(event.due_start)) {
          _start = moment(event.due_start + 'Z').toDate();
        }
        if (!ZONEREG.test(event.due_end)) {
          _end = moment(event.due_end + 'Z').toDate();
        }
      }
    }
    // TODO: function
    const _formattedEvent = {
      title: event.title,
      start: _start,
      end: _end,
      meta: {
        contacts: event.contacts,
        calendar_id: event.calendar_id,
        description: event.description,
        location: event.location,
        isGoogleMeet: event.isGoogleMeet,
        hangoutLink: event.hangoutLink,
        type: event.type,
        guests: event.guests,
        event_id: event.event_id,
        recurrence: event.recurrence,
        recurrence_id: event.recurrence_id,
        is_organizer: event.is_organizer,
        organizer: event.organizer,
        timezone: event.timezone,
        service_type: event.service_type,
        is_full: event.is_full,
        originalStartTime: undefined,
        originalEndTime: undefined,
        until: undefined
      }
    };
    if (event.is_full) {
      _formattedEvent['date'] = event.due_start;
    }
    return _formattedEvent;
  }

  /**
   * Remove activity
   * @param activity: activity content to remove
   */
  removeActivity(activity: any): void {
    const detail = activity;
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Remove Appoinment',
          message: 'Are you sure you want to remove this appointment?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.status && detail?.action?.event_id) {
          const payload = {
            event_id: detail.action.event_id,
            calendar_id: detail.action.calendar_id,
            connected_email: detail.action.calendar_id,
            contact_id: this.contactId
          };
          this.appointmentService.removeGuest(payload).subscribe((res) => {
            if (res) {
              this.handlerService.reload$();
              this.contactDetailInfoService.callbackForRemoveContactAction(
                activity.actionId,
                'appointment'
              );
            }
          });
        }
      });
  }

  getTime(start: any, end: any): any {
    const start_hour = new Date(start).getHours();
    const end_hour = new Date(end).getHours();
    const start_minute = new Date(start).getMinutes();
    const end_minute = new Date(end).getMinutes();
    const duration = end_hour - start_hour + (end_minute - start_minute) / 60;
    const durationTime = this.durations.filter(
      (time) => time.value == duration
    );
    if (durationTime && durationTime.length) {
      return durationTime[0].text;
    } else {
      return '';
    }
  }

  openAppointmentDlg(activity): void {
    const _events = this.formatEvents(activity.action);
    this.dialog
      .open(CalendarEventDialogComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          mode: 'dialog',
          event: _events,
          activity: activity
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactDetailInfoService.callbackForAddContactAction(
            this.contactId,
            'appointment'
          );
        }
      });
  }
}
