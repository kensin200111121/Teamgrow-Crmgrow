import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-case-confirm-keep',
  templateUrl: './case-confirm-keep.component.html',
  styleUrls: ['./case-confirm-keep.component.scss']
})
export class CaseConfirmKeepComponent implements OnInit {
  selectedOption = 'switch';
  type = 'email';
  switchType = 'Opened Email';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CaseConfirmKeepComponent>
  ) {
    if (this.data && this.data.branchType) {
      if (this.data.branchType === 'opened_email') {
        this.switchType = 'Watched Material';
      }
    }
    if (this.data && this.data.type) {
      this.type = this.data.type;
      if (this.type === 'text') {
        this.selectedOption = 'trueCase';
      }
    }
  }

  ngOnInit(): void {}

  selectOption(option): void {
    this.selectedOption = option;
  }

  confirm(): void {
    this.dialogRef.close({ option: this.selectedOption });
  }
}
