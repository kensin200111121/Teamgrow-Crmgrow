import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';

@Component({
  selector: 'app-task-recurring-dialog',
  templateUrl: './task-recurring-dialog.component.html',
  styleUrls: ['./task-recurring-dialog.component.scss']
})
export class TaskRecurringDialogComponent implements OnInit {
  actionType = 'one';
  title = 'Edit recurring event';
  description = '';
  selectOptions = [
    { value: 'one', name: 'This task' },
    { value: 'all', name: 'All tasks' }
  ];
  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<TaskRecurringDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.title) {
      this.title = this.data.title;
    }
    if (this.data && this.data.description) {
      this.description = this.data.description;
    }

    if (
      this.data &&
      this.data.selectOptions &&
      this.data.selectOptions.length
    ) {
      this.selectOptions = this.data.selectOptions;
      this.actionType = this.data.selectOptions[0].value;
    }
  }

  ngOnInit(): void {}

  close(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    const data = {
      type: this.actionType
    };
    this.dialogRef.close(data);
  }

  changeType(e): void {
    this.actionType = e.target.value;
  }
}
