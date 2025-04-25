import { Component, Inject, OnInit } from '@angular/core';
import { TaskService } from '@services/task.service';
import { DealsService } from '@services/deals.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-task-delete',
  templateUrl: './task-delete.component.html',
  styleUrls: ['./task-delete.component.scss']
})
export class TaskDeleteComponent implements OnInit {
  deleting = false;
  follow_ups = [];
  type = 'contact';
  includeRecurrence = false;
  actionType = 'only';
  selectOptions = [
    { value: 'only', name: 'Only selected tasks.' },
    { value: 'all', name: 'All related recurrence tasks.' }
  ];
  constructor(
    private dialogRef: MatDialogRef<TaskDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskService,
    private toast: ToastrService,
    private dealsService: DealsService
  ) {
    this.follow_ups = this.data.follow_ups;
    if (this.data) {
      this.type = this.data.type;
      this.includeRecurrence = this.data.includeRecurrence;
    }
  }

  ngOnInit(): void {}

  close(): void {
    this.dialogRef.close(false);
  }

  changeType(e): void {
    this.actionType = e.target.value;
  }

  delete(): void {
    const includeRecurrence = this.actionType === 'all';
    this.deleting = true;
    if (this.type === 'deal') {
      this.dealsService
        .removeFollowUp({
          followup: this.follow_ups[0],
          include_recurrence: includeRecurrence
        })
        .subscribe((status) => {
          this.deleting = false;
          if (status) {
            this.dialogRef.close({ status: true });
          }
        });
    } else {
      this.taskService
        .archive(this.follow_ups, includeRecurrence)
        .subscribe((status) => {
          this.deleting = false;
          if (status) {
            this.dialogRef.close({ status: true });
          }
        });
    }
  }
}
