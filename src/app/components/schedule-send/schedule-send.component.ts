import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import moment from 'moment-timezone';
import { ScheduleSelectComponent } from '@components/schedule-select/schedule-select.component';
import { TaskService } from '@services/task.service';
import { HOURS } from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { Garbage } from '@models/garbage.model';
import { getNextBusinessDate } from '@app/helper';
import { Subscription } from 'rxjs';

const WEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wedensday',
  'Thursday',
  'Friday',
  'Saturday'
];
@Component({
  selector: 'app-schedule-send',
  templateUrl: './schedule-send.component.html',
  styleUrls: ['./schedule-send.component.scss']
})
export class ScheduleSendComponent implements OnInit {
  schedule_list: any[];
  time_zone = '';

  businessHour = null;

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
  date;
  time = '12:00:00.000';

  garbageSubscription: Subscription;
  profileSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ScheduleSendComponent>,
    private userService: UserService,
    private taskService: TaskService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const tz = moment()['_z']?.name ? moment()['_z'].name : moment.tz.guess();
    this.time_zone = tz;

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile.time_zone_info) {
          this.time_zone = profile.time_zone_info;
          this.date = getNextBusinessDate(this.businessDay, this.time_zone);
        }
      }
    );
    this.taskService.scheduleData$.subscribe((res) => {
      if (res?.time_zone) this.time_zone = res.time_zone;
      this.date = getNextBusinessDate(this.businessDay, this.time_zone);
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
      this.date = getNextBusinessDate(this.businessDay, this.time_zone);
      this.time = this.startTime;
    });
  }

  ngOnInit(): void {
    const garbage = this.userService.garbage.getValue();
    this.businessHour = garbage.business_time;
    if (this.businessHour?.is_enabled) {
      const startTime = this.businessHour.start_time;
      const endTime = this.businessHour.end_time;
      const startIndex = HOURS.findIndex((e) => e.id === startTime);
      const endIndex = HOURS.findIndex((e) => e.id === endTime);
      const middleIndex = Math.ceil((endIndex - startIndex) / 2) + startIndex;
      const _min_value = moment().minutes();
      const remained = _min_value % 10;
      let new_min = 0;
      if (remained >= 3) {
        new_min = new_min + (5 - remained);
      } else {
        new_min = new_min - remained;
      }
      const nextDayTime = moment()
        .add(1, 'day')
        .set('hour', startIndex)
        .set('minute', 0)
        .set('second', 0)
        .toDate();
      const nextDayTime2 = moment()
        .add(1, 'day')
        .set('hour', middleIndex)
        .set('minute', new_min)
        .set('second', 0)
        .toDate();
      const nextWeekTime = moment()
        .add(1, 'week')
        .startOf('isoWeek')
        .set('hour', startIndex)
        .set('minute', 0)
        .set('second', 0)
        .toDate();
      this.schedule_list = [
        {
          schedule_text: 'Tomorrow business start time',
          schedule_date: nextDayTime
        },
        {
          schedule_text: 'Tomorrow time(business applied)',
          schedule_date: nextDayTime2
        },
        {
          schedule_text: 'Next Monday business start time',
          schedule_date: nextWeekTime
        }
      ];
    } else {
      const nextDayTime = moment()
        .add(1, 'day')
        .set('hour', 8)
        .set('minute', 0)
        .set('second', 0)
        .toDate();
      const nextDayTime2 = moment()
        .add(1, 'day')
        .set('hour', 13)
        .set('minute', 0)
        .set('second', 0)
        .toDate();
      const nextWeekTime = moment()
        .add(1, 'week')
        .startOf('isoWeek')
        .set('hour', 8)
        .set('minute', 0)
        .set('second', 0)
        .toDate();
      this.schedule_list = [
        { schedule_text: 'Tomorrow morning', schedule_date: nextDayTime },
        {
          schedule_text: 'Tomorrow afternoon',
          schedule_date: nextDayTime2
        },
        {
          schedule_text: 'Next Monday morning',
          schedule_date: nextWeekTime
        }
      ];
    }
  }
  sendSchedule(date: Date): void {
    const data = {
      due_date: date,
      recurrence_mode: '',
      set_recurrence: false
    };
    this.taskService.scheduleData.next(data);
    this.dialogRef.close({ due_date: date });
  }

  selectschedule(): void {
    const materialDialog = this.dialog.open(ScheduleSelectComponent, {
      width: '50vw',
      maxWidth: '600px',
      data: {
        businessHour: this.businessHour
      }
    });
    materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res) {
        this.dialogRef.close(res);
      }
    });
  }
}
