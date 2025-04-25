import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from '@services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment-timezone';
import { HOURS, TIMES } from '@constants/variable.constants';
import { Subscription } from 'rxjs';
import { getNextBusinessDate, getUserTimezone } from '@app/helper';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-reset-date-time',
  templateUrl: './reset-date-time.component.html',
  styleUrls: ['./reset-date-time.component.scss']
})
export class ResetDateTimeComponent implements OnInit {
  title = '';
  submitted = false;

  date;
  time = '12:00:00.000';
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
  time_zone: string = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();
  times = TIMES;
  isValid = true;

  garbageSubscription: Subscription;
  profileSubscription: Subscription;

  constructor(
    private dealsService: DealsService,
    public userService: UserService,
    private dialogRef: MatDialogRef<ResetDateTimeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const profile = this.userService.profile.getValue();
    if (profile?.time_zone_info) {
      this.time_zone = getUserTimezone(profile, false);
      this.date = getNextBusinessDate(this.businessDay, this.time_zone);
    }

    const garbage = this.userService.garbage.getValue();
    if (garbage) {
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
      this.time = this.startTime;
    }

    if (this.data && this.data.title) {
      this.title = this.data.title;
    }

    if (this.data && this.data.dateTime) {
      const dateTime = moment.tz(this.data.dateTime, this.time_zone);
      this.date = dateTime;
      this.time = dateTime.format('HH:mm:[00.000]');
    }
  }

  ngOnInit(): void {}

  submit(): void {
    const due_date = moment.tz(this.getSelectedDateTime(), this.time_zone);
    this.dialogRef.close({ due_date });
  }

  selectDateTime($event): void {
    this.time_zone = $event.timezone;
  }

  getSelectedDateTime(): string {
    return `${this.date.format('YYYY-MM-DD')} ${this.time}`;
  }

  getSelectedDate(): string {
    return this.date.format('YYYY-MM-DD');
  }

  onSelectDateTime(dateTime): void {
    this.date = dateTime.date;
    this.time = dateTime.time;
    this.time_zone = dateTime.timezone;
    this.isValid = true;
  }
}
