import * as _ from 'lodash';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { TIMES } from '@constants/variable.constants';
import { ScheduleService } from '@services/schedule.service';
import { EventType } from '@models/eventType.model';

@Component({
  selector: 'app-schedule-event-type',
  templateUrl: './schedule-event-type.component.html',
  styleUrls: ['./schedule-event-type.component.scss']
})
export class ScheduleEventTypeComponent implements OnInit, OnDestroy {
  TIMES = TIMES;

  MeetingTypes = [
    {
      name: 'One-on-One',
      description: 'Let an invitee pick a time to meet with you.',
      value: 1
    },
    {
      name: 'Group',
      description: 'Let multiple invitees meet with you at one time.',
      value: 2
    }
  ];
  Locations = [
    {
      name: 'Phone Call',
      value: 'phone'
    },
    // {
    //   name: 'Google Meet',
    //   value: 'google_meet'
    // },
    {
      name: 'Zoom',
      value: 'zoom'
    }
  ];
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
      name: '15 min',
      value: 15
    },
    {
      name: '30 min',
      value: 30
    },
    {
      name: '45 min',
      value: 45
    },
    {
      name: '60 min',
      value: 60
    }
  ];
  WeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  isNew = true;
  saveSubscription: Subscription;
  saving = false;

  eventType: EventType = new EventType();
  dateRange: any = {
    type: 'days',
    data: {
      days: {
        type: 'business',
        value: 60
      },
      range: {
        start: undefined,
        end: undefined
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

  constructor(
    private dialogRef: MatDialogRef<ScheduleEventTypeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventType,
    private dialog: MatDialog,
    public scheduleService: ScheduleService
  ) {
    if (this.data) {
      this.isNew = false;
      this.eventType.deserialize(this.data);
      this.weeklyHours = this.eventType.weekly_hours;
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  save(): any {
    this.eventType.weekly_hours = this.weeklyHours;

    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    if (this.isNew) {
      this.saveSubscription = this.scheduleService
        .createEventType(this.eventType)
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.dialogRef.close(res);
          }
        });
    } else {
      this.saveSubscription = this.scheduleService
        .updateEventType(this.eventType._id, this.eventType)
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.dialogRef.close(res);
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
}
