import { Component, EventEmitter, Input, OnInit, Output, ViewChildren, QueryList } from '@angular/core';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { DealStage } from '@app/models/deal-stage.model';
import { PipelineWithStages } from '@app/models/pipeline.model';
import { DealsService } from '@app/services/deals.service';
import { UserService } from '@services/user.service';
import { Account } from '@app/models/user.model';

@Component({
  selector: 'app-select-stage',
  templateUrl: './select-stage.component.html',
  styleUrls: ['./select-stage.component.scss']
})
export class SelectStageComponent implements OnInit {
  @ViewChildren(NgbDropdown) dropdowns: QueryList<NgbDropdown>;

  @Input() set stage(val) {
    if (val != this.selectedStage) {
      this.selectedStage = val;
      if (val != '' && this.pipelines.length > 0) {
        const pipeline = this.pipelines.find((pipeline) =>
          pipeline.stages.some((stage) => stage._id == val)
        );
        if (pipeline && this.selectedPipeline != pipeline._id) {
          this.selectedPipeline = pipeline._id;
          this.onChangePipeline(pipeline);
        }
      }
    }
  }

  @Input() set pipeline(val) {
    if (val != this.selectedPipeline) {
      this.selectedPipeline = val;
      this.onChangePipeline(val);
    }
  }

  @Output() onChange = new EventEmitter();
  @Output() onPipelineChange = new EventEmitter();
  @Output() onChangeStage: EventEmitter<DealStage> = new EventEmitter();
  @Input('viewMode') viewMode;
  @Input('isHidePipelineSelector') isHidePipelineSelector = false;
  @Input('isHideLabel') isHideLabel = false;
  @Input() pipelineTitle = 'pipeline';
  @Input() stageTitle = 'stage';
  @Input('isSetDefault') isSetDefault = true;
  @Input('showReset') showReset = false;
  @Input('required') required = false;
  @Input('submitted') submitted = false;
  private pipelines: PipelineWithStages[] = [];
  selectedPipeline: string;
  selectedStage: string;
  stages: any[] = [];
  searchTermPipeline = '';
  selectedPipelineWithStages: PipelineWithStages;
  accounts: Account[] = [];
  constructor(
    public dealsService: DealsService,
    protected userService: UserService
  ) {}

  ngOnInit(): void {
    this.initializePipelines();
    this.userService.accounts$.subscribe((accountInfo) => {
      this.accounts = accountInfo?.accounts ?? [];
    });
  }
  private initializePipelines(): void {
    this.dealsService.pipelineStages$.subscribe((res) => {
      this.pipelines = res;
      if (!!this.selectedStage && !this.selectedPipeline) {
        const pipeline = this.pipelines.find((pipeline) =>
          pipeline.stages.some((stage) => stage._id == this.selectedStage)
        );
        if (pipeline && this.selectedPipeline != pipeline._id) {
          this.selectedPipeline = pipeline._id;
          this.onChangePipeline(pipeline);
        }
      } else {
        this.selectedPipelineWithStages = !this.selectedPipeline
          ? this.pipelines[0]
          : this.pipelines.find((e) => e._id == this.selectedPipeline);
        this.stages = this.selectedPipelineWithStages?.stages;
        if (this.isSetDefault) {
          if (!this.selectedPipeline) {
            this.selectedPipeline = this.pipelines[0]?._id;
          }
          this.selectedStage = this.stages[0]?._id;
          this.onChange.emit(this.selectedStage);
        }
      }
    });
  }

  onValueChange(value: string) {
    this.selectedStage = value;
    const selectStage = this.stages.find((it) => it._id == value);
    this.onChange.emit(value);
    if (this.onChangeStage) this.onChangeStage.emit(selectStage);
  }

  onChangePipeline(evt: any): void {
    const pipeline = this.pipelines.find((e) => e._id == evt._id);
    if (pipeline) {
      this.selectedPipelineWithStages = pipeline;
      this.stages = pipeline.stages;
      if (!!this.selectedStage) {
        const selectStage = this.stages.find(
          (it) => it._id == this.selectedStage
        );
        this.onChangeStage.emit(selectStage);
      } else {
        if (this.isSetDefault) {
          this.selectedStage = this.stages[0]?._id;
          this.onChange.emit(this.selectedStage);
        }
      }
      this.onPipelineChange.emit(evt._id);
      this.searchTermPipeline = '';
      this.valueChangePipeline('');
    }
  }
  removeStage() {
    this.selectedStage = '';
    this.onChange.emit(this.selectedStage);
  }
  valueChangePipeline(event: string): void {
    const tempPipeArray = this.dealsService.pipelineStages.getValue();
    this.pipelines = tempPipeArray.filter((pipeline) => {
      return (
        pipeline.detail.title.toLowerCase().includes(event.toLowerCase()) ||
        pipeline.detail.user_name.toLowerCase().includes(event.toLowerCase())
      );
    });
  }

  closePopups(): void {
    this.dropdowns.forEach((dropdown) => {
      if (dropdown.isOpen()) {
        dropdown.close();
      }
    });
  }
}
