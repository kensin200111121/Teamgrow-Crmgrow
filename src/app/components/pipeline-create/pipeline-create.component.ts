import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pipeline-create',
  templateUrl: './pipeline-create.component.html',
  styleUrls: ['./pipeline-create.component.scss']
})
export class PipelineCreateComponent implements OnInit {
  priority = 0;
  title = '';
  submitted = false;
  saving = false;
  createSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<PipelineCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.priority) {
      this.priority = this.data.priority;
    }
  }

  ngOnInit(): void {}

  createPipelines(): void {
    if (this.title === '' || this.title.trim() === '') {
      return;
    } else {
      this.saving = true;
      const data = {
        title: this.title
      };
      this.dialogRef.close(data);
    }
  }
}
