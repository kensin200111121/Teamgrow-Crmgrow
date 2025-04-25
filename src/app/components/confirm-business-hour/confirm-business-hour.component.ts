import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealStage } from '@models/deal-stage.model';
import { Pipeline } from '@models/pipeline.model';
import { DealsService } from '@services/deals.service';

@Component({
  selector: 'app-confirm-business-hour',
  templateUrl: './confirm-business-hour.component.html',
  styleUrls: ['./confirm-business-hour.component.scss']
})
export class ConfirmBusinessComponent implements OnInit {
  onOtherAction = new EventEmitter();
  onConfirmAction = new EventEmitter();
  submitting = false;
  notShow = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmBusinessComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

  }

  ngOnInit(): void {
  }

  toggle(event): void {
    this.notShow = event.target.checked;
  }

  close(): void {
    this.dialogRef.close(true);
  }

  doConfirm(): void {
    this.dialogRef.close({ notShow: this.notShow });
  }
}
