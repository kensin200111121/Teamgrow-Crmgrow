import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CalendarMonthViewDay } from 'angular-calendar';
import { Subject } from 'rxjs';
import moment from 'moment-timezone';

import { UserService } from '@services/user.service';
import {
  getFormattedTime,
  getUserTimezone,
  insertMomentIntoSortedArray
} from '@app/helper';
import { UntypedFormControl } from '@angular/forms';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { MatSelect } from '@angular/material/select';
import { SelectTimezoneComponent } from '@app/components/select-timezone/select-timezone.component';

@Component({
  selector: 'app-business-date-time-picker',
  templateUrl: './business-date-time-picker.component.html',
  styleUrls: ['./business-date-time-picker.component.scss']
})
export class BusinessDateTimePickerComponent implements OnInit {
  @Input() selectedDay: string = moment().format('YYYY-MM-DD');

  @Input() selectedTime = '09:00:00.000';
  @Input() mode = 'inline';
  @Input() isCreateMode = true;
  @Input() isBusinessEnabled = true;
  @Input() type = 'normal'; // smtp business hour or profile business hour
  @Input() time_zone: string = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();
  @Input() hideTime = false;
  @Input() placeholder = 'Select Date';
  @Output() onSelectDateTime = new EventEmitter();

  viewDate: Date = new Date();

  private originalTimezone: string = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();

  locale = 'en';
  refresh: Subject<any> = new Subject();
  private maxDate: any;
  private minDate = moment().clone();

  private startTime = '00:00:00.000';
  private endTime = '23:59:59.000';
  timeRanges = [];
  displayDate = '';
  private businessDay = {
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true
  };

  /* Edit mode variables */
  private originSelectedDay;
  private originSelectedTime;
  isEditing = false;

  @ViewChild('trigger') triggerElement: CdkOverlayOrigin;
  @ViewChild('calendarDropdown') calendarDropdown: NgbDropdown;
  @ViewChild('calendarRef') calendarRef: ElementRef;
  @ViewChild(MatSelect) timeDropdown: MatSelect;
  @ViewChild(SelectTimezoneComponent) selectTimezoneRef: SelectTimezoneComponent;
  dateInput: UntypedFormControl = new UntypedFormControl();
  isOpen = false;

