import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PlanBuyComponent } from '@components/plan-buy/plan-buy.component';

@Component({
  selector: 'app-plan-select',
  templateUrl: './plan-select.component.html',
  styleUrls: ['./plan-select.component.scss']
})
export class PlanSelectComponent implements OnInit {
  planType = 'medium';
  plans = [
    { type: 'mini', sms: '200', price: '5' },
    { type: 'medium', sms: '500', price: '13' },
    { type: 'maxi', sms: '1000', price: '16' }
  ];
  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<PlanSelectComponent>
  ) {}

  ngOnInit(): void {}

  selectPlan(type: string): void {
    this.planType = type;
  }

  planBuy(): void {
    const selectedPlan = this.plans.filter(
      (plan) => plan.type == this.planType
    );
    this.dialogRef.close();
    this.dialog.open(PlanBuyComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '400px',
      disableClose: true,
      data: {
        plan: selectedPlan[0]
      }
    });
  }
}
