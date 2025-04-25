import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { DialogSettings } from '@app/constants/variable.constants';
import { TaskService } from '@app/services/task.service';
import { CampaignService } from '@services/campaign.service';
@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  @ViewChild('viewport') viewport: CdkVirtualScrollViewport;
  contactId;
  @Input() tasks = [];
  @Input() loading = false;
  @Input()
  public set setContactId(val: string) {
    if (val) {
      this.contactId = val;
    }
  }
  mores = [];
  DueDateTimeFormat = 'MMM DD YYYY, hh:mm a';

  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    private campaignService: CampaignService,
    private cdRef: ChangeDetectorRef
  ) {}
  ngOnInit(): void {}

  removeScheduleItem(task: any): void {
    const confirmDlg = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Delete Schedule Item',
        message:
          "The schedule item will be removed permanently and won't be able to be restored later",
        confirmLabel: 'Yes, Delete'
      }
    });
    confirmDlg.afterClosed().subscribe((res) => {
      if (res) {
        if (task.process) {
          this.taskService
            .removeContactScheduleItem({
              id: task._id,
              contact: this.contactId
            })
            .subscribe((res) => {
              if (res) {
                this.taskService.scheduleData.next({});
              }
            });
        } else {
          this.campaignService
            .removeContact({
              campaign: task.campaign._id,
              contact: this.contactId
            })
            .subscribe((res) => {
              if (res) {
                this.taskService.scheduleData.next({});
              }
            });
        }
      }
    });
  }

  refresh(): void {
    this.taskService.scheduleData.next({});
  }
}
