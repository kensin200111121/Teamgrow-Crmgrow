import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { DealsService } from '@services/deals.service';
import { UserService } from '@services/user.service';
import { StoreService } from '@services/store.service';
import { DialerService } from '@app/services/dialer.service';
import { DealCreateComponent } from '@components/deal-create/deal-create.component';
import { DealTimeDurationComponent } from '@components/deal-time-duration/deal-time-duration.component';
import { DealAutomationComponent } from '@components/deal-automation/deal-automation.component';
import { TeamMaterialShareComponent } from '@components/team-material-share/team-material-share.component';
import { DealStageCreateComponent } from '@components/deal-stage-create/deal-stage-create.component';
import { DealStageUpdateComponent } from '@components/deal-stage-update/deal-stage-update.component';
import { PipelineCreateComponent } from '@components/pipeline-create/pipeline-create.component';
import { PipelineRenameComponent } from '@components/pipeline-rename/pipeline-rename.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { DeletePipelineComponent } from '@components/delete-pipeline/delete-pipeline.component';
import { DealDetailComponent } from '@app/components/deal-detail/deal-detail.component';
import { DealStage } from '@models/deal-stage.model';
import { Deal, TeamUser } from '@models/deal.model';
import { Pipeline } from '@models/pipeline.model';
import { Contact } from '@models/contact.model';
import {
  DEFAULT_PIPELINE,
  DEFAULT_STAGES,
  DialogSettings,
  STATUS
} from '@constants/variable.constants';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { PipelineType } from '@core/enums/resources.enum';
import { CheckRequestItem } from '@core/interfaces/resources.interface';
@Component({
  selector: 'app-deals',
  templateUrl: './deals.component.html',
  styleUrls: ['./deals.component.scss']
})
export class DealsComponent implements OnInit, OnDestroy, AfterViewChecked {
  readonly USER_FEATURES = USER_FEATURES;
  STATUS = STATUS;

  // loadSubscription: Subscription;
  pipelines: Pipeline[] = [];
  teamUsers = [];
  filterTeamUsers = [];
  searchTermPipeline = '';
  searchTermTeam = '';
  selectedFilterTeamUser: TeamUser[] = [
    { user_name: 'Everyone', picture_profile: null, _id: null }
  ];
  reachedLimit = true;

  _scrolled = false;
  private dropState = false;
  @ViewChild('wrapper') wrapper: ElementRef;
  @ViewChild('showDetailDrawer') showDetailDrawer: MatDrawer;
  @ViewChild('showDetailPanel') showDetailPanel: DealDetailComponent;

  private profileSubscription: Subscription;
  private selectedPipelineSubscription: Subscription;
  private routeSubscription: Subscription;
  private routeUrlSubscription: Subscription;
  private queryParamSubscription: Subscription;
  private _pipelineListSubscription: Subscription;

  hasAutomationSetting = true;
  noAutomationSetting = true;

  searchStr = '';
  searchStrConfirmed = '';
  changeSearchStr = new Subject<string>();

  userId = '';
  pipelineLimit = 0;

  selectedPipeline: Pipeline;
  selectedPipelineTitle = '';
  pipelineUserId = '';
  currentPipelineId = '';
  saving = false;
  selectedDealId = '';
  isDragging = false;
  startX = 0;
  scrollLeft = 0;

