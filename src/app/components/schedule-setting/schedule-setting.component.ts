import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment-timezone';
import { HOURS, REPEAT_DURATIONS, TIMES } from '@constants/variable.constants';
import { getNextBusinessDate, getUserTimezone } from '@app/helper';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { Garbage } from '@models/garbage.model';

@Component({
  selector: 'app-schedule-setting',
  templateUrl: './schedule-setting.component.html',
  styleUrls: ['./schedule-setting.component.scss']
})
export class ScheduleSettingComponent implements OnInit {
  TIMES = TIMES;
  REPEAT_DURATIONS = REPEAT_DURATIONS;

  title = '';
  minDate;
  set_recurrence = false;
  recurrence_mode = 'WEEKLY';
  error = null;

  timeChange = false;
  recurrenceChange = false;

  date;
  time = '12:00:00.000';

  // Business Hour Setting
  time_zone: string = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();
  enabledDays = [0, 1, 2, 3, 4, 5, 6];
  startTime = HOURS[0].id;
  endTime = HOURS[23].id;

  businessDay = {
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true
  };

  garbageSubscription: Subscription;
  profileSubscription: Subscription;

  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<ScheduleSettingComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.timezone) {
      this.time_zone = this.data.timezone;
    }
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (!this.data.timezone && profile.time_zone_info) {
          this.time_zone = getUserTimezone(profile, false);
        }
        this.date = getNextBusinessDate(this.businessDay, this.time_zone);
      }
    );

    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      const garbage = new Garbage().deserialize(res);
      if (garbage.business_time) {
        this.startTime = garbage.business_time.start_time;
        this.endTime = garbage.business_time.end_time;
      }
      if (garbage.business_day) {
        const availableDays = Object.values(garbage.business_day).filter(
          (item) => item
        );
        if (availableDays.length > 0) {
          this.businessDay = garbage.business_day;
        }
      }
      this.date = getNextBusinessDate(this.businessDay, this.time_zone);
      if (!this.data.time) {
        this.time = this.startTime;
      }
    });

    if (this.data.recurrence) {
      this.recurrenceChange = true;
      this.set_recurrence = this.data.recurrence.set_recurrence || false;
      this.recurrence_mode = this.data.recurrence.recurrence_mode || 'WEEKLY';
    }
    if (this.data.time) {
      this.timeChange = true;
      this.date = moment.tz(this.data.time, this.time_zone);
      this.time = moment
        .tz(this.data.time, this.time_zone)
        .format('HH:mm:[00.000]');
    }
    if (this.data.title) {
      this.title = this.data.title;
    }
  }

  ngOnInit(): void {}

  /**
   * Recurrence mode toggle
   */
  toggleRepeatSetting(): void {
    this.set_recurrence = !this.set_recurrence;
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.error = '';
  }

  /**
   * Submit the data
   */
  save(): void {
    const data = {};
    if (this.timeChange) {
      const dateString = this.getSelectedDate();
      const zone = moment.tz(dateString, this.time_zone).format('Z');
      const due_date = new Date(`${dateString}T${this.time}${zone}`);
      if (due_date.getTime() < Date.now() + 180000) {
        this.error = 'Please select the future time.';
        return;
      }
      data['time'] = due_date;
      data['timezone'] = this.time_zone;
    }
    if (this.recurrenceChange) {
      data['recurrence'] = {
        set_recurrence: this.set_recurrence,
        recurrence_mode: this.recurrence_mode
      };
    }
    this.dialogRef.close(data);
  }

  getSelectedDate(): string {
    return this.date.format('YYYY-MM-DD');
  }

  onSelectDateTime(dateTime): void {
    this.date = dateTime.date;
    this.time = dateTime.time;
    this.time_zone = dateTime.timezone;
  }
}
