import { Component, Inject, OnInit } from '@angular/core';
import { numPad } from '@app/helper';
import { TIMES } from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import moment from 'moment-timezone';
import { HelperService } from '@services/helper.service';
import { TaskService } from '@services/task.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { HandlerService } from '@services/handler.service';

@Component({
  selector: 'app-task-bulk',
  templateUrl: './task-bulk.component.html',
  styleUrls: ['./task-bulk.component.scss']
})
export class TaskBulkComponent implements OnInit {
  keepSubject = 'keep_subject';
  keepDate = 'keep_date';
  TIMES = TIMES;
  MIN_DATE = {};

  type = '';
  subject = '';
  date;
  time = '12:00:00.000';

  ids = [];

  updating = false;
  bulkUpdateSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<TaskBulkComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private helperService: HelperService,
    private handlerService: HandlerService,
    private taskService: TaskService
  ) {
    const current = new Date();
    this.MIN_DATE = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };
    this.ids = this.data.ids;
    if (this.ids.length > 1) {
      this.initTime();
    }
  }

  initTime(): void {
    const myTime = moment(new Date());
    const dateTimeObj = {
      year: myTime.get('year'),
      month: myTime.get('month') + 1,
      day: myTime.get('date')
    };
    this.date = {
      year: dateTimeObj.year,
      month: dateTimeObj.month,
      day: dateTimeObj.day
    };
  }

  ngOnInit(): void {}

  submit(): void {
    let due_date;
    if (this.keepDate === 'new_date') {
      if (!this.date) {
        return;
      }
      const dateStr = `${this.date.year}-${numPad(this.date.month)}-${numPad(
        this.date.day
      )} ${this.time}`;
      due_date = moment(dateStr).format();
    }

    const data = { ids: this.ids };
    let isValid = false;
    if (this.type) {
      data['type'] = this.type;
      isValid = true;
    }
    if (this.subject) {
      data['content'] = this.subject;
      isValid = true;
    }
    if (due_date) {
      data['due_date'] = due_date;
      isValid = true;
    }
    if (isValid) {
      this.dialogRef.close(data);
    }
  }
}
