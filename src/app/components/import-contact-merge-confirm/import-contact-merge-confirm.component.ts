import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-import-contact-merge-confirm',
  templateUrl: './import-contact-merge-confirm.component.html',
  styleUrls: ['./import-contact-merge-confirm.component.scss']
})
export class ImportContactMergeConfirmComponent implements OnInit {

  values;
  type;
  selected = 0;
  constructor(
    private dialogRef: MatDialogRef<ImportContactMergeConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.values = this.data.values;
      this.type = this.data.type;
    }
  }

  changeValue(row): void {
    this.selected = row;
  }

  confirm(): void {
    this.dialogRef.close({ selected: this.values[this.selected] });
  }

}
