import { SspaService } from '../../services/sspa.service';
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Video } from '@models/video.model';

@Component({
  selector: 'app-confirm-bulk-materials',
  templateUrl: './confirm-bulk-materials.component.html',
  styleUrls: ['./confirm-bulk-materials.component.scss']
})
export class ConfirmBulkMaterialsComponent implements OnInit {
  onOtherAction = new EventEmitter();
  onConfirmAction = new EventEmitter();
  submitting = false;
  comment: string = '';
  d_status = {};

  constructor(
    public dialogRef: MatDialogRef<ConfirmBulkMaterialsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    if (this.data.comment && this.data.comment.value) {
      this.comment = this.data.comment.value;
    }
  }

  closeWithAnswer(answer): void {
    this.dialogRef.close(answer.value);
  }

  doAdditionalAction(): void {
    this.onOtherAction.emit(new Date().getTime());
  }

  close(): void {
    if (this.data['comment']) {
      this.dialogRef.close({ comment: this.comment });
    } else {
      this.dialogRef.close(true);
    }
  }

  doConfirm(): void {
    this.onConfirmAction.emit(new Date().getTime());
  }
  expandDetails(id): void {
    if (this.d_status[id]) {
      this.d_status[id] = false;
    } else {
      this.d_status[id] = true;
    }
  }
  getMaterialType(type): string {
    if (type === 'video') {
      return 'Video';
    } else if (type === 'pdf') {
      return 'Pdf';
    } else if (type === 'image') {
      return 'Image';
    }
  }
}
