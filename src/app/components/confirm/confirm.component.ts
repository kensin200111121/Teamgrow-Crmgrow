import { SspaService } from '../../services/sspa.service';
import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealStage } from '@models/deal-stage.model';
import { Pipeline } from '@models/pipeline.model';
import { DealsService } from '@services/deals.service';
import { toggle } from '@utils/functions';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {
  onOtherAction = new EventEmitter();
  onConfirmAction = new EventEmitter();
  submitting = false;
  comment = '';
  step = 1;
  hasDealStages = false;
  dealStages: DealStage[] = [];
  mapDealStage = {};
  hasMultiPipeline = false;
  stages: DealStage[] = [];
  selectedDownloadItems = [];
  mode = 'normal';

  constructor(
    public dealsService: DealsService,
    public dialogRef: MatDialogRef<ConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    if (this.data && this.data['dealStages']) {
      this.dealStages = this.data['dealStages'];
      if (this.dealStages && this.dealStages.length > 0) {
        this.hasDealStages = true;
        const pipelineIds = this.dealStages.map((item) => item.pipe_line);
        this.hasMultiPipeline = pipelineIds.every(
          (val, i, arr) => val === arr[0]
        )
          ? false
          : true;

        for (const dealStage of this.dealStages) {
          this.mapDealStage[dealStage._id] = '';
        }
      }
      this.dealsService.easyLoadStage(
        true,
        this.dealsService.selectedPipeline.getValue()
      );
      this.dealsService.stages$.subscribe((res) => {
        this.stages = [...res];
        for (const dealStage of this.dealStages) {
          if (this.stages.length > 0) {
            this.mapDealStage[dealStage._id] = this.stages[0]._id;
          } else {
            this.mapDealStage[dealStage._id] = '';
          }
        }
      });
    }
  }

  ngOnInit(): void {
    if (this.data.comment && this.data.comment.value) {
      this.comment = this.data.comment.value;
    }
    if (this.data.mode) {
      this.mode = this.data.mode;
    }
  }

  closeWithAnswer(answer): void {
    this.dialogRef.close(answer.value);
  }

  doAdditionalAction(): void {
    this.onOtherAction.emit(new Date().getTime());
  }

  close(): void {
    if (this.data['comment']) {
      this.dialogRef.close({ comment: this.comment });
    } else {
      if (this.data.type == 'stop share') {
        this.dialogRef.close({ status: true });
      } else {
        this.dialogRef.close({
          status: true,
          selectedDownloadItems: this.selectedDownloadItems
        });
      }
    }
  }

  cancel(): void {
    this.dialogRef.close({ status: false });
  }

  doConfirm(): void {
    if (this.hasDealStages) {
      const match_detail = {};
      for (const key in this.mapDealStage) {
        match_detail[key] = this.mapDealStage[key];
      }
      match_detail['pipeline'] = this.dealsService.selectedPipeline.getValue();
      this.dialogRef.close({ match_detail });
    } else {
      this.onConfirmAction.emit(new Date().getTime());
    }
  }

  goNext(): void {
    this.step = 2;
  }

  onChangePipeline(pipeline): void {
    this.dealsService.selectedPipeline.next(pipeline);
    this.dealsService.easyLoadStage(
      true,
      this.dealsService.selectedPipeline.getValue()
    );
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...res];
      for (const dealStage of this.dealStages) {
        if (this.stages.length > 0) {
          this.mapDealStage[dealStage._id] = this.stages[0]._id;
        } else {
          this.mapDealStage[dealStage._id] = '';
        }
      }
    });
  }

  onCopyPipeline(): void {
    const detail = {};
    for (const key in this.mapDealStage) {
      const index = this.dealStages.findIndex((item) => item._id == key);
      if (index >= 0) {
        detail[key] = {
          dealStage: this.mapDealStage[key]
        };
      }
    }
    const matchInfo = {
      mode: 'create',
      original_pipeline: this.dealStages[0].pipe_line,
      new_pipeline: '',
      detail
    };

    this.dialogRef.close({ matchInfo });
  }

  toggleDownloadedItem(itemId: string): void {
    this.selectedDownloadItems = toggle(this.selectedDownloadItems, itemId);
  }

  isSelected(itemId: string): boolean {
    return [...this.selectedDownloadItems].includes(itemId);
  }

  checkDownloadItems(): boolean {
    const relatedItemsCount = this.data?.relatedItemsCount || 0;
    const requestItems = relatedItemsCount + this.selectedDownloadItems.length;
    if (this.data['confirmLabel'] === 'Download' && requestItems === 0) {
      return true;
    } else {
      return false;
    }
  }
}
