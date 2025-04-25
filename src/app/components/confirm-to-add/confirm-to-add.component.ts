import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-to-add',
  templateUrl: './confirm-to-add.component.html',
  styleUrls: ['./confirm-to-add.component.scss']
})
export class ConfirmToAddComponent implements OnInit {
  option = 'prev';
  submitted = false;
  disableOption = '';

  constructor(
    private dialogRef: MatDialogRef<ConfirmToAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.disableOption) {
      this.disableOption = this.data.disableOption;
    }
  }

  ngOnInit(): void {}

  submit(): void {
    this.dialogRef.close({ option: this.option });
  }

  selectOption(option): void {
    this.option = option;
  }
}
