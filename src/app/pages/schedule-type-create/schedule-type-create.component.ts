import * as _ from 'lodash';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { UserService } from '@services/user.service';
import { ScheduleService } from '@services/schedule.service';
import { ToastrService } from 'ngx-toastr';
import { TIMES } from '@constants/variable.constants';
import { EventType } from '@models/eventType.model';
import { environment } from '@environments/environment';
import { PageCanDeactivate } from '@variables/abstractors';
import { PHONE_COUNTRIES } from '@constants/variable.constants';
import { CountryISO } from 'ngx-intl-tel-input';
import { adjustPhoneNumber } from '@app/helper';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import moment from 'moment-timezone';
import { Automation } from '@models/automation.model';
import { ConfirmComponent } from '@components/confirm/confirm.component';

@Component({
  selector: 'app-schedule-type-create',
  templateUrl: './schedule-type-create.component.html',
  styleUrls: ['./schedule-type-create.component.scss']
})
export class ScheduleTypeCreateComponent
  extends PageCanDeactivate
  implements OnInit, OnDestroy
{
  TIMES = TIMES;
  saved = false;
  readonly codeMode = {
    lineNumbers: true,
    mode: {
      name: 'htmlmixed'
    }
  };

  DaysTypes = [
    {
      name: 'calendar days',
      value: 'calendar'
    },
    {
      name: 'business days',
      value: 'business'
    }
  ];
  Durations = [
    {
      name: '15 mins',
      value: 15
    },
    {
      name: '30 mins',
      value: 30
    },
    {
      name: '45 mins',
      value: 45
    },
    {
      name: '60 mins',
      value: 60
    }
  ];
  Increments = [
    {
      name: '5 mins',
      value: 5
    },
    {
      name: '10 mins',
      value: 10
    },
    {
      name: '15 mins',
      value: 15
    },
    {
      name: '20 mins',
      value: 20
    },
    {
      name: '25 mins',
      value: 25
    },
    {
      name: '30 mins',
      value: 30
    },
    {
      name: '35 mins',
      value: 35
    },
    {
      name: '40 mins',
      value: 45
    },
    {
      name: '50 mins',
      value: 50
    },
    {
      name: '55 mins',
      value: 55
    },
    {
      name: '60 mins',
      value: 60
    }
  ];
  WeekDaysObj = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday'
  };

  WeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  profileSubscription: Subscription;
  garbageSubscription: Subscription;

  isNew = true;
  schedule_type_id = '';
  loadingEventType = false;
  saveSubscription: Subscription;
  saving = false;
  adding = false;

  stepIndex = 1;
  existingLink = false;
  nick_name = '';
  oldLastLink = '';
  newLastLink = '';
  oldFullRouteURL = '';
  newFullRouteURL = '';
  linkCustomized = false;
  all_eventtype_links = [];
  eventType: EventType = new EventType();
  dateRange: any = {
    type: 'days',
    data: {
      days: {
        type: 'business',
        value: 60
      },
      range: {
        start: {
          year: moment().year(),
          month: moment().month() + 1,
          day: moment().day()
        },
        end: {
          year: moment().year(),
          month: moment().month() + 1,
          day: moment().day() + 1
        }
      }
    }
  };
  DefaultWorkingHours: any = {
    start: '09:00:00.000',
    end: '17:00:00.000'
  };
  weeklyHours: any = {
    sun: {
      available: false,
      hours: []
    },
    mon: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    tue: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    wed: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    thu: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    fri: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    sat: {
      available: false,
      hours: []
    }
  };

  Locations = [
    {
      name: 'In-person meeting',
      value: 'in_person'
    },
    {
      name: 'Phone Call (inbound)',
      value: 'phone'
    },
    {
      name: 'Phone Call (outbound)',
      value: 'phone_out'
    },
    {
      name: 'Google Meeting',
      value: 'google'
    },
    {
      name: 'Zoom Meeting',
      value: 'zoom'
    },
    {
      name: 'Online Meeting',
      value: 'custom'
    }
  ];
  isZoomConnected = false;

  prevLocationType = 'in_person';
  locationType = 'in_person';
  meetingAddress = '';
  meetingPhone = '';
  meetingEmail = '';

  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;

  oldEventType = new EventType().deserialize({
    weekly_hours: this.weeklyHours,
    location: {
      type: this.locationType,
      additional: ''
    },
    date_range: this.dateRange,
    duration: this.Durations[0].value
  });

  customDuration = false;
  customIncrement = false;
  selectedAutomation = '';

  requiredAutomation = false;
  requiredScript = false;
  autoTriggers = [
    { value: '1', name: 'After event is booked' },
    { value: '2', name: 'Before event starts' },
    { value: '3', name: 'After event starts' },
    { value: '4', name: 'After event ends' }
  ];
  selectedAutoTrigger = this.autoTriggers[0];
  autoTriggerTimes = [
    { value: 'days', name: 'Days' },
    { value: 'hours', name: 'Hours' },
    { value: 'minutes', name: 'Minutes' }
  ];
  selectedTriggerTime = 'immediate';

  linkEditable = true;
  isUniqueLink = false;

  @ViewChild('phone') phoneControl: PhoneInputComponent;
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (!this.saved && !this.isSame()) {
      $event.returnValue = true;
    }
  }

  constructor(
    private userService: UserService,
    public scheduleService: ScheduleService,
    private dialog: MatDialog,
    private toast: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (!profile.nick_name && !this.adding) {
          this.addNickName();
        } else {
          this.nick_name = this.filterSpecialString(profile.nick_name);
        }

        if (profile.scheduler_info && !profile.scheduler_info.is_enabled) {
          this.router.navigate(['/home']);
        }
      }
    );

    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        if (_garbage._id) {
          this.isZoomConnected = !!_garbage.zoom?.email;
        }
      }
    );
  }

  ngOnInit(): void {
    this.schedule_type_id = this.route.snapshot.params.id;
    if (this.schedule_type_id === 'create-one') {
      this.eventType.type = 1;
      this.eventType.duration = this.Durations[0].value;
      this.eventType.tags = [];
      this.oldEventType.type = 1;
    }
    if (this.schedule_type_id === 'create-group') {
      this.eventType.type = 2;
      this.eventType.duration = this.Durations[0].value;
      this.eventType.tags = [];
      this.oldEventType.type = 2;
    }
    if (
      this.schedule_type_id !== 'create-one' &&
      this.schedule_type_id !== 'create-group'
    ) {
      // load schedule type
      this.linkEditable = false;
      this.loadScheduleType();
    }
    const _event_types = this.scheduleService.eventTypes.getValue();
    if (_event_types.length > 0) {
      _event_types.forEach((e) => {
        if (e._id !== this.schedule_type_id) {
          this.all_eventtype_links.push(
            e?.link.substring(e?.link.lastIndexOf('/') + 1)
          );
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  getCalendarType(): string {
    const profile = this.userService.profile.getValue();
    const connected_email = profile.scheduler_info.connected_email;
    if (connected_email) {
      const calendar_list = profile.calendar_list;
      const calendar = calendar_list.find(
        (e) => e.connected_email === connected_email
      );
      return calendar.connected_calendar_type;
    } else {
      return '';
    }
  }

  addNickName(): void {
    this.adding = true;
    this.userService.addNickName().subscribe((res) => {
      if (res && res['status']) {
        this.userService.updateProfileImpl({
          nick_name: res.nick_name
        });
        this.adding = false;
        this.nick_name = this.filterSpecialString(res.nick_name);
      }
    });
  }
  updateLinkByVortex = (link: string): string => {
    if (environment.isSspa) {
      if (link.indexOf(environment.domain.scheduler) > -1) {
        return link.replace(
          environment.domain.scheduler,
          environment.Vortex_Scheduler
        );
      }
      if (link.indexOf(environment.Vortex_Scheduler) == -1) {
        return `https://${environment.Vortex_Scheduler}` + link;
      }
      return link;
    } else {
      if (link.indexOf(environment.Vortex_Scheduler) > -1) {
        return link.replace(
          environment.Vortex_Scheduler,
          environment.domain.scheduler
        );
      }
      if (link.indexOf(environment.domain.scheduler) == -1) {
        return `https://${environment.domain.scheduler}` + link;
      }
      return link;
    }
  };

  loadScheduleType(): void {
    this.loadingEventType = true;
    this.scheduleService
      .getEventType(this.schedule_type_id)
      .subscribe((res) => {
        this.loadingEventType = false;
        if (res) {
          const { link, weekly_hours, date_range } = res;
          this.eventType = JSON.parse(JSON.stringify(res));
          this.oldEventType = JSON.parse(JSON.stringify(res));

          this.locationType = res.location['type'];
          if (
            res.location['type'] === 'in_person' ||
            res.location['type'] == 'custom'
          ) {
            this.meetingAddress = res.location['additional'];
          } else if (res.location['type'] === 'phone') {
            this.meetingPhone = res.location['additional'];
          }
          this.oldLastLink = link.substring(link.lastIndexOf('/') + 1);
          this.newLastLink = this.oldLastLink;
          this.oldFullRouteURL = link;
          this.newFullRouteURL = this.updateLinkByVortex(link);
          this.weeklyHours = weekly_hours;
          this.dateRange.type = date_range.type;
          this.dateRange.data = { ...this.dateRange.data, ...date_range.data };
          this.isNew = false;
          this.customDuration = ![15, 30, 45, 60].includes(
            Number(this.eventType.duration)
          );
          this.customIncrement = ![15, 30, 45, 60].includes(
            Number(this.eventType.start_time_increment)
          );
          if (res.auto_trigger_type) {
            this.requiredAutomation = true;

            this.autoTriggers.some((e) => {
              if (e.value == res.auto_trigger_type) {
                this.selectedAutoTrigger = e;
                this.selectedTriggerTime =
                  res.auto_trigger_duration == 0 ? 'immediate' : 'custom';
                return true;
              }
            });
            this.selectedAutomation = res.automation || '';
          }
        }
      });
  }

  /**
   * Go to back page
   */
  goToBack(): void {
    if (this.isSame()) {
      this.saved = true;
    }
    this.router.navigate(['/lead-hub/scheduler']);
  }

  goToStep(step: number): void {
    if (this.stepIndex == 1 && step == 2) {
      if (this.checkPhoneRequired() || this.checkPhoneInvalid()) {
        return;
      }
      if (
        this.locationType == 'google' &&
        this.getCalendarType() !== 'google'
      ) {
        this.toast.error('Please select google calendar.');
        return;
      }
      if (
        this.eventType.duration &&
        step === 2 &&
        !this.eventType.start_time_increment
      ) {
        this.eventType.start_time_increment = this.eventType.duration;
      }
      this.eventType['location'] = {
        type: this.locationType,
        additional:
          this.locationType == 'in_person' || this.locationType == 'custom'
            ? this.meetingAddress
            : this.locationType == 'phone'
            ? adjustPhoneNumber(this.meetingPhone['internationalNumber'])
            : null
      };
      if (this.oldFullRouteURL != this.newFullRouteURL) {
        this.scheduleService
          .getEventTypeByLink({
            link: this.newFullRouteURL
          })
          .subscribe((res) => {
            if (res) {
              this.existingLink = true;
              this.goToStep(1);
            } else {
              this.existingLink = false;
            }
          });
      }
    }
    if (step == 3) {
      if (!this.eventType.title) {
        this.toast.warning('Please enter the title of event type.');
        return;
      }
      if (!this.eventType.location) {
        this.toast.warning('Please select a location of event type.');
        return;
      }
      if (!this.eventType.link) {
        this.getLinkFromTitle();
      }
    }

    this.stepIndex = step;
  }

  checkValidLink(): void {
    this.newFullRouteURL = this.updateLinkByVortex(
      `/${this.nick_name}/${this.newLastLink}`
    );
    this.existingLink = this.all_eventtype_links.includes(this.newLastLink);
  }
  getLinkFromTitle(): void {
    if (this.eventType.title) {
      this.oldLastLink = this.filterSpecialString(this.eventType.title);
      this.newLastLink = this.oldLastLink;
    }
    this.checkValidLink();
  }

  onTitleChanged(): void {
    if (!this.linkCustomized) {
      this.getLinkFromTitle();
    }
  }

  onLinkChanged(): void {
    this.linkCustomized = !!this.newLastLink;
    this.existingLink = false;
    this.checkValidLink();
    if (this.newFullRouteURL !== this.oldFullRouteURL) this.isUniqueLink = true;
    else this.isUniqueLink = false;
  }

  save(): any {
    if (!this.requiredAutomation) {
      this.eventType.auto_trigger_duration = null;
      this.eventType.auto_trigger_time = null;
      this.eventType.auto_trigger_type = null;
      this.eventType.automation = null;
    } else {
      if (!this.eventType.auto_trigger_type || !this.eventType.automation) {
        return;
      }
      if (this.selectedTriggerTime == 'immediate') {
        this.eventType.auto_trigger_duration = 0;
      }
    }
    this.eventType.weekly_hours = this.weeklyHours;
    this.eventType.date_range = this.dateRange;
    this.eventType.link = this.removeDomainFromUrl(this.newFullRouteURL);
    if (!this.eventType.timezone) {
      this.eventType.timezone = moment()['_z']?.name || moment.tz.guess();
    }

    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    if (this.isNew) {
      this.saveSubscription = this.scheduleService
        .createEventType(this.eventType)
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.saved = true;
            // this.scheduleService.getEventTypes(true);
            // this.toast.success('Event type is created successfully.');
            this.goToBack();
          }
        });
    } else {
      this.saveSubscription = this.scheduleService
        .updateEventType(this.eventType._id, this.eventType)
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.saved = true;
            // this.scheduleService.getEventTypes(true);
            // this.toast.success('Event type is saved successfully.');
            this.goToBack();
          }
        });
    }
  }

  onWeekdayAvailabilityChange(weekday: string): void {
    if (
      this.weeklyHours[weekday].available == true &&
      this.weeklyHours[weekday].hours.length === 0
    ) {
      this.weeklyHours[weekday].hours.push(_.clone(this.DefaultWorkingHours));
    }
  }

  addNewHour(weekday: string): void {
    this.weeklyHours[weekday].available = true;
    this.weeklyHours[weekday].hours.push(_.clone(this.DefaultWorkingHours));
  }

  removeWeeklyHour(weekday: string, index: number): void {
    if (this.weeklyHours[weekday].hours.length > index) {
      this.weeklyHours[weekday].hours.splice(index, 1);
    }

    if (this.weeklyHours[weekday].hours.length === 0) {
      this.weeklyHours[weekday].available = false;
    }
  }

  validateDateRange(): boolean {
    if (this.dateRange.type !== 'range') {
      return true;
    }
    const start = this.dateRange.data.range.start;
    const end = this.dateRange.data.range.end;
    if (this.dateRange.type == 'range' && Boolean(start) && Boolean(end)) {
      const _start = Date.parse(`${start.year}-${start.month}-${start.day}`);
      const _end = Date.parse(`${end.year}-${end.month}-${end.day}`);
      return _start < _end;
    }
    return false;
  }

  handleAddressChange(evt: any): void {
    this.meetingAddress = evt.formatted_address;
  }

  checkPhoneRequired(): boolean {
    if (this.locationType != 'phone') {
      return false;
    }

    if (!this.meetingPhone || !Object.keys(this.meetingPhone)) {
      return true;
    }
    return false;
  }
  checkPhoneInvalid(): boolean {
    if (this.locationType != 'phone') {
      return false;
    }

    if (!this.meetingPhone || !this.phoneControl.valid) {
      return true;
    }

    if (Object.keys(this.meetingPhone).length && this.phoneControl.valid) {
      return false;
    }
    return true;
  }

  isSame() {
    this.eventType['location'] = {
      type: this.locationType,
      additional:
        this.locationType == 'in_person' || this.locationType === 'custom'
          ? this.meetingAddress
          : this.locationType == 'phone'
          ? this.meetingPhone
            ? adjustPhoneNumber(this.meetingPhone['internationalNumber'])
            : null
          : null
    };
    this.eventType.weekly_hours = this.weeklyHours;
    this.eventType.date_range = this.dateRange;
    return _.isEqual(
      JSON.parse(JSON.stringify(this.eventType)),
      JSON.parse(JSON.stringify(this.oldEventType))
    );
  }

  setCustomDuration(event): void {
    if (!event.checked) {
      this.eventType.duration = 15;
    }
  }
  setCustomIncrement(event): void {
    if (!event.checked) {
      this.eventType.start_time_increment = this.eventType.duration || 15;
    }
  }

  selectAutomation(evt: Automation): void {
    if (evt) this.selectedAutomation = evt._id;
    else this.selectedAutomation = '';
    this.eventType.automation = evt && evt._id ? evt._id : null;
  }

  changeAutoTriggerTime(event) {
    // if (event.value == 'immediate') {
    //   this.eventType.auto_trigger_duration = 0;
    // } else {
    //   this.eventType.auto_trigger_duration = 24;
    //   this.eventType.auto_trigger_time = 'hours';
    // }
  }

  changeAutoTriggerType(event) {
    this.autoTriggers.some((e) => {
      if (e.value == event.value) {
        this.selectedAutoTrigger = e;
        this.selectedTriggerTime = e.value == '2' ? 'custom' : 'immediate';
        this.eventType.auto_trigger_duration = 24;
        this.eventType.auto_trigger_time = 'hours';
        return true;
      }
    });
  }

  /**
   * Check the Third-Party Connection whenever change the meeting type
   * @returns
   */
  onChangeLocationType(): void {
    if (this.locationType === 'zoom' && !this.isZoomConnected) {
      this.locationType = this.prevLocationType;
      // Confirm
      this.dialog
        .open(ConfirmComponent, {
          width: '90vw',
          maxWidth: '400px',
          disableClose: true,
          data: {
            title: 'Integration',
            message: 'zoom_integration_warning',
            confirmLabel: 'Connect',
            cancelLabel: 'Close'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.userService.requestZoomSyncUrl().subscribe((res) => {
              if (res && res['status']) {
                location.href = res['data'];
              }
            });
          }
        });
      return;
    }
    this.prevLocationType = this.locationType;
  }

  getOldNickName(url: string): string {
    if (!url) return '';
    const _bigLink = url.substring(0, url.lastIndexOf('/'));
    const nickName = _bigLink.substring(_bigLink.lastIndexOf('/') + 1);
    return nickName;
  }

  enterEditMode(): void {
    this.linkEditable = true;
    this.newFullRouteURL = this.updateLinkByVortex(
      `https://${environment.domain.scheduler}/${this.nick_name}/${this.newLastLink}`
    );
    this.onLinkChanged();
  }
  setEditMode(): void {
    const oldNickName = this.getOldNickName(this.oldFullRouteURL);
    if (oldNickName !== this.nick_name) {
      this.dialog
        .open(ConfirmComponent, {
          width: '90vw',
          maxWidth: '400px',
          disableClose: true,
          data: {
            title: 'Edit the scheduler link',
            message:
              '<b>Warning:</b> Current link was created with old <b>"My Link"</b>. If you edit it, then new link will include new <b>"My Link"</b> instead of old one. Will you still continue?',
            confirmLabel: 'OK',
            cancelLabel: 'Cancel'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) this.enterEditMode();
        });
    } else {
      this.enterEditMode();
    }
  }

  saveRouteLink(): void {
    if (this.existingLink) return;
    this.saving = true;
    this.eventType.link = this.removeDomainFromUrl(this.newFullRouteURL);
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.scheduleService
      .updateEventType(this.eventType._id, this.eventType)
      .subscribe((res) => {
        this.saving = false;
        if (res) {
          this.saved = true;
          this.linkEditable = false;
          this.isUniqueLink = false;
          this.oldLastLink = this.newLastLink;
          this.oldFullRouteURL = this.newFullRouteURL;
        }
      });
  }

  cancelChangeRouteLInk(): void {
    this.newFullRouteURL = this.oldFullRouteURL;
    this.newLastLink = this.oldLastLink;
    this.linkEditable = false;
    this.isUniqueLink = false;
  }
  removeDomainFromUrl = (url: string): string => {
    let urlWithoutProtocolAndDomain = url.replace(
      /^(https?:\/\/)?(www\.)?([^\/]+)/,
      ''
    );
    if (urlWithoutProtocolAndDomain.charAt(0) !== '/') {
      urlWithoutProtocolAndDomain = '/' + urlWithoutProtocolAndDomain;
    }
    return urlWithoutProtocolAndDomain;
  };
  filterSpecialString(prevStr: string): string {
    const newStr = prevStr
      .split(' ')
      .map((word) => word.toLowerCase().replace(/[^a-zA-Z\d ]/g, ''))
      .join('-');
    return newStr;
  }
}
