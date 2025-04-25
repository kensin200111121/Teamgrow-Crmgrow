import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from '@services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Deal } from '@models/deal.model';
import { Contact } from '@models/contact.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-deal-edit',
  templateUrl: './deal-edit.component.html',
  styleUrls: ['./deal-edit.component.scss']
})
export class DealEditComponent implements OnInit {
  deal = new Deal();
  saving = false;
  saveSubscription: Subscription;
  maxValueFlag = false;
  decimalPointFlag = false;

  constructor(
    public dealsService: DealsService,
    private dialogRef: MatDialogRef<DealEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.deal) {
      this.deal.deserialize(this.data.deal);
    }
  }

  ngOnInit(): void {}

  editDeals(): void {
    if (this.maxValueFlag || this.maxValueFlag) {
      return;
    }
    const data = {
      title: this.deal.title,
      deal_stage: this.deal.deal_stage
    };
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saving = true;
    this.saveSubscription = this.dealsService
      .editDeal(this.deal._id, data)
      .subscribe((res) => {
        this.saving = false;
        if (res) {
          this.dialogRef.close(data);
        }
      });
  }
}
