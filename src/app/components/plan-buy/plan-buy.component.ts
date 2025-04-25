import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-plan-buy',
  templateUrl: './plan-buy.component.html',
  styleUrls: ['./plan-buy.component.scss']
})
export class PlanBuyComponent implements OnInit {
  plan = {
    type: '',
    sms: '',
    price: ''
  };
  constructor(
    private dialogRef: MatDialogRef<PlanBuyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.plan = this.data.plan;
  }

  ngOnInit(): void {}

  confirm(): void {
    this.dialogRef.close();
  }
}
