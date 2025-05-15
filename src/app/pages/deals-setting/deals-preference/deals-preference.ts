import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DealStageCreateComponent } from '@app/components/deal-stage-create/deal-stage-create.component';
import { DealStageDeleteComponent } from '@app/components/deal-stage-delete/deal-stage-delete.component';
import { NotifyComponent } from '@app/components/notify/notify.component';
import { PipelineCreateComponent } from '@app/components/pipeline-create/pipeline-create.component';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { STATUS, DialogSettings } from '@app/constants/variable.constants';
import { Automation } from '@app/models/automation.model';
import { DealStage } from '@app/models/deal-stage.model';
import { Pipeline } from '@app/models/pipeline.model';
import { UserService } from '@app/services/user.service';
import { DealsService } from '@services/deals.service';
import { Subscription } from 'rxjs';
import { PipelineRenameComponent } from '@app/components/pipeline-rename/pipeline-rename.component';
import { ToastrService } from 'ngx-toastr';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { Account } from '@app/models/user.model';

@Component({
  selector: 'app-deals-preference',
  templateUrl: './deals-preference.html',
  styleUrls: ['./deals-preference.scss']
})
export class DealsPreferenceComponent implements OnInit {
  readonly USER_FEATURES = USER_FEATURES;
  private pipelineId: string;
  private userId: string;

  stages: any[] = [];
  curPipeline: Pipeline;
  changeOrderSubscription: Subscription;
  updateSubscription: Subscription;
  originalStageDuration = 0;
  STATUS = STATUS;
  stageSubscription: Subscription;
  selectedPipelineSubscription: Subscription;
  private profileSubscription: Subscription;
  private pipelinesSubscription: Subscription;
  hasAutomationSetting = true;
  noAutomationSetting = true;
  pipelineLimit = 0;

  pipelines: Pipeline[] = [];
  searchTermPipeline = '';
  reachedLimit = true;
  accounts: Account[] = [];

  constructor(
    private dialog: MatDialog,
    public dealsService: DealsService,
    protected userService: UserService,
    private toastr: ToastrService
  ) {
    this.stageSubscription && this.stageSubscription.unsubscribe();
    this.stageSubscription = this.dealsService.stages$.subscribe((res) => {
      this.stages = res;
    });
    this.selectedPipelineSubscription &&
      this.selectedPipelineSubscription.unsubscribe();
    this.selectedPipelineSubscription =
      this.dealsService.selectedPipeline$.subscribe((res) => {
        if (res && res._id !== this.pipelineId) {
          this.curPipeline = res;
          this.pipelineId = res._id;
          this.dealsService.easyLoadStage(true, res);
          this.hasAutomationSetting = res.has_automation;
          this.noAutomationSetting = res.no_automation;
        } else {
          this.dealsService.loadStageStatus.next(STATUS.SUCCESS);
        }
      });
  }

