import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';

@Component({
  selector: 'app-calendar-recurring-dialog',
  templateUrl: './calendar-recurring-dialog.component.html',
  styleUrls: ['./calendar-recurring-dialog.component.scss']
})
export class CalendarRecurringDialogComponent implements OnInit {
  eventType = 'own';
  title = 'Edit recurring event';
  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CalendarRecurringDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.title) {
      this.title = this.data.title;
    }
  }

  ngOnInit(): void {}

  close(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    const data = {
      type: this.eventType
    };
    this.dialogRef.close(data);
  }

  changeType(e): void {
    this.eventType = e.target.value;
  }
}
