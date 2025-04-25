import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-bulk-templates',
  templateUrl: './confirm-bulk-templates.component.html',
  styleUrls: ['./confirm-bulk-templates.component.scss']
})
export class ConfirmBulkTemplatesComponent implements OnInit {
  priority = 0;
  title = '';
  submitted = false;
  saving = false;
  createSubscription: Subscription;
  defaultTemplateId: string;
  d_status = {};
  sharedTeams: any[];

  constructor(
    private dialogRef: MatDialogRef<ConfirmBulkTemplatesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if(data) console.log('data--------------', data);
  }

  ngOnInit(): void {}

  expandDetails(id): void {
    if (this.d_status[id]) {
      this.d_status[id] = false;
    } else {
      this.d_status[id] = true;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
