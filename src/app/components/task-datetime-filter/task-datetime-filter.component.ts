import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TaskSearchOption } from '@models/searchOption.model';
import { TaskService } from '@services/task.service';
import { FILTER_TIMES } from '@constants/variable.constants';
import {
  convertTimetoObj,
  convertTimetoTz,
  getCurrentTimezone
} from '@app/helper';
import moment from 'moment-timezone';

@Component({
  selector: 'app-task-datetime-filter',
  templateUrl: './task-datetime-filter.component.html',
  styleUrls: ['./task-datetime-filter.component.scss']
})
export class TaskDatetimeFilterComponent implements OnInit {
  searchOption: TaskSearchOption = new TaskSearchOption();
  TIMES = FILTER_TIMES;
  date_mode: number; // 0 --> Sort by, 1 --> Filter(Start date, End date)
  startDateTime;
  endDateTime;
  startDate;
  startTime = '00:00:00.000';
  endDate;
  endTime = '23:59:59.000';
  timezone = { zone: getCurrentTimezone() };
  showStartDate = true;
  showEndDate = true;
  @Output() filter = new EventEmitter();
  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.searchOption = new TaskSearchOption().deserialize(
      JSON.parse(JSON.stringify(this.taskService.searchOption.getValue()))
    );

    const option = this.searchOption;
    this.date_mode = option.date_mode;
    if (this.date_mode === 0) {
      this.showStartDate = false;
      this.showEndDate = false;
      this.startDateTime = option.start_date;
      this.endDateTime = option.end_date;
    } else {
      if (option.start_date && moment(option.start_date).isValid()) {
        this.showStartDate = true;
        const timeObj1 = convertTimetoObj(option.start_date, this.timezone);
        this.startDate = { ...timeObj1, time: undefined };
        this.startTime = timeObj1.time;
      } else {
        this.showStartDate = false;
        this.startDate = null;
        this.startTime = null;
      }

      if (option.end_date && moment(option.end_date).isValid()) {
        const timeObj2 = convertTimetoObj(option.end_date, this.timezone);
        this.endDate = { ...timeObj2, time: undefined };
        this.endTime = timeObj2.time;
        this.showEndDate = true;
      } else {
        this.showEndDate = false;
        this.endTime = null;
        this.showEndDate = null;
      }
    }
  }

  changeTime(type: string): void {
    if (type === 'start') {
      if (this.startDate) {
        this.changeDate(type);
      }
    } else {
      if (this.endDate) {
        this.changeDate(type);
      }
    }
  }

  toggleDateInput(checked, type): void {
    this.date_mode = 1;
    let timeObj = convertTimetoObj(
      moment().startOf('day').format(),
      this.timezone
    );
    if (type === 'start') {
      if (checked && this.showEndDate) {
        const end_date = convertTimetoTz(
          this.endDate,
          this.endTime,
          this.timezone
        );
        timeObj = convertTimetoObj(
          moment(end_date).startOf('day').format(),
          this.timezone
        );
      }

      this.showStartDate = checked;
      this.startDate = checked ? { ...timeObj, time: undefined } : null;
      this.startTime = checked ? timeObj.time : null;
    } else {
      timeObj = convertTimetoObj(moment().endOf('day').format(), this.timezone);
      if (checked && this.showStartDate) {
        const start_date = convertTimetoTz(
          this.startDate,
          this.startTime,
          this.timezone
        );
        timeObj = convertTimetoObj(
          moment(start_date).endOf('day').format(),
          this.timezone
        );
      }
      this.showEndDate = checked;
      this.endDate = checked ? { ...timeObj, time: undefined } : null;
      this.endTime = checked ? timeObj.time : null;
    }
  }

  changeDate(type: string): void {
    let start_date, end_date;
    if (this.startDate) {
      start_date = convertTimetoTz(
        this.startDate,
        this.startTime,
        this.timezone
      );
    }
    if (this.endDate) {
      end_date = convertTimetoTz(this.endDate, this.endTime, this.timezone);
    }

    if (
      start_date &&
      end_date &&
      moment(start_date).isAfter(moment(end_date))
    ) {
      if (type === 'start') {
        end_date = moment(start_date).clone().add(1, 'day').format();
      } else {
        start_date = moment(end_date).clone().subtract(1, 'day').format();
      }
    }

    if (start_date) {
      const timeObj1 = convertTimetoObj(start_date, this.timezone);
      this.startDate = { ...timeObj1, time: undefined };
      this.startTime = timeObj1.time;
    }

    if (end_date) {
      const timeObj2 = convertTimetoObj(end_date, this.timezone);
      this.endDate = { ...timeObj2, time: undefined };
      this.endTime = timeObj2.time;
    }
  }

  save(): void {
    this.searchOption.date_mode = this.date_mode;
    if (this.date_mode === 0) {
      this.searchOption.start_date = this.startDateTime;
      this.searchOption.end_date = this.endDateTime;
    } else {
      if (this.startDate) {
        const start_date = convertTimetoTz(
          this.startDate,
          this.startTime,
          this.timezone
        );
        this.searchOption.start_date = start_date;
      }
      if (this.endDate) {
        const end_date = convertTimetoTz(
          this.endDate,
          this.endTime,
          this.timezone
        );
        this.searchOption.end_date = end_date;
      }
      if (!this.showStartDate) {
        this.searchOption.start_date = undefined;
      }
      if (!this.showEndDate) {
        this.searchOption.end_date = undefined;
      }
    }
    this.filter.emit(this.searchOption);
  }
}
