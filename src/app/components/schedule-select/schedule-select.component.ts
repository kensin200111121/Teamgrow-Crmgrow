import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HOURS, REPEAT_DURATIONS, TIMES } from '@constants/variable.constants';
import { NgbCalendar, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment-timezone';
import { TaskService } from '@services/task.service';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { getNextBusinessDate, getUserTimezone } from '@app/helper';
import { Garbage } from '@models/garbage.model';
@Component({
  selector: 'app-schedule-select',
  templateUrl: './schedule-select.component.html',
  styleUrls: ['./schedule-select.component.scss']
})
export class ScheduleSelectComponent implements OnInit {
  TIMES = TIMES;
  REPEAT_DURATIONS = REPEAT_DURATIONS;
  submitted = false;
  selected: Date | null;
  date;
  time = '12:00:00.000';
  set_recurrence = false;
  recurrence_mode;

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
    private calendar: NgbCalendar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskService,
    private userService: UserService,
    private dialogRef: MatDialogRef<ScheduleSelectComponent>
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile.time_zone_info) {
          this.time_zone = getUserTimezone(profile, false);
          this.date = getNextBusinessDate(this.businessDay, this.time_zone);
        }
      }
    );
    this.recurrence_mode = 'DAILY';
    this.taskService.scheduleData$.subscribe((res) => {
      if (res?.time_zone) this.time_zone = res.time_zone;
      if (res?.due_date) {
        this.date = moment(res.due_date).tz(this.time_zone);
        this.time = moment(res.due_date)
          .tz(this.time_zone)
          .format('HH:mm:[00.000]');
        this.set_recurrence = res.set_recurrence;
        this.recurrence_mode = res.recurrence_mode;
      }
    });

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
    });
  }

  ngOnInit(): void {}

  /**
   * select the scheduled time
   */
  sendSchedule() {
    const dateStr = moment(this.date).format('YYYY-MM-DD');
    const selectedTime = moment
      .tz(dateStr + 'T' + this.time, this.time_zone)
      .toDate();
    if (!this.set_recurrence) {
      this.recurrence_mode = '';
    }
    const data = {
      due_date: selectedTime,
      recurrence_mode: this.recurrence_mode,
      set_recurrence: this.set_recurrence,
      time_zone: this.time_zone
    };
    this.taskService.scheduleData.next(data);
    this.dialogRef.close(data);
  }

  /**
   * Toggle Repeat Setting
   */
  toggleRepeatSetting(): void {
    this.set_recurrence = !this.set_recurrence;
  }

  getSelectedDate(): string {
    return this.date.format('YYYY-MM-DD');
  }

  onSelectDateTime(dateTime): void {
    this.date = dateTime.date;
    this.time = dateTime.time;
    this.time_zone = dateTime.timezone;
  }
  filterBusinessDays = (d: Date) => {
    const day = d.getDay();
    return this.enabledDays.includes(day);
  };
}
