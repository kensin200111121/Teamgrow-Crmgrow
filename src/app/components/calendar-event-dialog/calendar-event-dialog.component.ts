import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnInit,
  Optional,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import {
  TIMES,
  CALENDAR_DURATION,
  RECURRING_TYPE
} from '@constants/variable.constants';
import { ContactService } from '@services/contact.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DealsService } from '@services/deals.service';
import { OverlayService } from '@services/overlay.service';
import { AppointmentService } from '@services/appointment.service';
import { CalendarRecurringDialogComponent } from '@components/calendar-recurring-dialog/calendar-recurring-dialog.component';
import { Contact } from '@models/contact.model';
import moment from 'moment-timezone';
import { IntegrationService } from '@services/integration.service';
import { UserService } from '@services/user.service';
import { getUserTimezone, numPad } from '@app/helper';
import * as _ from 'lodash';
import { fromEvent, merge, Subscription } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { ConfirmComponent } from '../confirm/confirm.component';
import { DOCUMENT } from '@angular/common';
import { environment } from '@environments/environment';
import { Garbage } from '@models/garbage.model';
import { SelectCalendarComponent } from '@app/components/select-calendar/select-calendar.component';
import { DateInputComponent } from '@app/components/date-input/date-input.component';
import { SelectTimezoneComponent } from '@app/components/select-timezone/select-timezone.component';
import { InputContactsComponent } from '@app/components/input-contacts/input-contacts.component';

interface Event {
  title: string;
  due_start: string;
  due_end: string;
  guests: any[];
  contacts: any[];
  calendar_id: string;
  location: string;
  description: string;
  event_id: string;
  recurrence: string;
  recurrence_id: string;
  remove_contacts: any;
  is_organizer: boolean;
  appointment: string;
  organizer: string;
  timezone: any;
  is_full: boolean;
  isGoogleMeet: boolean;
  hangoutLink: string;
  originalStartTime: string;
  originalEndTime: string;
  until: string;
}

@Component({
  selector: 'app-calendar-event-dialog',
  templateUrl: './calendar-event-dialog.component.html',
  styleUrls: ['./calendar-event-dialog.component.scss']
})
export class CalendarEventDialogComponent implements OnInit {
  @Input() mode: 'dialog' | 'overlay' = 'dialog'; // Determines whether to use dialog or overlay
  @Input('start_date') start_date: Date;
  @Input('events') events = [];
  @Input('user_email') user_email = '';
  @Input('type') type = '';
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onCreate: EventEmitter<any> = new EventEmitter();
  @ViewChild(SelectCalendarComponent) selectCalendar: SelectCalendarComponent;
  @ViewChild(DateInputComponent) dateInput: DateInputComponent;
  @ViewChild(SelectTimezoneComponent) selectTimezoneRef: SelectTimezoneComponent;
  @ViewChild(InputContactsComponent) inputContacts: InputContactsComponent;

  readonly isSspa = environment.isSspa;
  garbage: Garbage = new Garbage();
  times = TIMES;
  calendar_durations = CALENDAR_DURATION;
  recurrings = RECURRING_TYPE;
  minDate;

  submitted = false;
  isLocationOpen = false;
  calendar;
  due_time = '12:00:00.000';
  selectedDateTime;
  duration = 0.5;
  contacts: Contact[] = [];
  keepContacts: Contact[] = [];
  event: Event = {
    title: '',
    due_start: '',
    due_end: '',
    guests: [],
    contacts: [],
    calendar_id: '',
    location: '',
    description: '',
    event_id: '',
    recurrence: '',
    recurrence_id: '',
    remove_contacts: [],
    is_organizer: false,
    appointment: '',
    organizer: '',
    timezone: moment()['_z']?.name ? moment()['_z'].name : moment.tz.guess(),
    is_full: false,
    isGoogleMeet: false,
    hangoutLink: '',
    originalStartTime: '',
    originalEndTime: '',
    until: ''
  };
  originalEvent: Event = {
    title: '',
    due_start: '',
    due_end: '',
    guests: [],
    contacts: [],
    calendar_id: '',
    location: '',
    description: '',
    event_id: '',
    recurrence: '',
    recurrence_id: '',
    remove_contacts: [],
    is_organizer: false,
    appointment: '',
    organizer: '',
    timezone: moment()['_z']?.name ? moment()['_z'].name : moment.tz.guess(),
    is_full: false,
    isGoogleMeet: false,
    hangoutLink: '',
    originalStartTime: '',
    originalEndTime: '',
    until: ''
  };

