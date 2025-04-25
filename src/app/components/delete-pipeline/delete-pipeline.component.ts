import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Pipeline } from '@models/pipeline.model';
import { DealsService } from '@services/deals.service';
import { DealStage } from '@models/deal-stage.model';
import { Deal } from '@models/deal.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-delete-pipeline',
  templateUrl: './delete-pipeline.component.html',
  styleUrls: ['./delete-pipeline.component.scss']
})
export class DeletePipelineComponent implements OnInit {
  currentOption = 'remove-all';
  currentPipeline: Pipeline;
  selectedPipeline: Pipeline = new Pipeline();
  selectedStage: DealStage = new DealStage();
  deals: Deal[] = [];
  stages: DealStage[] = [];
  submitted = false;
  isValid = false;
  pipelines: Pipeline[];
  dealStages: DealStage[];
  deleteStatus: boolean = false;
  changePipelineStatus: boolean = true;

  constructor(
    private dealsService: DealsService,
    private dialogRef: MatDialogRef<DeletePipelineComponent>,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.pipeline) {
      this.currentPipeline = this.data.pipeline;
    }

    if (this.data && this.data.stages) {
      this.stages = this.data.stages;
    }

    if (this.data && this.data.deals) {
      this.deals = this.data.deals;
    }

    this.dealsService.selectedPipeline$.subscribe((res) => {
      if (res && res != this.currentPipeline) {
        this.selectedStage = new DealStage();
      }
    });
  }

  ngOnInit(): void {
    const tempPipeArray = this.dealsService.pipelines.getValue();
    const delPipeIndex = tempPipeArray.findIndex(
      (e) => e._id == this.currentPipeline._id
    );
    tempPipeArray.splice(delPipeIndex, 1);
    this.pipelines = tempPipeArray;

    this.dealStages = [];
  }

  selectOption(type): void {
    this.currentOption = type;
  }

  isSelectedOption(type): any {
    return this.currentOption === type;
  }

  changePipeline(): void {
    this.changePipelineStatus = true;
    this.selectedStage = new DealStage();
    this.dealsService.loadStage(this.selectedPipeline).subscribe((stages) => {
      this.dealStages = stages;
      this.changePipelineStatus = false;
    });
  }

  deletePipeline(): void {
    this.dealsService
      .deletePipeLine(this.currentPipeline._id)
      .subscribe((res) => {
        if (res.status) {
          console.log('pipelinedeleteStatus', res.status);
          this.dealsService.pipelines.next(this.pipelines);
          // this.toastr.success('Pipeline has been successfully deleted.');
          if (this.currentOption === 'move-other')
            this.dealsService.selectedPipeline.next(this.selectedPipeline);
          if (this.currentOption === 'remove-all')
            this.dealsService.selectedPipeline.next(this.pipelines[0]);
        }
        this.submitted = false;
        this.dialogRef.close();
      });
  }

  delete(): void {
    this.isValid = true;
    this.submitted = true;
    this.deleteStatus = true;

    if (this.currentOption === 'move-other') {
      if (!this.selectedPipeline._id || !this.selectedStage._id) {
        this.submitted = false;
        return;
      }
      for (let i = 0; i < this.stages.length; i++) {
        if (this.stages[i].deals_count > 0)
          this.dealsService
            .deleteStage(this.stages[i]._id, this.selectedStage._id)
            .subscribe((res) => {
              if (!res && this.deleteStatus) {
                this.deleteStatus = false;
                this.toastr.error('Pipeline delete is failure.');
                this.pipelines.push(this.currentPipeline);
                this.dealsService.pipelines.next(this.pipelines);
                this.dealsService.selectedPipeline.next(this.currentPipeline);
                this.submitted = false;
                this.dialogRef.close();
              }
              if (i == this.stages.length - 1 && this.deleteStatus)
                this.deletePipeline();
            });
        else
          this.dealsService
            .deleteStage(this.stages[i]._id, null)
            .subscribe((res) => {
              if (!res && this.deleteStatus) {
                this.deleteStatus = false;
                this.toastr.error('Pipeline delete is failure.');
                this.pipelines.push(this.currentPipeline);
                this.dealsService.pipelines.next(this.pipelines);
                this.dealsService.selectedPipeline.next(this.currentPipeline);
                this.submitted = false;
                this.dialogRef.close();
              }
              if (i == this.stages.length - 1 && this.deleteStatus)
                this.deletePipeline();
            });
      }
    }

    if (this.currentOption === 'remove-all') {
      for (let i = 0; i < this.deals.length; i++) {
        this.dealsService.deleteDeal(this.deals[i]._id).subscribe((res) => {
          if (!res && this.deleteStatus) {
            this.deleteStatus = false;
            this.toastr.error('Pipeline delete is failure.');
            this.pipelines.push(this.currentPipeline);
            this.dealsService.pipelines.next(this.pipelines);
            this.dealsService.selectedPipeline.next(this.currentPipeline);
            this.submitted = false;
            this.dialogRef.close();
          }
          if (i == this.deals.length - 1 && this.deleteStatus)
            this.deletePipeline();
        });
      }
    }
  }

  cancel(): void {
    this.pipelines.push(this.currentPipeline);
    this.dealsService.pipelines.next(this.pipelines);
    this.submitted = false;
    this.dialogRef.close();
  }
}
