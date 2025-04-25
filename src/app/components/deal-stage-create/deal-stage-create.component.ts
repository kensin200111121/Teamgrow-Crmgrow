import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from '@services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-deal-stage-create',
  templateUrl: './deal-stage-create.component.html',
  styleUrls: ['./deal-stage-create.component.scss']
})
export class DealStageCreateComponent implements OnInit {
  priority = 0;
  title = '';
  submitted = false;
  saving = false;
  createSubscription: Subscription;
  showComment = false;
  isSaving = true;
  constructor(
    private dealsService: DealsService,
    private dialogRef: MatDialogRef<DealStageCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.priority) {
      this.priority = this.data.priority;
    }
    if (this.data && this.data.showComment) {
      this.showComment = this.data.showComment;
    }
    if (this.data?.unSaving) {
      this.isSaving = false;
    }
  }

  ngOnInit(): void {}

  createStages(): void {
    if (this.title === '' || this.title.trim() === '') {
      return;
    } else {
      this.saving = true;
      const data = {
        title: this.title,
        deals: [],
        priority: this.priority,
        deals_count: 0,
        duration: 0,
        pipe_line: this.dealsService.selectedPipeline.getValue()._id
      };
      if (this.isSaving) {
        this.createSubscription && this.createSubscription.unsubscribe();
        this.createSubscription = this.dealsService
          .createStage(data)
          .subscribe((res) => {
            this.saving = false;
            this.dealsService.easyGetPipeLine(true);
            this.dialogRef.close(res);
          });
      } else {
        this.dialogRef.close(data);
      }
    }
  }
}
