import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-assign-timeline-contacts',
  templateUrl: './assign-timeline-contacts.component.html',
  styleUrls: ['./assign-timeline-contacts.component.scss']
})
export class AssignTimelineContactsComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<AssignTimelineContactsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  handleCancel(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogRef.close(false);
  }

  handleYes(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialogRef.close(true);
  }
}
