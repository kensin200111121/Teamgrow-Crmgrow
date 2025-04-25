import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { HOURS, REPEAT_DURATIONS, TIMES } from '@constants/variable.constants';
import { TaskDetail } from '@models/task.model';
import { HandlerService } from '@services/handler.service';
import { TaskService } from '@services/task.service';
import moment from 'moment-timezone';
import { UserService } from '@services/user.service';
import { HelperService } from '@services/helper.service';
import { getNextBusinessDate, getUserTimezone } from '@app/helper';
import { TaskDeleteComponent } from '@components/task-delete/task-delete.component';
import { DealsService } from '@services/deals.service';
import { ToastrService } from 'ngx-toastr';
import { TaskRecurringDialogComponent } from '@components/task-recurring-dialog/task-recurring-dialog.component';
import * as _ from 'lodash';
import { SendEmailComponent } from '@components/send-email/send-email.component';
import { SendTextComponent } from '@components/send-text/send-text.component';
import { Contact } from '@models/contact.model';
import { Garbage } from '@models/garbage.model';
import { NotifyComponent } from '../notify/notify.component';
import { DialogSettings } from '@constants/variable.constants';
import { Router } from '@angular/router';
import { ConfirmComponent } from '../confirm/confirm.component';

@Component({
  selector: 'app-task-edit',
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.scss']
})
export class TaskEditComponent implements OnInit {
  REPEAT_DURATIONS = REPEAT_DURATIONS;
  TIMES = TIMES;
  MIN_DATE = {};

  date;
  time = '12:00:00.000';
  task = new TaskDetail();
  contact_id;

  timezone;
  type = '';
  deal = '';
  updating = false;
  updateSubscription: Subscription;
  deleting = false;

  schedule_mode = 'all';
  edit_mode = 'one';
  scheduleOptions = [];
  recurrenceOptions = [];
  step = 1;

  startTime = HOURS[0].id;
  endTime = HOURS[23].id;
  orgSet_recurrence;
  orgRecurrence_mode;
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
    ? moment.tz.guess()
    : moment.tz.guess();

  garbageSubscription: Subscription;
  profileSubscription: Subscription;