  constructor(
    private userService: UserService,
    private translateService: TranslateService
  ) {
    this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      this.locale = event.lang;
    });
  }

  ngOnInit(): void {
    this.isEditing = false;
    const _garbage = this.userService.garbage.getValue();
    this.locale = this.translateService.currentLang;
    if (this.type === 'normal') {
      if (_garbage.business_time) {
        this.startTime = _garbage.business_time.start_time || '09:00:00.000';
        this.endTime = _garbage.business_time.end_time || '17:00:00.000';
        if (_garbage.business_day) {
          this.businessDay = _garbage.business_day;
        }
      }
    } else if (this.type === 'smtp') {
      this.startTime = _garbage.smtp_info.start_time || '09:00:00.000';
      this.endTime = _garbage.smtp_info.end_time || '17:00:00.000';
      if (_garbage.smtp_info.business_day) {
        this.businessDay = _garbage.smtp_info.business_day;
      }
    }

    const availableDays = Object.values(this.businessDay).filter(
      (item) => item
    );
    if (!this.isBusinessEnabled || !availableDays.length) {
      this.businessDay = {
        sun: true,
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: true
      };
    }

    if (this.time_zone) {
      this.originalTimezone = this.time_zone;
    } else {
      const profile = this.userService.profile.getValue();
      if (profile.time_zone_info) {
        this.time_zone = getUserTimezone(profile, false);
        this.originalTimezone = this.time_zone;
      }
    }
    const formatter = new Intl.DateTimeFormat('en-CA');
    const formattedDate = formatter
      .format(new Date())
      .replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$1-$2-$3');
    this.viewDate = moment(formattedDate)
      .startOf('month')
      .tz(this.time_zone)
      .toDate();
    if (this.isCreateMode) {
      this.changeTimezone();
    } else {
      this.originSelectedDay = this.selectedDay;
      this.originSelectedTime = this.selectedTime;
    }
  }

  closePopups(): void {
    if (this.calendarRef) {
      this.calendarRef.nativeElement.style.display = 'none';
    }

    if (this.timeDropdown) {
      this.timeDropdown.close();
    }

    if (this.selectTimezoneRef) {
      this.selectTimezoneRef.closePopups();
    }
  }

  private generateTimeArrays(activeDay: string): Array<any> {
    // Define the start and end of the day
    const startOfDay = moment.tz(activeDay, this.time_zone).startOf('day');
    const endOfDay = moment.tz(activeDay, this.time_zone).endOf('day');
    const currentTime = moment.tz(this.time_zone);

    // Initialize an empty array to store time periods
    let timePeriods = [];

    // Loop through the day in 15-minute intervals
    const currentPeriod = startOfDay.clone();
    while (currentPeriod.isSameOrBefore(endOfDay)) {
      // Check if the current period is after the current time
      if (currentPeriod.isSameOrAfter(currentTime)) {
        timePeriods.push(
          currentPeriod.tz(this.time_zone).format('HH:mm:[00.000]')
        );
      }
      // Increment by 15 minutes
      currentPeriod.add(15, 'minutes');
    }

    const startOriginSelectedDay = moment
      .tz(this.originSelectedDay, this.time_zone)
      .startOf('day');

    if (startOriginSelectedDay.isSame(startOfDay)) {
      timePeriods = insertMomentIntoSortedArray(
        timePeriods,
        this.originSelectedTime
      );
    }

    const startTimeMoment = moment(this.startTime, 'HH:mm:[00.000]').tz(
      this.time_zone
    );
    const endTimeMoment = moment(this.endTime, 'HH:mm:[00.000]').tz(
      this.time_zone
    );

    // Display the list of time periods

    const validTimeList = timePeriods
      .filter((item) => {
        return (
          moment(item, 'HH:mm:[00.000]').isSameOrAfter(startTimeMoment) &&
          moment(item, 'HH:mm:[00.000]').isSameOrBefore(endTimeMoment)
        );
      })
      .map((time) => {
        const tempMoment = moment(time, 'HH:mm:[00.000]').tz(this.time_zone);
        return {
          id: tempMoment.format('HH:mm:[00.000]'),
          text: tempMoment.format('h:mm A')
        };
      });

    return validTimeList;
  }
  setDay(date: string) {
    this.selectedDay = date;
    this.timeRanges = this.generateTimeArrays(date);
    this.selectedTime = this.timeRanges[0].id;
    this.confirm();
  }

  selectTimezone($event): void {
    this.time_zone = $event || moment()['_z']?.name || moment.tz.guess();
    this.changeTimezone();
    this.confirm();
  }

  changeTimezone(): void {
    let possibleDay = this.selectedDay;
    let dateIsValid = this.dateIsValid(`${this.selectedDay}`);
    let index = 0;
    while (!dateIsValid && index < 7) {
      possibleDay = moment(possibleDay).add(1, 'days').format('YYYY-MM-DD');
      dateIsValid = this.dateIsValid(possibleDay);
      index++;
    }

    this.setDay(possibleDay);

    this.dayIsSelectedCallback();
  }

  // change the selected time to "new target timezone" time
  private dayIsSelectedCallback() {
    const timeZoneMoment = moment(`${this.selectedDay}T${this.selectedTime}`);
    if (this.selectedTime) {
      this.selectedTime = timeZoneMoment.format('HH:mm:[00.000]');

      const index = this.timeRanges.findIndex(
        (item) => item.id === this.selectedTime
      );
      if (index < 0) {
        this.selectedTime = this.timeRanges?.[0]?.id;
      }
    } else {
      this.selectedTime = this.timeRanges?.[0]?.id;
    }
    this.refresh.next(Date.now());
  }

  private dateIsValid(date, inMonth = true): boolean {
    const dateTimeZoneMoment = moment(date).clone();

    const endOfDay = dateTimeZoneMoment.endOf('day');
    const minDate = moment().tz(this.time_zone).startOf('day');

    let isValidRange = endOfDay.isSameOrAfter(minDate);

    if (this.maxDate !== undefined) {
      isValidRange =
        endOfDay.isSameOrAfter(this.minDate) &&
        dateTimeZoneMoment.isSameOrBefore(this.maxDate.tz(this.time_zone));
    }

    const weekday = dateTimeZoneMoment.format('ddd').toLowerCase();
    const isValidWeekly = this.businessDay[weekday];

    if (inMonth && isValidRange && isValidWeekly) {
      const isToday = dateTimeZoneMoment
        .tz(this.time_zone)
        .isSame(moment().tz(this.time_zone), 'day');
      if (isToday) {
        return this.generateTimeArrays(
          moment().tz(this.time_zone).format('YYYY-MM-DD')
        ).length > 0
          ? true
          : false;
      }
      return true;
    }
    return false;
  }

  beforeViewRender({ body }: { body: CalendarMonthViewDay[] }): void {
    body.forEach((day) => {
      if (!this.dateIsValid(day.date, day.inMonth)) {
        day.cssClass = 'disabled-date';
      } else {
        day.cssClass = 'enable-date';
      }
    });
  }

  private confirm(): void {
    const res = {
      date: moment(this.selectedDay),
      time: this.selectedTime,
      timezone: this.time_zone
    };
    this.onSelectDateTime.emit(res);
  }

  isSelectedDay(date): boolean {
    return this.selectedDay === moment(date).format('YYYY-MM-DD');
  }

  timeClicked(time: any): void {
    this.selectedTime = time.value;
    this.confirm();
  }

  dayClicked($event): void {
    const dayObj = $event.date;
    const nwDate = new Date(dayObj);
    this.setDay(moment(nwDate).format('YYYY-MM-DD'));
    this.dayIsSelectedCallback();
    this.confirm();
    this.isOpen = false;
  }

  monthButtonnClicked(type): void {
    if (type === 'prev') {
      this.viewDate = moment(this.viewDate).subtract(1, 'month').toDate();
    } else {
      this.viewDate = moment(this.viewDate).add(1, 'month').toDate();
    }
    const dateString = new Date(
      moment(this.viewDate).startOf('month').toISOString()
    );
    const year = dateString.getFullYear();
    const month = dateString.getMonth() + 1;
    const day = dateString.getDate();

    this.refresh.next(Date.now());
  }

  displayCurrentMonth(): string {
    return moment(this.viewDate).locale(this.locale).format('MMMM YYYY');
  }

  disableButton(viewDate, type): boolean {
    const monthStart = moment(viewDate).clone().startOf('month');
    const monthEnd = moment(viewDate).clone().endOf('month');

    if (type === 'prev') {
      return monthStart.diff(this.minDate, 'days') <= 0;
    }

    if (type === 'next') {
      return this.maxDate === undefined
        ? false
        : monthEnd.diff(this.maxDate, 'days') >= 0;
    }
    return true;
  }

  getPickedDateTime(): any {
    if (this.hideTime) {
      return this.selectedDay;
    } else {
      const time = getFormattedTime(this.selectedTime);
      return `${this.selectedDay} ${time}`;
    }
  }

  // open the calendar view when click input
  openOverlay(): void {
    this.isOpen = !this.isOpen;
    const triggerEl = <HTMLInputElement>(
      this.triggerElement.elementRef.nativeElement
    );
    triggerEl.blur();
  }

  // close the calendar view
  closeOverlay(event: MouseEvent): void {
    const target = <HTMLInputElement>event.target;
    const triggerEl = <HTMLInputElement>(
      this.triggerElement.elementRef.nativeElement
    );
    if (target === triggerEl) {
      return;
    }
    this.isOpen = false;
    return;
  }

  toggleEditing(): void {
    this.isEditing = !this.isEditing;

    if (!this.isEditing) {
      this.selectedDay = this.originSelectedDay;
      this.selectedTime = this.originSelectedTime;
      this.time_zone = this.originalTimezone;
      this.confirm();
    } else {
      this.changeTimezone();
    }
  }
}
