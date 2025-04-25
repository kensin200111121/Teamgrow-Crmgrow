import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Label } from '@models/label.model';
import { LabelService } from '@services/label.service';

@Component({
  selector: 'app-label-merge',
  templateUrl: './label-merge.component.html',
  styleUrls: ['./label-merge.component.scss']
})
export class LabelMergeComponent implements OnInit {
  mergeList: Label[] = [];
  mergeLabels: Label[] = [];
  mergeTo = '';

  isProcessing = false;

  constructor(
    private dialogRef: MatDialogRef<LabelMergeComponent>,
    private labelService: LabelService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.mergeLabels) {
      this.mergeLabels = this.data.mergeLabels;
    }
    if (this.data && this.data.mergeList) {
      this.mergeList = this.data.mergeList;
    }
  }

  ngOnInit(): void {}

  onMergeLabel(): void {
    this.isProcessing = true;
    const filteredLabels = this.mergeLabels.filter(
      (label) => label._id !== this.mergeTo
    );
    this.labelService.mergeLabels(filteredLabels, this.mergeTo).subscribe(
      (res) => {
        if (res) {
          this.isProcessing = false;
          this.labelService.merge$(filteredLabels, this.mergeTo);
          this.dialogRef.close(this.mergeTo);
        }
      },
      (err) => {
        this.isProcessing = false;
      }
    );
  }

  onChangeLabel(label: string): void {
    this.mergeTo = label;
  }
}