  constructor(
    private taskService: TaskService,
    private handlerService: HandlerService,
    private userService: UserService,
    private helperService: HelperService,
    private dealsService: DealsService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<TaskEditComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile.time_zone_info && !this.data?.task?.timezone) {
          this.time_zone = getUserTimezone(profile, false);
          this.date = getNextBusinessDate(this.businessDay, this.time_zone);
        }
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
    });

    if (this.data) {
      if (this.data.type === 'deal') {
        this.type = 'deal';
        if (this.data.deal) {
          this.deal = this.data.deal;
        }
      }
      if (this.data.task) {
        this.task = this.task.deserialize(this.data.task);
        if (this.task.timezone) {
          this.time_zone = this.task.timezone;
        }
        if (this.task.assigned_contacts) {
          this.task.assigned_contacts = this.task.assigned_contacts.map(
            (item) => item._id
          );
        }
        this.initTime();
        this.orgSet_recurrence = this.task.set_recurrence;
        this.orgRecurrence_mode = this.task.recurrence_mode;
      }
      if (this.data.contact) {
        this.contact_id = this.data.contact;
      }
    }
  }

  initTime(): void {
    const due_date = moment.tz(this.task.due_date, this.task.timezone);
    this.date = due_date;
    this.time = due_date.format('HH:mm:[00.000]');
  }

  ngOnInit(): void {}

  toggleRepeatSetting(): void {
    this.task.recurrence_mode = this.task.recurrence_mode || 'DAILY';
    this.task.set_recurrence = !this.task.set_recurrence;
  }

  toggleAutoComplete(): void {
    this.task.set_auto_complete = !this.task.set_auto_complete;
  }

  deleteTask(): void {
    if (this.data.task.set_recurrence) {
      this.dialog
        .open(TaskRecurringDialogComponent, {
          disableClose: true,
          data: {
            title: 'recurrence_task_delete'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (!res) {
            return;
          }
          const include_recurrence = res.type == 'all';

          this.deleting = true;
          if (this.type === 'deal') {
            this.dealsService
              .removeFollowUp({ followup: this.task, include_recurrence })
              .subscribe((status) => {
                this.deleting = false;
                if (status) {
                  this.dialogRef.close({
                    status: 'deleted',
                    deleted_all: include_recurrence
                  });
                }
              });
          } else {
            this.taskService
              .archive([this.task], include_recurrence)
              .subscribe((status) => {
                this.deleting = false;
                if (status) {
                  this.handlerService.reload$('tasks');
                  this.dialogRef.close({
                    status: 'deleted',
                    deleted_all: include_recurrence
                  });
                }
              });
          }
        });
    } else {
      const dialog = this.dialog.open(TaskDeleteComponent, {
        data: {
          follow_ups: [this.task],
          type: this.type
        }
      });

      dialog.afterClosed().subscribe((res) => {
        if (res && res.status) {
          this.type !== 'deal' && this.handlerService.reload$('tasks');
          this.dialogRef.close({ status: 'deleted', deleted_all: false });
        }
      });
    }
  }

  isSame(): boolean {
    const dateStr = this.getSelectedDateTime();
    const due_date = moment(dateStr).format();
    this.task.timezone = this.time_zone;
    const isEqual =
      _.isEqual(
        _.omit(this.data.task, ['due_date']),
        _.omit(this.task, ['due_date'])
      ) && moment(this.data.task.due_date).isSame(due_date);

    return isEqual;
  }

  isRecurringChanged(): boolean {
    if (this.task.set_recurrence != this.orgSet_recurrence) return true;
    if (this.task.recurrence_mode != this.orgRecurrence_mode) return true;
    return false;
  }
  submit(): void {
    if (this.isSame() || !this.time_zone) {
      return;
    }
    this.schedule_mode = 'all';
    this.edit_mode = 'one';
    this.scheduleOptions = [
      { value: 'one', name: 'This contact' },
      { value: 'all', name: 'All contacts' }
    ];
    this.recurrenceOptions = [
      { value: 'one', name: 'This task' },
      { value: 'following', name: 'This and following tasks' },
      { value: 'all', name: 'All tasks' }
    ];
    if (this.task.set_recurrence) {
      const dateStr = `${this.date.year}-${this.date.month}-${this.date.day}`;
      if (this.data.task.recurrence_mode !== this.task.recurrence_mode) {
        this.recurrenceOptions = [
          { value: 'following', name: 'This and following tasks' },
          { value: 'all', name: 'All tasks' }
        ];
      } else if (
        moment(this.data.task.due_date).format('YYYY-MM-DD') !==
        moment(dateStr).format('YYYY-MM-DD')
      ) {
        this.recurrenceOptions = [
          { value: 'one', name: 'This task' },
          { value: 'following', name: 'This and following tasks' }
        ];
      }
    }
    this.taskSetting();
  }

  taskSetting(): void {
    if (this.step === 1) {
      this.step += 1;
      if (
        this.type !== 'deal' &&
        this.data.task.task &&
        this.data.task.task.contacts.length > 1
      ) {
        this.dialog
          .open(TaskRecurringDialogComponent, {
            disableClose: true,
            data: {
              title: 'schedule_task_edit',
              description:
                'This task has been bulk created with other contacts. Would you like to save the changes for',
              selectOptions: this.scheduleOptions
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (!res) {
              return;
            }
            this.schedule_mode = res.type;
            this.taskSetting();
          });
      } else {
        this.taskSetting();
      }
    } else if (this.step === 2) {
      this.step += 1;
      if (this.data.task.set_recurrence && this.data.task.parent_follow_up) {
        if (this.task.set_recurrence) {
          this.dialog
            .open(TaskRecurringDialogComponent, {
              disableClose: true,
              data: {
                title: 'recurrence_task_edit',
                selectOptions: this.recurrenceOptions
              }
            })
            .afterClosed()
            .subscribe((res) => {
              if (!res) {
                return;
              }
              this.edit_mode = res.type;
              this.taskSetting();
            });
        } else {
          this.edit_mode = 'all';
          this.taskSetting();
        }
      } else {
        this.edit_mode = 'one';
        this.taskSetting();
      }
    } else {
      this.updateTask();
    }
    // else if (this.data.task.task) {
    //   selectOptions = [
    //     { value: 'one', name: 'This task' },
    //     { value: 'all', name: 'All tasks' }
    //   ];
    //   this.dialog
    //     .open(TaskRecurringDialogComponent, {
    //       disableClose: true,
    //       data: {
    //         title: 'schedule_task_edit',
    //         selectOptions
    //       }
    //     })
    //     .afterClosed()
    //     .subscribe((res) => {
    //       if (!res) {
    //         return;
    //       }
    //       this.updateTask(res.type);
    //     });
    // }
  }

  updateTask(): void {
    const dateStr = this.getSelectedDateTime();
    const due_date = moment.tz(dateStr, this.time_zone).format();
    if (due_date === 'Invalid date') {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          title: 'Time selection error',
          message: 'Please select valid time.',
          cancelLabel: 'Close'
        }
      });
      return;
    }
    const recurring_changed = this.isRecurringChanged();
    const data = {
      ...this.task,
      recurrence_mode: this.task.set_recurrence
        ? this.task.recurrence_mode
        : undefined,
      due_date,
      timezone: this.time_zone,
      edit_mode: this.edit_mode,
      schedule_mode: this.schedule_mode,
      set_auto_complete: this.task.set_auto_complete
    };

    if (this.type === 'deal') {
      this.updating = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.dealsService
        .editFollowUp({
          ...data,
          followup: this.task._id,
          deal: this.deal,
          contact: undefined,
          _id: undefined
        })
        .subscribe((res) => {
          this.updating = false;
          if (res && res['status']) {
            if (res['task']) {
              this.editScheduleItem(res['task'], data);
            } else {
              this.dialogRef.close({
                status: true,
                recurring_changed: recurring_changed,
                data
              });
            }
          }
        });
    } else {
      this.updating = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.taskService
        .update(this.task._id, data)
        .subscribe((res) => {
          this.updating = false;
          if (res && res['status']) {
            this.handlerService.reload$('tasks');
            if (res['task']) {
              this.editScheduleItem(res['task']);
            } else {
              this.dialogRef.close({ recurring_changed: recurring_changed });
            }
          }
        });
    }
  }

  editScheduleItem(scheduleItem: any, data: any = {}): void {
    const selectOptions = [
      { value: 'remove', name: 'Remove Schedule Item' },
      { value: 'edit', name: 'Remove Old & Create New' }
    ];
    const contacts = scheduleItem.contacts.map((e) =>
      new Contact().deserialize(e)
    );
    let scheduleData = { ...scheduleItem, contacts };
    this.dialog
      .open(TaskRecurringDialogComponent, {
        disableClose: true,
        data: {
          title: 'schedule_task_edit',
          description: 'schedule_task_edit_description',
          selectOptions
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res) {
          this.dialogRef.close({ status: true, data });
        } else if (res.type === 'remove') {
          this.updating = true;
          this.taskService
            .removeScheduleItem({
              id: scheduleItem._id
            })
            .subscribe(() => {
              this.updating = false;
              this.dialogRef.close({ status: true, data });
            });
        } else if (res.type === 'edit') {
          this.dialogRef.close({ status: true, data });
          if (scheduleItem.type === 'send_email') {
            scheduleData = {
              ...scheduleData,
              type: 'email',
              subject: scheduleItem.action.subject,
              content: scheduleItem.action.content
            };
            this.dialog.open(SendEmailComponent, {
              position: {
                bottom: '0px',
                right: '0px'
              },
              width: '100vw',
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: { ...scheduleData }
            });
          } else if (scheduleItem.type == 'send_text') {
            scheduleData = {
              ...scheduleData,
              type: 'text',
              content: scheduleItem.action.content
            };
            this.dialog.open(SendTextComponent, {
              position: {
                bottom: '0px',
                right: '0px'
              },
              width: '100vw',
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: { ...scheduleData }
            });
          }
        }
      });
  }

  toggleTimeSelector(event): void {
    this.task.is_full = event.target.checked;
    if (this.task.is_full) {
      this.time = '00:00:00.000';
    } else {
      this.time = this.startTime;
    }
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
  }
}
