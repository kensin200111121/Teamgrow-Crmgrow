import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealsService } from '@services/deals.service';

@Component({
  selector: 'app-deal-move',
  templateUrl: './deal-move.component.html',
  styleUrls: ['./deal-move.component.scss']
})
export class DealMoveComponent implements OnInit {
  dealId = '';
  selectedStageId = '';
  currentStageId = '';
  saving = false;

  constructor(
    private dialogRef: MatDialogRef<DealMoveComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dealsService: DealsService
  ) {
    if (this.data) {
      this.selectedStageId = this.data.stage_id;
      this.currentStageId = this.data.stage_id;
      this.dealId = this.data.deal_id;
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  changeSelectedStage(evt): void {
    this.selectedStageId = evt?._id;
  }

  moveDeal(): void {
    if (this.currentStageId === this.selectedStageId) return;
    this.saving = true;
    const data = {
      deal_id: this.dealId,
      deal_stage_id: this.selectedStageId
    };
    this.dealsService.moveDeal(data).subscribe((res) => {
      this.saving = false;
      this.dialogRef.close(this.selectedStageId);
    });
  }
}
