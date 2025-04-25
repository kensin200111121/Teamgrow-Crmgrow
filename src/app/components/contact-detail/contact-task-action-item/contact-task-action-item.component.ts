import { Component, Input } from '@angular/core';
import { ContactActivityItemSuperComponent } from '../contact-activity-super-item/contact-activity-super-item.component';
import {
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { StoreService } from '@app/services/store.service';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { TaskEditComponent } from '@components/task-edit/task-edit.component';
import { TaskRecurringDialogComponent } from '@components/task-recurring-dialog/task-recurring-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TaskDetail } from '@models/task.model';
import { ContactService } from '@services/contact.service';
import { TaskService } from '@services/task.service';
import { HandlerService } from '@services/handler.service';
import { SspaService } from '../../../services/sspa.service';
import { DialogSettings } from '@constants/variable.constants';

@Component({
  selector: 'app-contact-task-action-item',
  templateUrl: './contact-task-action-item.component.html',
  styleUrls: ['./contact-task-action-item.component.scss']
})
export class ContactTaskActionItemComponent extends ContactActivityItemSuperComponent {
  type: ContactDetailActionType = 'follow_up';
  @Input() protected contactId: string;
  @Input() activity: ContactActivityActionV2;
  @Input() isPending: boolean;

  tab = { icon: '', label: 'Tasks', id: 'follow_up' };

  constructor(
    private dialog: MatDialog,
    protected contactDetailInfoService: ContactDetailInfoService,
    public contactService: ContactService,
    private taskService: TaskService,
    private handlerService: HandlerService,
    public sspaService: SspaService
  ) {
    super();
  }

  editTask(activity): void {
    const data = {
      ...activity,
      contact: { _id: this.contactId }
    };

    this.dialog
      .open(TaskEditComponent, {
        width: '98vw',
        maxWidth: '394px',
        data: {
          task: new TaskDetail().deserialize(data)
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.status == 'deleted') {
            this.contactDetailInfoService.callbackForRemoveContactAction(
              this.contactId,
              'follow_up'
            );
            if (!res.deleted_all) {
              // this.deleteTaskFromTasksArray(activity._id);
              this.contactService.deleteContactActivityByDetail(
                activity._id,
                'follow_ups'
              );
            } else {
              // this.deleteRecurranceTasks(activity);
            }
          } else {
            this.contactDetailInfoService.callbackForEditContactAction(
              this.contactId,
              'follow_up'
            );
          }
        }
      });
  }

  completeTask(activity): void {
    const taskId = activity._id;
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        position: { top: '100px' },
        data: {
          title: 'Complete Task',
          message: 'Are you sure to complete the task?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Complete',
          comment: {
            label: 'Task comment',
            required: false,
            value: activity.comment || ''
          }
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.taskService
            .complete(taskId, confirm['comment'])
            .subscribe((res) => {
              this.contactDetailInfoService.callbackForRemoveContactAction(
                taskId,
                'follow_up'
              );
              this.contactDetailInfoService.callbackForEditContactAction(
                this.contactId,
                'follow_up'
              );
              this.editTaskComment(taskId, confirm['comment']);
            });
        }
      });
  }

  unCompleteTask(activity): void {
    const taskId = activity._id;
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        position: { top: '100px' },
        data: {
          title: 'Uncomplete Task',
          message: 'Are you sure to uncomplete the task?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Uncomplete',
          comment: {
            label: 'Task incompletion comment',
            required: false,
            value: activity.comment || ''
          }
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.taskService
            .unComplete(taskId, confirm['comment'])
            .subscribe((res) => {
              this.contactDetailInfoService.callbackForEditContactAction(
                this.contactId,
                'follow_up'
              );
              this.editTaskComment(taskId, confirm['comment']);
            });
        }
      });
  }

  editTaskComment(taskId: string, comment: string): void {}

  archiveTask(activity): void {
    const taskId = activity._id;
    if (
      activity.set_recurrence &&
      activity.status !== 1
      //  &&      this.selectedTimeSort.id === 'all'
    ) {
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

          this.taskService
            .archive([activity], include_recurrence)
            .subscribe((status) => {
              if (status) {
                this.contactDetailInfoService.callbackForRemoveContactAction(
                  taskId,
                  'follow_up'
                );
              }
            });
        });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Archive Task',
            message: 'Are you sure to archive the task?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Confirm'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) {
            this.taskService.archive([activity]).subscribe((status) => {
              if (status) {
                this.contactDetailInfoService.callbackForRemoveContactAction(
                  taskId,
                  'follow_up'
                );
              }
            });
          }
        });
    }
  }

  leaveTaskComment(task): void {
    const taskId = task._id;
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        position: { top: '100px' },
        data: {
          title: 'Leave task comment',
          message: 'Please leave the note about your task completion',
          cancelLabel: 'Cancel',
          confirmLabel: 'Leave',
          comment: {
            label: 'Task comment',
            required: false,
            value: task.comment || ''
          }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res['comment']) {
          this.taskService
            .leaveComment(taskId, res['comment'])
            .subscribe((status) => {
              if (status) {
                this.contactDetailInfoService.callbackForEditContactAction(
                  this.contactId,
                  'follow_up'
                );
                this.editTaskComment(taskId, res['comment']);
              }
            });
        }
      });
  }
}
