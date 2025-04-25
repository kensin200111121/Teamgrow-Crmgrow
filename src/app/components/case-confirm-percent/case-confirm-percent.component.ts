import { Component, OnInit, Inject, Input, TemplateRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { isThisSecond } from 'date-fns';

@Component({
  selector: 'app-case-confirm-percent',
  templateUrl: './case-confirm-percent.component.html',
  styleUrls: ['./case-confirm-percent.component.scss']
})
export class CaseConfirmPercentComponent implements OnInit {
  selectedOption = 0;
  inputPercentage = false;
  percentage = 30;
  invalid = false;
  @Input('showInputpercentage') showInput: TemplateRef<HTMLElement>;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CaseConfirmPercentComponent>
  ) {
    if (this.data && this.data.percent) {
      this.percentage = this.data.percent;
    }
  }

  ngOnInit(): void {}

  selectOption(option): void {
    this.selectedOption = option;
  }

  confirm(): void {
    if (this.selectedOption === 0) {
      this.inputPercentage = true;
      return;
    } else {
      this.dialogRef.close({ status: false, setPercent: false });
    }
  }

  back(): void {
    this.dialogRef.close({ status: false, setPercent: true });
  }

  assign(): void {
    if (this.percentage < 0 || this.percentage > 100) {
      this.invalid = true;
      return;
    }
    this.dialogRef.close({ status: true, percent: this.percentage });
  }
}