  ngOnInit(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res?._id) {
        const _profile = this.userService.profile.getValue();
        this.pipelineLimit = _profile['pipe_info']?.['max_count'];
        this.userId = res?._id;

        this.pipelinesSubscription?.unsubscribe();
        this.pipelinesSubscription = this.dealsService.pipelines$.subscribe(
          (_pipelines) => {
            this.pipelines = _pipelines;

            if (!_pipelines.length) {
              this.reachedLimit = false;
            }
            const myPipes = _pipelines.filter((e) => e.user === this.userId);
            if (myPipes.length >= this.pipelineLimit) {
              this.reachedLimit = true;
            } else {
              this.reachedLimit = false;
            }
          }
        );
      }
    });
    this.userService.accounts$.subscribe((accountInfo) => {
      this.accounts = accountInfo?.accounts ?? [];
    });
  }

  ngOnDestroy(): void {
    this.stageSubscription?.unsubscribe();
    this.selectedPipelineSubscription?.unsubscribe();
    this.profileSubscription?.unsubscribe();
    this.pipelinesSubscription?.unsubscribe();
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    const stageOrder = {};
    this.stages.forEach((e, index) => {
      stageOrder[e._id] = index;
    });
    this.changeOrderSubscription && this.changeOrderSubscription.unsubscribe();
    this.changeOrderSubscription = this.dealsService
      .changeStageOrder(stageOrder)
      .subscribe((res) => {
        const stageArray = Object.entries(stageOrder);
        stageArray.sort((a, b) => (a[1] > b[1] ? 1 : -1));
        const pageStages = this.dealsService.pageStages.getValue();
        const newPageStages = [];
        stageArray.forEach((s) => {
          pageStages.forEach((p) => {
            if (p._id === s[0]) {
              newPageStages.push(p);
            }
          });
        });
        this.dealsService.pageStages.next(newPageStages);
      });
  }

  moveDelete(id: string): void {
    const idx = this.stages.findIndex((item) => item._id === id);
    if (idx >= 0) {
      if (
        (this.stages[idx].deals && this.stages[idx].deals.length > 0) ||
        this.stages[idx].deals_count > 0
      ) {
        if (this.stages.length > 1) {
          // move deals and delete stage
          this.dialog
            .open(DealStageDeleteComponent, {
              position: { top: '100px' },
              width: '100vw',
              maxWidth: '550px',
              disableClose: true,
              data: {
                deleteId: id
              }
            })
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                const deleted = this.stages.filter((stage) => stage._id == id);
                this.stages.forEach((stage) => {
                  if (stage._id == res) {
                    stage.deals = [...stage.deals, ...deleted[0].deals];
                    stage.deals_count += this.stages[idx].deals_count;
                  }
                });
                this.stages.some((e, index) => {
                  if (e._id === id) {
                    this.stages.splice(index, 1);
                  }
                });
                this.dealsService.pageStages.next(this.stages);
              }
            });
        } else {
          this.dialog.open(NotifyComponent, {
            data: {
              message:
                'You can not remove this deal stage as this stage is the last stage.'
            }
          });
        }
      } else {
        this.dialog
          .open(ConfirmComponent, {
            ...DialogSettings.CONFIRM,
            data: {
              title: 'Delete stage',
              message: 'Are you sure you want to delete this stage?',
              confirmLabel: 'Yes',
              cancelLabel: 'No',
              mode: 'warning'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.dealsService.deleteStage(id, null).subscribe((res) => {
                if (res) {
                  this.toastr.success('Deal Stage successfully deleted.');
                  this.stages.splice(idx, 1);
                  this.dealsService.pageStages.next(this.stages);
                }
              });
            }
          });
      }
    }
  }

  addStage(): void {
    this.dialog
      .open(DealStageCreateComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          priority: this.stages.length
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.toastr.success('Deal Stage successfully created.');
          this.dealsService.createStage$(new DealStage().deserialize(res));
        }
      });
  }

  saveDuration(stage: DealStage): void {
    this.updateSubscription && this.updateSubscription.unsubscribe();
    const request = {
      duration: stage.duration
    };
    this.updateSubscription = this.dealsService
      .updateStage(stage._id, request)
      .subscribe((res) => {
        if (res) {
          this.originalStageDuration = stage.duration;
          // this.toastr.success('', 'Deal Stage is updated successfully.', {
          //   closeButton: true
          // });
        }
      });
  }

  saveStage(stage): void {
    this.saveDuration(stage);
  }

  checkAndSave(event, stage): void {
    if (event.keyCode === 13) {
      this.saveDuration(stage);
    }
  }

  selectAutomation(evt: Automation, stage: DealStage): void {
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.dealsService
      .updateStage(stage._id, {
        automation: evt
      })
      .subscribe((res) => {
        if (res) {
          // this.toastr.success('', 'Automation was assigned successfully.', {
          //   closeButton: true
          // });
          const stages = this.dealsService.stages.getValue();
          stages.find((obj) => obj._id == stage._id).automation = evt;
          this.dealsService.stages.next(stages);
          // this.dealsService.updatePageStages(stage._id, { automation: evt });
        } else {
          // this.toastr.error('', 'Automation assign is failure.', {
          //   closeButton: true
          // });
        }
      });
  }

  onSelectPipeLine(pipeline: Pipeline): void {
    this.curPipeline = pipeline;
    this.hasAutomationSetting = pipeline.has_automation;
    this.noAutomationSetting = pipeline.no_automation;
    this.dealsService.selectedPipeline.next(pipeline);
    this.dealsService.pageStages.next([]);
    this.dealsService.pageStageIdArray.next([]);
    this.dealsService.easyLoadPageStage(pipeline);
    this.searchTermPipeline = '';
    this.valueChangePipeline('');
  }

  selectHasOption(option): void {
    this.hasAutomationSetting = option;
    const pipeline = this.dealsService.selectedPipeline.getValue();
    pipeline.has_automation = option;
    this.dealsService.selectedPipeline.next(pipeline);
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.dealsService
      .updatePipeLine(pipeline._id, { has_automation: option })
      .subscribe();
  }

  isSelectedHasOption(option): boolean {
    return this.hasAutomationSetting === option;
  }

  selectNoOption(option): void {
    this.noAutomationSetting = option;
    const pipeline = this.dealsService.selectedPipeline.getValue();
    pipeline.no_automation = option;
    this.dealsService.selectedPipeline.next(pipeline);
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.dealsService
      .updatePipeLine(pipeline._id, { no_automation: option })
      .subscribe();
  }

  isSelectedNoOption(option): boolean {
    return this.noAutomationSetting === option;
  }

  onClickCreatePipeLine(): void {
    this.dialog
      .open(PipelineCreateComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const pipeline = new Pipeline();
          pipeline.title = res.title;
          this.dealsService.createPipeLine(pipeline).subscribe((res1) => {
            if (res1?.status) {
              const pipelineArray = this.dealsService.pipelines.getValue();
              pipelineArray.push(res1.pipeline);
              this.dealsService.selectedPipeline.next(res1.pipeline);
              this.dealsService.pipelines.next(pipelineArray);
              this.dealsService.pageStages.next([]);
            }
          });
        }
      });
  }
  onRenamePipeLineName(): void {
    this.dialog
      .open(PipelineRenameComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          pipeline: this.curPipeline
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const pipeId = this.dealsService.selectedPipeline.getValue()._id;
          const pipearray = this.dealsService.pipelines.getValue();
          pipearray.find((e) => e._id == pipeId).title = res.title;
          this.dealsService.pipelines.next(pipearray);

          const pipeline = this.dealsService.selectedPipeline.getValue();
          pipeline.title = res.title;
          this.dealsService.selectedPipeline.next(pipeline);
        }
      });
  }

  valueChangePipeline(event: string): void {
    const tempPipeArray = this.dealsService.pipelines.getValue();
    this.pipelines = tempPipeArray.filter((pipeline) => {
      return (
        pipeline.title.toLowerCase().includes(event.toLowerCase()) ||
        pipeline.user_name.toLowerCase().includes(event.toLowerCase())
      );
    });
  }
}
