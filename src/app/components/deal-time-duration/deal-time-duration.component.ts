import { Component, Inject, Input, OnInit } from '@angular/core';
import { Contact } from '@models/contact.model';
import { DealsService } from '@services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealStage } from '@models/deal-stage.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-deal-time-duration',
  templateUrl: './deal-time-duration.component.html',
  styleUrls: ['./deal-time-duration.component.scss']
})
export class DealTimeDurationComponent implements OnInit {
  selectedStage = '';
  saving = false;
  timeduration = 1;
  submitted = false;
  updateSubscription: Subscription;
  moving = false;

  constructor(
    private dialogRef: MatDialogRef<DealTimeDurationComponent>,
    private dealsService: DealsService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.selectedStage = this.data.id;
    this.timeduration = this.data.duration || 1;
  }

  setTimeDuration(): void {
    if (this.timeduration == 0) {
      return;
    }
    if (this.timeduration === this.data.duration) {
      return;
    }
    this.saving = true;
    if (this.data.id) {
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.dealsService
        .updateStage(this.selectedStage, { duration: this.timeduration })
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.dialogRef.close(this.timeduration);
          }
        });
    } else {
      this.dialogRef.close(this.timeduration);
    }
  }

  removeDuration(): void {
    if (this.timeduration === 0) {
      this.dialogRef.close();
      return;
    }
    this.moving = true;
    this.timeduration = 0;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.dealsService
      .updateStage(this.selectedStage, { duration: 0 })
      .subscribe((res) => {
        this.moving = false;
        if (res) {
          this.dialogRef.close(0);
        }
      });
  }

  closeDialog(): void {
    this.dialogRef.close(-1);
  }
}
