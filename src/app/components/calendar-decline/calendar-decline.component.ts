import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-calendar-decline',
  templateUrl: './calendar-decline.component.html',
  styleUrls: ['./calendar-decline.component.scss']
})
export class CalendarDeclineComponent implements OnInit {
  decline_message = '';
  constructor(private dialogRef: MatDialogRef<CalendarDeclineComponent>) {}

  ngOnInit(): void {}

  submitMessage(): void {
    this.dialogRef.close({ message: this.decline_message });
  }
  skipMessage(): void {
    this.dialogRef.close({ message: '' });
  }
}
