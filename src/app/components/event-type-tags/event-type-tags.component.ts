import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-event-type-tags',
  templateUrl: './event-type-tags.component.html',
  styleUrls: ['./event-type-tags.component.scss']
})
export class EventTypeTagsComponent implements OnInit {
  submitted = false;
  saving = false;

  tags = [];
  constructor(
    private dialogRef: MatDialogRef<EventTypeTagsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data?.tags) {
      this.tags = this.data.tags;
    }
  }

  setTags(): void {
    this.saving = true;
    this.saving = false;
    this.dialogRef.close(this.tags);
  }
}