  isRepeat = false;
  isLoading = false;

  submitType = 'create';
  isDeal = false;
  deal;
  meetingType = '';

  contactLoadSubscription: Subscription;
  loadSubscription: Subscription;
  garbageSubscription: Subscription;
  private documentScrollSubscription: Subscription;
  private dialogScrollSubscription: Subscription;
  contactLoading = false;

  originalRecurrence = '';
  oldEvent;
  zoomCreating = false;
  zoomEnableAccount = [
    'super@crmgrow.com',
    'matt@crmgrow.com',
    'huyam@crmgrow.com'
  ];
  calendars_info = [];
  @ViewChild('locationSelector') selector: MatSelect;
  isUser = false;
  modalScrollHandler: Subscription;

  constructor(
    private dialog: MatDialog,
    @Optional() private dialogRef: MatDialogRef<CalendarEventDialogComponent>,
    private appointmentService: AppointmentService,
    private overlayService: OverlayService,
    private integrationService: IntegrationService,
    private contactService: ContactService,
    private dealsService: DealsService,
    private userService: UserService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(MAT_DIALOG_DATA) @Optional() public data: any,
    private el: ElementRef,
  ) {
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
    });

    if (this.data) {
      this.user_email = this.data.user_email;
    }
    const today = new Date();
    this.selectedDateTime = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
    this.minDate = { ...this.selectedDateTime };

    if (this.data && this.data.contacts) {
      this.keepContacts = this.data.contacts;
      this.contacts = [...this.data.contacts];
    }

    if (this.data && this.data.call) {
      const call = this.data.call;
      let selectedTime;
      if (this.data.confirmed_at) {
        selectedTime = moment(this.data.confirmed_at);
      } else {
        selectedTime = moment(call.proposed_at[0]);
      }
      this.selectedDateTime = {
        year: selectedTime.year(),
        month: selectedTime.month() + 1,
        day: selectedTime.date()
      };
      this.due_time = selectedTime.format('hh:mm:ss') + '.000';
      if (call.duration == 15) {
        this.duration = CALENDAR_DURATION[0].value;
      } else if (call.duration == 30) {
        this.duration = CALENDAR_DURATION[1].value;
      } else if (call.duration == 45) {
        this.duration = CALENDAR_DURATION[2].value;
      } else if (call.duration == 60) {
        this.duration = CALENDAR_DURATION[3].value;
      }
      this.event.title = call.subject;
      this.event.description = call.description;
    }

    if (this.data && this.data.deal) {
      this.isDeal = true;
      this.deal = this.data.deal;
    }
    this.calendars_info = this.appointmentService.calendars.getValue();

    const user = this.userService.profile.getValue();
    if (user.time_zone_info) {
      this.event.timezone = getUserTimezone(user, false);
    }
  }

  ngOnInit(): void {
    if (this.mode === 'dialog') {
      if (this.data && this.data.event) {
        this.events = this.data.events;
        this.oldEvent = this.data.event;
        if (this.data.event.meta.recurrence == undefined) {
          this.data.event.meta.recurrence = '';
        }
        if (
          this.data.event.meta.isGoogleMeet &&
          this.data.event.meta.hangoutLink
        ) {
          this.meetingType = 'google';
        }
        if (
          this.data.event.meta.location &&
          this.data.event.meta.location.includes('zoom.us')
        ) {
          this.meetingType = 'zoom';
        }
        this.originalEvent.title = this.data.event.title;
        this.originalEvent.due_start = this.data.event.start;
        this.originalEvent.due_end = this.data.event.end;
        this.originalEvent.guests = this.data.event.meta.guests;
        this.originalEvent.contacts = this.data.event.meta.contacts;
        this.originalEvent.calendar_id = this.data.event.meta.calendar_id;
        this.originalEvent.location = this.data.event.meta.location;
        this.originalEvent.description = this.data.event.meta.description;
        this.originalEvent.event_id = this.data.event.meta.event_id;
        this.originalEvent.recurrence = this.data.event.meta.recurrence;
        this.originalEvent.recurrence_id = this.data.event.meta.recurrence_id;
        this.originalEvent.remove_contacts = this.data.event.meta.remove_contacts;
        this.originalEvent.is_organizer = this.data.event.meta.is_organizer;
        this.originalEvent.appointment = this.data.event.meta.appointment;
        this.originalEvent.organizer = this.data.event.meta.organizer;
        this.originalEvent.timezone = this.data.event.meta.timezone;
        this.originalEvent.is_full = this.data.event.meta.is_full;
        this.originalEvent.isGoogleMeet = this.data.event.meta.isGoogleMeet;
        this.originalEvent.hangoutLink = this.data.event.meta.hangoutLink;
        this.originalEvent.originalStartTime =
          this.data.event.meta.originalStartTime;
        this.originalEvent.originalEndTime = this.data.event.meta.originalEndTime;
        this.originalEvent.until = this.data.event.meta.until;
        this.formatEvent();
      }
    } else {
      if (this.start_date) {
        const dateString = moment
          .tz(this.start_date, moment()['_z']?.name)
          .format('YYYY-MM-DD');
        const dateStringComponents = dateString.split('-');
        this.selectedDateTime.year = dateStringComponents[0];
        this.selectedDateTime.month = dateStringComponents[1];
        this.selectedDateTime.day = dateStringComponents[2];
  
        if (this.type != 'month') {
          const timeString = moment
            .tz(this.start_date, moment()['_z']?.name)
            .format('HH:mm');
          this.due_time = `${timeString}:00.000`;
        }
      }
      if (this.event.isGoogleMeet && this.event.hangoutLink) {
        this.meetingType = 'google';
      }
      if (this.event.location.includes('zoom.us')) {
        this.meetingType = 'zoom';
      }
    }

    if (this.document.querySelector('#calender_content')) {
      const wrapperEl = this.document.querySelector('#calender_content');
      const clickEvents = fromEvent(wrapperEl, 'click');
      const scrollEvents = fromEvent(wrapperEl, 'scroll');
      const combinedEvents = merge(clickEvents, scrollEvents);
      this.documentScrollSubscription = combinedEvents.subscribe((event) => {
        if (this.mode === 'dialog' && this.isLocationOpen) {
          this.selector.close();
        }
        this.hideAutocompleteDropdown();
      });
    }
    const overallScrollEvent = fromEvent(this.document, 'scroll');
    this.dialogScrollSubscription = overallScrollEvent.subscribe((event) => {
      if (this.mode === 'dialog' && this.isLocationOpen) {
        this.selector.close();
      }
      this.hideAutocompleteDropdown();
    });

    this.modalScrollHandler = fromEvent(
      this.el.nativeElement.querySelector('#calender_content'),
      'scroll'
    ).subscribe((e: any) => {
      this.closePopups();
    });
  }

  closePopups(): void {
    // Calendar
    if (this.selectCalendar) {
      this.selectCalendar.closePopups();
    }

    // Date
    if (this.dateInput) {
      this.dateInput.close();
    }

    // Timezone
    if (this.selectTimezoneRef) {
      this.selectTimezoneRef.closePopups();
    }

    // Online Meeting
    if (this.selector) {
      this.selector.close();
    }

    // ASSIGN GUESTS
    if (this.inputContacts) {
      this.inputContacts.closePopups();
    }
  }

  ngOnDestroy(): void {
    this.documentScrollSubscription &&
      this.documentScrollSubscription.unsubscribe();
    this.dialogScrollSubscription &&
      this.dialogScrollSubscription.unsubscribe();
  }

  formatEvent(): void {
    this.submitType = 'update';
    this.event.title = this.data.event.title;
    const startYear = this.data.event.start.getFullYear().toString();
    const startMonth = this.data.event.start.getMonth() + 1;
    const startDay = this.data.event.start.getDate();
    const startHour = this.data.event.start.getHours();
    const startMin = this.data.event.start.getMinutes();
    this.due_time = `${numPad(startHour)}:${numPad(startMin)}:00.000`;
    this.duration =
      (this.data.event.end.getTime() - this.data.event.start.getTime()) /
      (60 * 60 * 1000);
    this.selectedDateTime = {
      year: startYear,
      month: startMonth,
      day: startDay
    };
    this.event.description = this.data.event.meta.description;
    this.event.location = this.data.event.meta.location;
    this.event.is_full = this.data.event.meta.is_full;
    this.event.isGoogleMeet = this.data.event.meta.isGoogleMeet;
    this.event.hangoutLink = this.data.event.meta.hangoutLink;
    this.event.recurrence = this.data.event.meta.recurrence;
    this.originalRecurrence = this.data.event.meta.recurrence;
    if (this.event.recurrence) {
      this.isRepeat = true;
    }
    // store the non-ui variables
    this.event.is_organizer = this.data.event.meta.is_organizer;
    this.event.organizer = this.data.event.meta.organizer;
    this.event.recurrence_id = this.data.event.meta.recurrence_id;
    this.event.calendar_id = this.data.event.meta.calendar_id;
    this.event.event_id = this.data.event.meta.event_id;
    this.event.appointment = this.data.event.appointment;
    this.event.contacts = this.data.event.meta.contacts;
    this.event.until = this.data.event.meta.until;
    if (this.data.event.meta.timezone) {
      const timezone = this.data.event.meta.timezone;
      this.event.timezone = timezone;
      const start_time = this.data.event.start;
      // if event is outlook, add the 'Z' to the string
      // if (
      //   this.data.event.meta.service_type === 'outlook' &&
      //   !ZONEREG.test(start_time)
      // ) {
      //   start_time += 'Z';
      // }
      const due_start = moment.tz(start_time, timezone);
      const due_start_year = due_start.format('yyyy');
      const due_start_month = due_start.format('MM');
      const due_start_day = due_start.format('DD');
      const due_start_time = due_start.format('HH:mm:[00].000');
      this.selectedDateTime = {
        year: parseInt(due_start_year),
        month: parseInt(due_start_month),
        day: parseInt(due_start_day)
      };
      this.due_time = due_start_time;
      const dateString =
        this.selectedDateTime.year +
        '-' +
        numPad(this.selectedDateTime.month) +
        '-' +
        numPad(this.selectedDateTime.day) +
        ' ' +
        this.due_time;
      const origin_due_start = moment
        .tz(dateString, this.event.timezone)
        .format();
      const origin_due_end = moment
        .tz(origin_due_start, this.event.timezone)
        .add(this.duration * 60, 'minutes')
        .format();
      this.event.originalStartTime = origin_due_start;
      this.event.originalEndTime = origin_due_end;
    }
    if (
      this.data.event.meta &&
      this.data.event.meta.guests &&
      this.data.event.meta.guests.length
    ) {
      const emails = [];
      const guestStatus = {};
      this.data.event.meta.guests.forEach((e) => {
        const guestEmail = e.email || e;
        if (guestEmail) {
          emails.push(guestEmail);
          if (e.response) guestStatus[guestEmail] = e.response;
        }
      });
      this.contactLoadSubscription = this.contactService
        .loadByEmails(emails)
        .subscribe((contacts) => {
          const contactEmails = [];
          contacts.forEach((contact) => {
            contact.response = guestStatus[contact.email];
            contactEmails.push(contact.email);
          });
          this.contacts = contacts;
          if (contacts.length != emails.length) {
            emails.forEach((email) => {
              if (contactEmails.indexOf(email) !== -1) {
                return;
              }
              const first_name = email.split('@')[0];
              const newContact = new Contact().deserialize({
                first_name,
                email,
                response: guestStatus[email]
              });
              this.contacts.push(newContact);
            });
          }
        });
    }
  }

  submit(): void {
    this.submitted = true;
    if (this.submitType === 'update') {
      this.update();
      return;
    } else {
      this.create();
    }
  }

  update(): void {
    const calendars = this.appointmentService.subCalendars.getValue();
    const currentCalendar = calendars[this.event.calendar_id];
    if (!currentCalendar) {
      // OPEN ALERT & CLOSE OVERLAY
      return;
    }
    // Should select the timezone
    if (!this.event.timezone) {
      return;
    }
    if (!this.event.title) {
      return;
    }
    // Due date setting
    const dateString =
      this.selectedDateTime.year +
      '-' +
      numPad(this.selectedDateTime.month) +
      '-' +
      numPad(this.selectedDateTime.day) +
      ' ' +
      this.due_time;
    const due_start = moment.tz(dateString, this.event.timezone).format();
    const due_end = moment
      .tz(due_start, this.event.timezone)
      .add(this.duration * 60, 'minutes')
      .format();

    this.event.due_start = due_start;
    this.event.due_end = due_end;

    const connected_email = currentCalendar.account;

    // Time string change for the outlook case
    const profile = this.userService.profile.getValue();
    const calendar_list = profile.calendar_list;
    const calendar = calendar_list.find(
      (e) => e.connected_email === connected_email
    );
    if (calendar.connected_calendar_type === 'outlook') {
      const timezone = moment.tz(dateString, this.event.timezone).format('Z');
      this.event.due_start = due_start.replace(timezone, '');
      this.event.due_end = due_end.replace(timezone, '');
    }

    if (this.meetingType === 'google') {
      this.event.isGoogleMeet = true;
      this.event['isZoomMeet'] = false;
      this.event.location = '';
    } else if (this.meetingType === 'zoom') {
      this.event.isGoogleMeet = false;
      this.event['isZoomMeet'] = true;
      this.event.location = '';
    } else {
      this.event.isGoogleMeet = false;
      this.event['isZoomMeet'] = false;
    }

    if (this.event.is_full) {
      const dateString =
        this.selectedDateTime.year +
        '-' +
        numPad(this.selectedDateTime.month) +
        '-' +
        numPad(this.selectedDateTime.day);
      if (calendar.connected_calendar_type === 'outlook') {
        this.event.due_start = dateString;
        this.event.due_end = moment(dateString)
          .add(1, 'day')
          .format('YYYY-MM-DD');
      } else {
        this.event.due_start = moment(dateString).format(
          'YYYY-MM-DD[T00:00:00Z]'
        );
        this.event.due_end = moment(dateString)
          .add(1, 'day')
          .format('YYYY-MM-DD[T00:00:00Z]');
        delete this.event.timezone;
      }
    }

    if (this.contacts.length > 0) {
      const existContacts = [];
      (this.event.contacts || []).forEach((e) => {
        if (e && e._id) {
          existContacts.push(e._id);
        }
      });
      const currentContacts = [];
      this.contacts.forEach((e) => {
        if (e && e._id) {
          currentContacts.push(e._id);
        }
      });
      const removeContacts = _.difference(existContacts, currentContacts);
      const newContacts = _.difference(currentContacts, existContacts);
      this.event.contacts = [];
      this.event.guests = [];
      this.contacts.forEach((contact) => {
        if (contact._id) {
          const data = {
            email: contact.email,
            _id: contact._id
          };
          this.event.contacts.push(contact._id);
        }
        contact.email && this.event.guests.push(contact.email);
      });
    } else {
      this.event.contacts = [];
      this.event.guests = [];
    }
    this.isLoading = true;

    const event = {
      ...this.event,
      service_type: calendar.connected_calendar_type
    };
    if (this.originalRecurrence && this.event.recurrence_id) {
      if (this.originalRecurrence !== this.event.recurrence) {
        if (!this.event.recurrence) {
          this.appointmentService
            .updateEvents({ ...event, connected_email }, this.event.event_id)
            .subscribe(
              (res) => {
                if (res['status'] == true) {
                  this.isLoading = false;
                  this.appointmentService.updateCommand.next({
                    command: 'recurrence',
                    data: { ...event, guests: this.contacts }
                  });
                  this.dialogRef.close(true);
                }
              },
              () => {
                this.isLoading = false;
              }
            );
        } else {
          this.appointmentService
            .updateEvents({ ...event, connected_email }, this.event.event_id)
            .subscribe(
              (res) => {
                if (res['status'] == true) {
                  this.isLoading = false;
                  this.appointmentService.updateCommand.next({
                    command: 'recurrence',
                    data: { ...event, guests: this.contacts }
                  });
                  this.dialogRef.close(true);
                }
              },
              () => {
                this.isLoading = false;
              }
            );
        }
      } else {
        this.dialog
          .open(CalendarRecurringDialogComponent, {
            position: { top: '40vh' },
            width: '100vw',
            maxWidth: '320px',
            disableClose: true
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              if (res.type == 'own') {
                delete event['recurrence_id'];
              }
              if (this.isDeal) {
                this.dealsService
                  .updateAppointment({
                    ...event,
                    connected_email,
                    deal: this.deal
                  })
                  .subscribe((status) => {
                    this.isLoading = false;
                    if (status) {
                      this.dialogRef.close(true);
                    }
                  });
              } else {
                let data;
                if (res.type == 'follow') {
                  data = {
                    ...event,
                    connected_email,
                    originEvent: this.originalEvent,
                    recurring_type: res.type
                  };
                } else {
                  data = {
                    ...event,
                    connected_email,
                    recurring_type: res.type
                  };
                }
                this.appointmentService
                  .updateEvents(data, this.event.event_id)
                  .subscribe(
                    (_res) => {
                      if (_res['status'] == true) {
                        // this.toast.success('Event is updated successfully');
                        this.isLoading = false;
                        if (res.type != 'follow') {
                          this.appointmentService.updateCommand.next({
                            command: 'recurrence',
                            data: { ...event, guests: this.contacts }
                          });
                        } else {
                          this.appointmentService.updateCommand.next({
                            command: 'recurrence',
                            data: { ...event, guests: this.contacts }
                          });
                        }
                        this.dialogRef.close(this.event);
                      }
                    },
                    () => {
                      this.isLoading = false;
                    }
                  );
              }
            } else {
              this.isLoading = false;
            }
          });
      }
    } else {
      if (this.isDeal) {
        this.dealsService
          .updateAppointment({
            ...event,
            connected_email,
            contacts: this.event.contacts,
            deal: this.deal
          })
          .subscribe((status) => {
            this.isLoading = false;
            if (status) {
              this.dialogRef.close(true);
            }
          });
      } else {
        if (this.event.recurrence) {
          this.appointmentService
            .updateEvents({ ...event, connected_email }, this.event.event_id)
            .subscribe(
              (res) => {
                if (res['status'] == true) {
                  this.isLoading = false;
                  // this.toast.success('New Event is created successfully');
                  this.appointmentService.updateCommand.next({
                    command: 'recurrence',
                    data: { ...event, guests: this.contacts }
                  });
                  this.dialogRef.close(true);
                }
              },
              () => {
                this.isLoading = false;
              }
            );
        } else {
          this.appointmentService
            .updateEvents({ ...event, connected_email }, this.event.event_id)
            .subscribe(
              (res) => {
                if (res['status'] == true) {
                  // this.toast.success('Event is updated successfully');
                  this.isLoading = false;
                  this.appointmentService.updateCommand.next({
                    command: 'update',
                    data: { ...event, guests: this.contacts }
                  });
                  this.dialogRef.close(true);
                }
              },
              () => {
                this.isLoading = false;
              }
            );
        }
      }
    }
  }

  create(): void {
    // Should select calendar
    if (!this.calendar) {
      return;
    }
    // Should select the timezone
    if (!this.event.timezone) {
      return;
    }
    if (!this.event.title) {
      return;
    }
    // Due date setting
    const dateString =
      this.selectedDateTime.year +
      '-' +
      numPad(this.selectedDateTime.month) +
      '-' +
      numPad(this.selectedDateTime.day) +
      'T' +
      this.due_time;
    const timezone = moment.tz(dateString, this.event.timezone).format('Z');
    const due_start = dateString + timezone;
    const due_end = moment
      .tz(due_start, this.event.timezone)
      .add(this.duration * 60, 'minutes')
      .format();

    this.event.due_start = due_start;
    this.event.due_end = due_end;

    let responseTime = {}; // this would be used in handler for outlook event creation
    const connected_email = this.calendar.account;
    const calendar_id = this.calendar.id;

    // Time string change for the outlook case
    const profile = this.userService.profile.getValue();
    const calendar_list = profile.calendar_list;
    const calendar = calendar_list.find(
      (e) => e.connected_email === connected_email
    );
    if (calendar.connected_calendar_type === 'outlook') {
      const timezone = moment.tz(dateString, this.event.timezone).format('Z');
      this.event.due_start = due_start.replace(timezone, '');
      this.event.due_end = due_end.replace(timezone, '');
      responseTime = {
        due_start,
        due_end
      };
    }

    if (this.meetingType === 'google') {
      this.event.isGoogleMeet = true;
      this.event['isZoomMeet'] = false;
      this.event.location = '';
    } else if (this.meetingType === 'zoom') {
      this.event.isGoogleMeet = false;
      this.event['isZoomMeet'] = true;
      this.event.location = '';
    } else {
      this.event.isGoogleMeet = false;
      this.event['isZoomMeet'] = false;
    }

    this.isLoading = true;
    this.event.contacts = [];
    this.event.guests = [];

    if (this.contacts.length > 0) {
      this.contacts.forEach((contact) => {
        if (contact._id) {
          const data = {
            _id: contact._id,
            email: contact.email
          };
          this.event.contacts.push(data);
        }
        contact.email && this.event.guests.push(contact.email);
      });
    }

    if (this.isDeal) {
      const dealContacts = [];
      if (this.contacts.length > 0) {
        for (const item of this.contacts) {
          dealContacts.push(item._id);
        }
      }
      const data = {
        ...this.event,
        contacts: dealContacts,
        deal: this.deal,
        connected_email,
        calendar_id,
        service_type: calendar.connected_calendar_type
      };
      this.dealsService.addAppointment(data).subscribe((res) => {
        if (res) {
          // this.toast.success('New Event is created successfully');
          this.dialogRef.close({
            ...data,
            ...responseTime
          });
        }
      });
    } else {
      const data = {
        ...this.event,
        connected_email,
        calendar_id,
        service_type: calendar.connected_calendar_type
      };
      this.appointmentService.createEvents(data).subscribe(
        (res) => {
          if (this.mode === 'dialog') {
            this.isLoading = false;
            if (res['status'] == true) {
              // this.toast.success('New Event is created successfully');
              this.dialogRef.close({
                ...data,
                event_id: res['event_id'],
                organizer: connected_email,
                is_organizer: true,
                ...responseTime
              });
            }
          } else {
            if (res?.status === true) {
              this.isLoading = false;
              // this.toast.success('New Event is created successfully');
              this.onCreate.emit({
                ...data,
                event_id: res['event_id'],
                organizer: connected_email,
                is_organizer: true,
                ...responseTime
              });
              this.close();
            }
          }
        },
        (err) => {
          if (this.mode === 'dialog') {
            this.isLoading = false;
          } else {
            if (err.error.error === 'zoom token expired') {
              this.isLoading = false;
              this.close();
              const dialog = this.dialog.open(ConfirmComponent, {
                data: {
                  title: 'Connect Zoom',
                  message:
                    'Perhaps your Zoom Meeting token was expired. Will you connect it again?',
                  cancelLabel: 'No',
                  confirmLabel: 'Yes'
                }
              });
              dialog.afterClosed().subscribe((res) => {
                if (res) {
                  this.userService.requestZoomSyncUrl().subscribe((res) => {
                    if (res && res['status']) {
                      location.href = res['data'];
                    }
                  });
                }
              });
            }
          }
        }
      );
    }
  }

  createZoomLink(): void {
    this.zoomCreating = true;
    const date = moment(
      this.selectedDateTime.year +
        '-' +
        this.selectedDateTime.month +
        '-' +
        this.selectedDateTime.day +
        ' ' +
        this.due_time
    ).format();
    const data = {
      topic: this.event.title,
      start_time: date,
      type: 2,
      agenda: this.event.description,
      duration: this.duration * 60
    };
    this.integrationService.createZoom(data).subscribe((res) => {
      if (res) {
        this.zoomCreating = false;
        this.event.location = res;
      }
    });
  }

  overlayClose(): void {
    this.overlayService.close(null);
  }

  handleAddressChange(evt: any): void {
    this.event.location = evt.formatted_address;
  }

  setAllDayEvent(): void {
    this.event.is_full = !this.event.is_full;
  }

  getCalendarType(): string {
    if (this.submitType == 'create') {
      if (this.calendar) {
        const connected_email = this.calendar.account;
        const profile = this.userService.profile.getValue();
        const calendar_list = profile.calendar_list;
        const calendar = calendar_list.find(
          (e) => e.connected_email === connected_email
        );
        if (calendar) {
          return calendar.connected_calendar_type;
        } else {
          return '';
        }
      } else {
        return '';
      }
    } else {
      let connected_email;
      if (this.event.calendar_id) {
        this.calendars_info.forEach((_calendar) => {
          _calendar.data.forEach((e) => {
            if (e.id == this.event.calendar_id) {
              connected_email = _calendar.email;
            }
          });
        });
        if (connected_email) {
          const profile = this.userService.profile.getValue();
          const calendar_list = profile.calendar_list;
          const calendar = calendar_list.find(
            (e) => e.connected_email === connected_email
          );
          if (calendar) {
            return calendar.connected_calendar_type;
          } else {
            return '';
          }
        } else {
          return '';
        }
      } else {
        return '';
      }
    }
  }

  setRepeatEvent(): void {
    this.isRepeat = !this.isRepeat;
  }

  getAvailableTimes(): any {
    const garbage = this.userService.garbage.getValue();
    if (garbage?.calendar_info?.is_enabled) {
      let startTime = garbage.calendar_info.start_time;
      let endTime = garbage.calendar_info.end_time;
      const today = moment().format('YYYY-MM-DD');
      startTime = moment(today + 'T' + startTime)
        .tz(this.event.timezone)
        .format('HH:mm:[00.000]');
      endTime = moment(today + 'T' + endTime)
        .subtract(this.duration, 'hours')
        .tz(this.event.timezone)
        .format('HH:mm:[00.000]');
      let startIndex = TIMES.findIndex((item) => item.id === startTime);
      let endIndex = TIMES.findIndex((item) => item.id === endTime);
      let availableTimes = [];
      if (startIndex <= endIndex) {
        endIndex = endIndex < TIMES.length - 1 ? endIndex + 1 : endIndex;
        availableTimes = TIMES.slice(startIndex, endIndex);
      } else {
        startIndex =
          startIndex < TIMES.length - 1 ? startIndex + 1 : startIndex;
        availableTimes = TIMES.slice(endIndex, startIndex);
      }
      return availableTimes;
    }
    return TIMES;
  }

  private hideAutocompleteDropdown() {
    const dropdowns = document.querySelectorAll('.pac-container');
    dropdowns.forEach((dropdown) => {
      (dropdown as HTMLElement).style.display = 'none';
    });
  }

  changeMeetingType(type: string): void {
    this.meetingType = type;
  }

  close(): void {
    if (this.mode === 'dialog') {
      this.dialogRef.close();
    } else {
      this.overlayClose();
      this.onClose.emit();
    }
  }

  openLocation($event: boolean): void {
    this.isLocationOpen = $event;
  }
}
