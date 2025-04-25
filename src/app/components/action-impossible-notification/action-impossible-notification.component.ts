import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-action-impossible-notification',
  templateUrl: './action-impossible-notification.component.html',
  styleUrls: ['./action-impossible-notification.component.scss']
})
export class ActionImpossibleNotificationComponent implements OnInit {
  title: string = '';
  message: string = '';
  details: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<ActionImpossibleNotificationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.title = this.data.title;
    this.message = this.data.message;
    this.details = this.data.details;
  }

  ngOnInit(): void {}
}