  constructor(
    protected toast: ToastrService,
    protected dialog: MatDialog,
    protected router: Router,
    protected route: ActivatedRoute,
    protected userService: UserService,
    public dealsService: DealsService,
    private storeService: StoreService,
    private dialerService: DialerService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    this.routeUrlSubscription && this.routeUrlSubscription.unsubscribe();
    this.routeUrlSubscription = this.route.url.subscribe((url) => {
      const pipelineRouteIndex = url.findIndex((e) => e.path == 'pipeline');
      this.dealsService.pageStages.next([]);
      this.routeSubscription = this.route.params.subscribe((params) => {
        if (pipelineRouteIndex !== -1 && params['id']) {
          const pipelineID = params['id'];
          this.dealsService.getPipeLineById(pipelineID).subscribe((res) => {
            if (res.status) {
              const pipeline = res.pipeline;
              this.initialPipeline(pipeline);
            }
          });
        } else {
          this.selectedPipelineSubscription &&
            this.selectedPipelineSubscription.unsubscribe();
          this.selectedPipelineSubscription =
            this.dealsService.selectedPipeline$.subscribe((res) => {
              if (res) {
                this.initialPipeline(res);
              } else {
                this.dealsService.pageStages.next([]);
                this.selectedPipelineTitle = '';
                this.pipelineUserId = '';
              }
            });
        }
      });
      this.initalDetailData();
    });
    this.userService.accounts$.subscribe((accountInfo) => {
      if (!accountInfo) {
        return;
      }
      const { accounts } = accountInfo;
      if (accounts && accounts.length) {
        this.teamUsers = [
          { user_name: 'Everyone', picture_profile: null, _id: null },
          ...accounts.map((val) => ({
            user_name: val.user_name,
            picture_profile: val.picture_profile,
            _id: val._id
          }))
        ];
      }
      this.filterTeamUsers = this.teamUsers;
    });
    this.changeSearchStr
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        this.searchStrConfirmed = value;
      });

    // if (this.dealsService.pipelines.getValue().length == 0) {
    this.dealsService.loadStageStatus.next(STATUS.REQUEST);
    this.dealsService.getPipeLine().subscribe((pipelines) => {
      if (pipelines.length == 0) {
        this.createDefaultPipeline();
      } else {
        this.dealsService.pipelines.next(pipelines);
        this.pipelines = pipelines;
        const selectedPipeline = this.dealsService.selectedPipeline.getValue();
        if (!selectedPipeline) {
          this.dealsService.selectedPipeline.next(pipelines[0]);
          this.selectedPipelineSubscription &&
            this.selectedPipelineSubscription.unsubscribe();
          this.selectedPipelineSubscription =
            this.dealsService.selectedPipeline$.subscribe((res) => {
              if (res) {
                this.initialPipeline(res);
              } else {
                this.dealsService.pageStages.next([]);
                this.selectedPipelineTitle = '';
                this.pipelineUserId = '';
              }
            });
        }
      }
      this.initDataFromQueryParams();
    });
  }

  /**
   * Crete the default pipeline for the new user
   */
  private createDefaultPipeline(): void {
    const pipeline = new Pipeline();
    pipeline.title = DEFAULT_PIPELINE;
    this.dealsService.createPipeLine(pipeline).subscribe((res) => {
      if (res.status) {
        const defaultPipelineId = res.pipeline._id;
        this.dealsService.pipelines.next([res.pipeline]);
        this.dealsService.selectedPipeline.next(res.pipeline);
        const stages = [];
        for (let i = 0; i < DEFAULT_STAGES.length; i++) {
          const data = {
            title: DEFAULT_STAGES[i],
            deals: [],
            priority: i,
            deals_count: 0,
            duration: 0,
            pipe_line: defaultPipelineId
          };
          stages.push(new DealStage().deserialize(data));
          this.dealsService
            .createStage(new DealStage().deserialize(data))
            .subscribe((res) => {
              if (res) {
              }
              if (i == DEFAULT_STAGES.length - 1) {
                this.dealsService.loadStageStatus.next(STATUS.SUCCESS);
                this.dealsService.pageStages.next(stages);
              }
            });
        }
      } else {
        this.dealsService.loadStageStatus.next(STATUS.FAILURE);
      }
    });
  }

  /**
   * Initial data from query params
   */
  private initDataFromQueryParams(): void {
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      if (params['filter']) {
        const filter = params['filter'];
        try {
          const option = JSON.parse(decodeURI(filter));
          if (option['title']) {
            this.searchStr = option['title'];
            this.changeSearchStr.next(this.searchStr);
          }
        } catch (err) {
          console.log('query parse is failed', err.message);
        }
      }
    });
  }

  private initialPipeline(pipeline: Pipeline): void {
    this.selectedPipeline = pipeline;
    this.selectedPipelineTitle = pipeline.title;
    this.pipelineUserId = pipeline.user;
    this.hasAutomationSetting = pipeline.has_automation;
    this.noAutomationSetting = pipeline.no_automation;

    this.dealsService.easyLoadPageStage(pipeline);
    this.initDataFromQueryParams();
  }

  private initalDetailData(): void {
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      this.selectedDealId = params?.deals || '';
      if (params?.deals) {
        this.showDetailDrawer?.open();
      }
    });
  }

  ngOnInit(): void {
    this._scrolled = false;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res?._id) {
        this.userId = res._id;
        const _profile = this.userService.profile.getValue();
        this.pipelineLimit = _profile['pipe_info']?.['max_count'];

        if (this._pipelineListSubscription) {
          return;
        }
        this._pipelineListSubscription = this.dealsService.pipelines$.subscribe(
          (_pipes) => {
            if (!_pipes.length) {
              this.reachedLimit = false;
            }
            const myPipes = _pipes.filter((e) => e.user === this.userId);
            if (myPipes.length >= this.pipelineLimit) {
              this.reachedLimit = true;
            } else {
              this.reachedLimit = false;
            }
          }
        );
      }
    });
  }

  ngAfterViewInit(): void {
    this.initalDetailData();
    this.cdr.detectChanges(); // Trigger change detection
  }

  ngAfterViewChecked() {
    if (this._scrolled) return;
    const posItem = this.storeService.pipelineLoadMoreStatus.getValue();
    if (posItem) {
      const myItem = posItem.find((_pos) => _pos.dealStage == 'wrapper');
      if (myItem) {
        const interval = setInterval(() => {
          if (this.wrapper) {
            clearInterval(interval);
            this.wrapper.nativeElement.scrollLeft = parseInt(myItem.pos);
          }
        }, 200);
      }
    }
    this._scrolled = true;
  }

  ngOnDestroy(): void {
    this.selectedPipelineSubscription &&
      this.selectedPipelineSubscription.unsubscribe();
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeUrlSubscription && this.routeUrlSubscription.unsubscribe();
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this._pipelineListSubscription &&
      this._pipelineListSubscription.unsubscribe();
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

  valueChangeTeam(event: string): void {
    const tempTeamArray = this.teamUsers;
    this.filterTeamUsers = tempTeamArray.filter((teamUser) => {
      return (
        teamUser.user_name.toLowerCase().includes('everyone') ||
        teamUser.user_name.toLowerCase().includes(event.toLowerCase())
      );
    });
  }

  deletePipeline(): void {
    const selPipeline = this.dealsService.selectedPipeline.getValue();
    const subStages = this.dealsService.pageStages.getValue();
    let subDeals: Deal[] = [];
    for (let i = 0; i < subStages.length; i++) {
      if (subStages[i].deals_count > 0)
        subDeals = [...subDeals, ...subStages[i].deals];
    }
    if (subDeals.length == 0) {
      const pipelineConfirmDialog = this.dialog.open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Pipeline',
          message: 'Are you sure to delete this pipeline?',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          mode: 'warning',
          pipeline: selPipeline,
          stages: subStages
        }
      });
      pipelineConfirmDialog.afterClosed().subscribe((res) => {
        if (res) {
          this.dealsService.deletePipeLine(selPipeline._id).subscribe((res) => {
            if (res.status) {
              const tempPipeArray = this.dealsService.pipelines.getValue();
              const delPipeIndex = tempPipeArray.findIndex(
                (e) => e._id == selPipeline._id
              );
              tempPipeArray.splice(delPipeIndex, 1);
              this.pipelines = tempPipeArray;
              this.dealsService.pipelines.next(tempPipeArray);
              this.dealsService.selectedPipeline.next(tempPipeArray[0]);
              this.dealsService.easyLoadPageStage(tempPipeArray[0]);
            }
          });
        }
      });
    } else {
      this.dialog
        .open(DeletePipelineComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '400px',
          data: {
            pipeline: selPipeline,
            stages: subStages,
            deals: subDeals
          }
        })
        .afterClosed()
        .subscribe(() => {
          this.dealsService.loadStageStatus.next(STATUS.REQUEST);
          this.dealsService.getPipeLine().subscribe((pipelines) => {
            if (pipelines.length == 0) {
              this.createDefaultPipeline();
            } else {
              this.dealsService.pipelines.next(pipelines);
              const selectedPipeline =
                this.dealsService.selectedPipeline.getValue();
              if (!selectedPipeline) {
                this.dealsService.selectedPipeline.next(pipelines[0]);
              }
              this.dealsService.easyLoadPageStage(selectedPipeline);
            }
            this.initDataFromQueryParams();
          });
        });
    }
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
              this.dealsService.easyGetPipeLine(true);
              this.router.navigate(['/pipeline/pipeline-manager/preference']);
            }
          });
        }
      });
  }

  onClickUpdatePipeLineName(): void {
    this.dialog
      .open(PipelineRenameComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          title: this.selectedPipelineTitle
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

  onSharePipeLine(): void {
    const selectedPipeline = this.dealsService.selectedPipeline.getValue();
    const items: CheckRequestItem[] = [selectedPipeline].map((e) => ({
      _id: e._id,
      type: PipelineType.PIPELINE
    }));
    const data = {
      pipelines: items
    };
    this.dialog
      .open(TeamMaterialShareComponent, {
        width: '98vw',
        maxWidth: '450px',
        data: {
          resources: data,
          type: 'pipeline',
          unshare: false
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.status) {
          // this.pipelineService.reload();
        }
      });
  }

  private _editPipeLine(): void {
    if (this.dropState) {
      this.dropState = false;
      const dealstageArray = this.dealsService.pageStages.getValue();
      for (let i = 0; i < dealstageArray.length; i++) {
        dealstageArray[i].priority = i;
        this.dealsService
          .updateStage(dealstageArray[i]._id, dealstageArray[i])
          .subscribe((res2) => {
            if (i == dealstageArray.length - 1) {
              if (res2) this.dealsService.loadStageStatus.next(STATUS.SUCCESS);
              else this.dealsService.loadStageStatus.next(STATUS.FAILURE);
            }
          });
      }
    } else {
      this.dealsService.loadStageStatus.next(STATUS.SUCCESS);
    }
  }

  onSelectFilterTeam(teamUser: any) {
    if (teamUser._id === null) {
      this.selectedFilterTeamUser = [
        { user_name: 'Everyone', picture_profile: null, _id: null }
      ];
    } else {
      const index = this.selectedFilterTeamUser.findIndex(
        (user) => user._id === teamUser._id
      );
      if (index === -1) {
        if (
          this.selectedFilterTeamUser.length === 1 &&
          this.selectedFilterTeamUser[0]._id === null
        ) {
          this.selectedFilterTeamUser.pop();
        }
        this.selectedFilterTeamUser = [
          ...this.selectedFilterTeamUser,
          teamUser
        ];
      } else {
        this.selectedFilterTeamUser.splice(index, 1);
        if (this.selectedFilterTeamUser.length === 0) {
          this.selectedFilterTeamUser = [
            { user_name: 'Everyone', picture_profile: null, _id: null }
          ];
        }
      }
    }
    this.searchTermTeam = '';
    this.valueChangeTeam('');
  }

  isUserSelected(teamUser: any): boolean {
    return this.selectedFilterTeamUser.some(
      (selectedUser) => selectedUser._id === teamUser._id
    );
  }

  onSelectPipeLine(pipeline: Pipeline): void {
    if (this.selectedPipeline?._id === pipeline?._id) {
      return;
    }
    this.searchStr = '';
    this.changeSearchStr.next('');
    this.dealsService.selectedPipeline.next(pipeline);
    this.hasAutomationSetting = pipeline.has_automation;
    this.noAutomationSetting = pipeline.no_automation;
    this.dealsService.pageStages.next([]);
    this.dealsService.pageStageIdArray.next([]);
    this.storeService.pipelineLoadMoreStatus.next(null);
    this.searchTermPipeline = '';
    this.valueChangePipeline('');
  }

  dropstage(event: CdkDragDrop<DealStage[]>): void {
    this.dropState = true;
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    this.dealsService.pageStages.next(event.container.data);
    this._editPipeLine();
  }

  addNewDeal(deal_stage: string): void {
    this.dialog
      .open(DealCreateComponent, {
        ...DialogSettings.DEAL,
        data: {
          deal_stage,
          pipeline: this.selectedPipeline._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const newDeal = res;
          const pageStages = this.dealsService.pageStages.getValue();
          const newPageStages = pageStages.map((stage) => {
            if (stage._id === newDeal.deal_stage) {
              stage.deals.push(newDeal);
              stage.deals_count++;
              stage.price += newDeal.price;
            }
            return stage;
          });
          this.dealsService.pageStages.next(newPageStages || []);
        }
      });
  }

  rename(dealStage: DealStage): void {
    this.dialog
      .open(DealStageUpdateComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: { stage: dealStage }
      })
      .afterClosed()
      .subscribe((res) => {});
  }

  setTimeDuration(dealStage: any): void {
    this.dialog
      .open(DealTimeDurationComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          id: dealStage._id,
          duration: dealStage.duration
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res >= 0) {
          const stageArray = this.dealsService.pageStages.getValue();
          if (dealStage._id) {
            stageArray.find((obj) => obj._id == dealStage._id).duration = res;
            this.dealsService.pageStages.next(stageArray);
          } else {
            if (stageArray.length > dealStage.priority) {
              stageArray[dealStage.priority].duration = res;
              this.dealsService.pageStages.next(stageArray);
            }
          }
        }
      });
  }

  assignAutomation(dealStage: any): void {
    this.dialog
      .open(DealAutomationComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          dealStage: dealStage
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res !== 'confirm-no') {
          const dealstages = this.dealsService.pageStages.getValue();
          const selectedStage = dealstages.find((e) => e._id == dealStage._id);
          if (res !== 'detach') {
            for (let i = 0; i < selectedStage.deals.length; i++) {
              // dealstages.find((e) => e._id == dealStage._id).deals[i].running_automation = true;
              const tempDeal = {
                ...selectedStage.deals[i],
                running_automation: true
              };
              dealstages
                .find((e) => e._id == dealStage._id)
                .deals.splice(i, 1, new Deal().deserialize(tempDeal));
            }
            selectedStage['automation'] = res;
          } else {
            for (let i = 0; i < selectedStage.deals.length; i++) {
              const tempDeal = dealstages.find((e) => e._id == dealStage._id)
                .deals[i];
              if (tempDeal['running_automation']) {
                delete tempDeal['running_automation'];
              }
              dealstages
                .find((e) => e._id == dealStage._id)
                .deals.splice(i, 1, new Deal().deserialize(tempDeal));
            }
            delete selectedStage['automation'];
          }
          this.dealsService.pageStages.next(dealstages);
        }
      });
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr.next('');
  }

  openCall(dealStage: DealStage): void {
    // Get all deals of dealStage
    this.dealsService.getContactsByStage(dealStage._id).subscribe((res) => {
      const { dealStages, contacts } = res.data;
      if (contacts?.length) {
        const _contacts = [];
        for (let i = 0; i < contacts.length; i++) {
          const contactObj = new Contact().deserialize(contacts[i]);
          const dealContact = {
            contactId: contactObj._id,
            numbers: [contactObj.cell_phone],
            name: contactObj.fullName
          };
          _contacts.push(dealContact);
        }
        this.dialerService.makeCalls(_contacts, '', dealStages);
      } else {
        this.toast.error('', `There is no assigned contact.`);
        return;
      }
    });
  }

  closeShowDetail(): void {
    this.router.navigate(['/pipeline'], { queryParams: {} });
    this.showDetailDrawer.close();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll($event): void {
    const scrollX = $event.target.scrollLeft;
    const loadMoreStatus = [{ dealStage: 'wrapper', pos: scrollX }];
    this.storeService.pipelineLoadMoreStatus.next(loadMoreStatus);
  }

  onViewMouseDown(event: MouseEvent): void {
    const container = document.getElementById('viewport');
    this.isDragging = true;
    this.startX = event.pageX - container.offsetLeft;
    this.scrollLeft = container.scrollLeft;

    // Prevent text selection while dragging
    event.preventDefault();
  }

  onViewMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const container = document.getElementById('viewport');
    const x = event.pageX - container.offsetLeft;
    const walk = (x - this.startX) * 2; // Multiplier for faster/slower scroll
    container.scrollLeft = this.scrollLeft - walk;
  }

  onViewMouseUp(): void {
    this.isDragging = false;
  }
}
