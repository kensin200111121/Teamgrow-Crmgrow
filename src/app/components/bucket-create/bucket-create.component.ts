import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IBucket } from '@app/types/buckete';

@Component({
  selector: 'app-bucket-create',
  templateUrl: './bucket-create.component.html',
  styleUrls: ['./bucket-create.component.scss']
})
export class BucketCreateComponent implements OnInit {
  bucket: IBucket;

  constructor(
    private dialogRef: MatDialogRef<BucketCreateComponent>,
    @Inject(MAT_DIALOG_DATA) private data: number
  ) {
    this.bucket = {
      name: 'New Bucket',
      score: this.data,
      duration: 2,
      _id: null
    };
  }

  ngOnInit(): void {}

  onSave(bucket: IBucket): void {
    this.dialogRef.close(bucket);
  }
}
