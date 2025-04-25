import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { STATUS } from '@constants/variable.constants';
import { AutomationService } from '@services/automation.service';
import { ContactService } from '@services/contact.service';
import { DealsService } from '@services/deals.service';
import { HandlerService } from '@services/handler.service';
import { MaterialService } from '@services/material.service';
import { StoreService } from '@services/store.service';
import { TeamService } from '@services/team.service';
import { TemplatesService } from '@services/templates.service';
import { CampaignService } from '@services/campaign.service';
import * as _ from 'lodash';
import { searchReg } from '@app/helper';
import { Pipeline } from '@models/pipeline.model';
import { StageInputComponent } from '@components/stage-input/stage-input.component';
import { DealStage } from '@models/deal-stage.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss']
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  searchSubscription: Subscription;
  automationLoadSubscription: Subscription;
  automationLibraryLoadSubscription: Subscription;
  templateLoadSubscription: Subscription;
  templateLibraryLoadSubscription: Subscription;
  teamLoadSubscription: Subscription;
  materialLoadSubscription: Subscription;
  materialLibraryLoadSubscription: Subscription;
  dealLoadSubscription: Subscription;
  dealSearchLoadSubscription: Subscription;
  pipelineLoadSubscription: Subscription;
  campaignLoadSubscription: Subscription;
  loadSubscription: Subscription[] = [];
  pipelines: Pipeline[] = [];

  loading = {
    contacts: false,
    automations: false,
    templates: false,
    teams: false,
    materials: false,
    deals: false,
    pipelines: false,
    campaigns: false
  };

  searchedResults = {
    contacts: [],
    automations: [],
    templates: [],
    teams: [],
    videos: [],
    pdfs: [],
    images: [],
    deals: [],
    stages: [],
    pipelines: [],
    campaigns: [],
    library_videos: [],
    library_pdfs: [],
    library_images: [],
    library_templates: [],
    library_automations: []
  };

  selectedMainResult = '';

  constructor(
    public handlerService: HandlerService,
    private storeService: StoreService,
    private contactService: ContactService,
    private materialService: MaterialService,
    private templateService: TemplatesService,
    private automationService: AutomationService,
    private teamService: TeamService,
    private dealsService: DealsService,
    private campaignService: CampaignService,
    private route: Router
  ) {
    this.handlerService.searchStr$.subscribe((str) => {
      if (str) {
        this.selectedMainResult = '';

        this.loading['contacts'] = true;
        this.searchSubscription && this.searchSubscription.unsubscribe();
        this.searchSubscription = this.contactService
          .easySearch({ keyword: str })
          .subscribe((contacts) => {
            this.loading['contacts'] = false;
            this.searchedResults['contacts'] = contacts;
          });

        // Load Cold Reload
        this.materialService.loadMaterial(false);
        this.materialService.loadLibrary(true);
        this.templateService.loadAll(false);
        this.templateService.loadLibrary(true);
        this.automationService.loadAll(false);
        this.automationService.loadLibrary(true);
        this.teamService.loadAll(false);
        this.dealsService.easyGetPipeLine(false);
        this.campaignService.loadAll(false);

        this.materialLoadSubscription &&
          this.materialLoadSubscription.unsubscribe();
        this.materialLoadSubscription = this.storeService.materials$.subscribe(
          (materials) => {
            this.searchedResults['videos'] = materials.filter((e) => {
              if (e.material_type === 'video' && searchReg(e.title, str)) {
                return true;
              }
            });
            this.searchedResults['pdfs'] = materials.filter((e) => {
              if (e.material_type === 'pdf' && searchReg(e.title, str)) {
                return true;
              }
            });
            this.searchedResults['images'] = materials.filter((e) => {
              if (e.material_type === 'image' && searchReg(e.title, str)) {
                return true;
              }
            });
          }
        );

        this.materialLibraryLoadSubscription &&
          this.materialLibraryLoadSubscription.unsubscribe();
        this.materialLibraryLoadSubscription =
          this.storeService.libraries$.subscribe((libraries) => {
            if (libraries && libraries?.length) {
              this.searchedResults['library_videos'] = libraries.filter((e) => {
                if (e.material_type === 'video' && searchReg(e.title, str)) {
                  return true;
                }
              });
              this.searchedResults['library_pdfs'] = libraries.filter((e) => {
                if (e.material_type === 'pdf' && searchReg(e.title, str)) {
                  return true;
                }
              });
              this.searchedResults['library_images'] = libraries.filter((e) => {
                if (e.material_type === 'image' && searchReg(e.title, str)) {
                  return true;
                }
              });
            }
          });

        this.templateLoadSubscription &&
          this.templateLoadSubscription.unsubscribe();
        this.templateLoadSubscription =
          this.templateService.templates$.subscribe((templates) => {
            this.searchedResults['templates'] = templates.filter((e) => {
              return searchReg(e.title, str);
            });
          });
        this.templateLibraryLoadSubscription &&
          this.templateLibraryLoadSubscription.unsubscribe();
        this.templateLibraryLoadSubscription =
          this.templateService.libraries$.subscribe((libraries) => {
            this.searchedResults['library_templates'] = libraries.filter(
              (e) => {
                return searchReg(e.title, str);
              }
            );
          });

        this.automationLoadSubscription &&
          this.automationLoadSubscription.unsubscribe();
        this.automationLoadSubscription =
          this.automationService.automations$.subscribe((automations) => {
            this.searchedResults['automations'] = automations.filter((e) => {
              return searchReg(e.title, str);
            });
          });

        this.automationLibraryLoadSubscription &&
          this.automationLibraryLoadSubscription.unsubscribe();
        this.automationLibraryLoadSubscription =
          this.automationService.libraries$.subscribe((libraries) => {
            this.searchedResults['library_automations'] = libraries.filter(
              (e) => {
                return searchReg(e.title, str);
              }
            );
          });

        this.teamLoadSubscription && this.teamLoadSubscription.unsubscribe();
        this.teamLoadSubscription = this.teamService.teams$.subscribe(
          (teams) => {
            this.searchedResults['teams'] = teams.filter((e) => {
              return searchReg(e.name, str);
            });
          }
        );

        if (this.dealsService.selectedPipeline.getValue()) {
          this.dealsService.easyLoadStage(
            true,
            this.dealsService.selectedPipeline.getValue()
          );
        }
        this.dealLoadSubscription && this.dealLoadSubscription.unsubscribe();
        this.dealLoadSubscription = this.dealsService.stages$.subscribe(
          (stages) => {
            this.searchedResults['stages'] = stages.filter((e) => {
              return searchReg(e.title, str);
            });
          }
        );
        this.dealSearchLoadSubscription &&
          this.dealSearchLoadSubscription.unsubscribe();
        this.dealSearchLoadSubscription = this.dealsService
          .getDealSearch(str)
          .subscribe((data) => {
            this.searchedResults['deals'] = data;
          });

        this.pipelineLoadSubscription &&
          this.pipelineLoadSubscription.unsubscribe();
        this.pipelineLoadSubscription = this.dealsService.pipelines$.subscribe(
          (pipelines) => {
            this.pipelines = pipelines;
            this.searchedResults['pipelines'] = pipelines.filter((e) => {
              return searchReg(e.title, str);
            });
          }
        );

        this.campaignLoadSubscription &&
          this.campaignLoadSubscription.unsubscribe();
        this.campaignLoadSubscription =
          this.campaignService.bulkLists$.subscribe((campaigns) => {
            this.searchedResults['campaigns'] = campaigns.filter((e) => {
              return searchReg(e.title, str);
            });
            if (
              this.searchedResults['campaigns'] &&
              this.searchedResults['campaigns'].length > 0
            ) {
              this.searchedResults['campaigns'].forEach((e) => {
                if (e.status == 'draft') {
                  return;
                }
                if (!e.contacts) {
                  e.status = 'closed';
                  return;
                }
                if (e.sent && e.sent === e.contacts) {
                  e.status = 'Completed';
                } else if (e.sent || e.failed) {
                  e.status = 'Progressing';
                } else {
                  e.status = 'Awaiting';
                }
              });
            }
          });
      } else {
        this.searchedResults['contacts'] = [];
      }
    });

    this.loadSubscription[0] = this.materialService.loading$.subscribe(
      (status) => {
        if (status === STATUS.REQUEST || status === STATUS.NONE) {
          this.loading['materials'] = true;
        } else {
          this.loading['materials'] = false;
        }
      }
    );

    this.loadSubscription[1] = this.teamService.loading$.subscribe((status) => {
      if (status === STATUS.REQUEST || status === STATUS.NONE) {
        this.loading['teams'] = true;
      } else {
        this.loading['teams'] = false;
      }
    });

    this.loadSubscription[2] = this.automationService.loading$.subscribe(
      (status) => {
        if (status === STATUS.REQUEST || status === STATUS.NONE) {
          this.loading['automations'] = true;
        } else {
          this.loading['automations'] = false;
        }
      }
    );

    this.loadSubscription[3] = this.templateService.loading$.subscribe(
      (status) => {
        if (status === STATUS.REQUEST || status === STATUS.NONE) {
          this.loading['templates'] = true;
        } else {
          this.loading['templates'] = false;
        }
      }
    );

    this.loadSubscription[4] = this.dealsService.loadingStage$.subscribe(
      (status) => {
        if (status === STATUS.REQUEST || status === STATUS.NONE) {
          this.loading['deals'] = true;
        } else {
          this.loading['deals'] = false;
        }
      }
    );

    this.loadSubscription[5] = this.dealsService.loadingPipeline$.subscribe(
      (status) => {
        if (status === STATUS.REQUEST || status === STATUS.NONE) {
          this.loading['pipelines'] = true;
        } else {
          this.loading['pipelines'] = false;
        }
      }
    );

    this.loadSubscription[6] = this.campaignService.loading$.subscribe(
      (status) => {
        if (status === STATUS.REQUEST || status === STATUS.NONE) {
          this.loading['campaigns'] = true;
        } else {
          this.loading['campaigns'] = false;
        }
      }
    );
  }

  isLoading(): boolean {
    return (
      this.loading['contacts'] ||
      this.loading['automations'] ||
      this.loading['templates'] ||
      this.loading['teams'] ||
      this.loading['materials'] ||
      this.loading['deals'] ||
      this.loading['pipelines'] ||
      this.loading['campaigns']
    );
  }

  getCount(): number {
    return (
      this.searchedResults['contacts'].length +
      this.searchedResults['automations'].length +
      this.searchedResults['templates'].length +
      this.searchedResults['teams'].length +
      this.searchedResults['videos'].length +
      this.searchedResults['images'].length +
      this.searchedResults['pdfs'].length +
      this.searchedResults['deals'].length +
      this.searchedResults['stages'].length +
      this.searchedResults['pipelines'].length +
      this.searchedResults['library_videos'].length +
      this.searchedResults['library_images'].length +
      this.searchedResults['library_pdfs'].length +
      this.searchedResults['library_automations'].length +
      this.searchedResults['library_templates'].length +
      this.searchedResults['campaigns'].length
    );
  }

  seeAll(tab: string): void {
    this.selectedMainResult = tab;
  }

  // selectPipeline(pipeline: Pipeline): void {
  //   this.dealsService.updatePipeLine(pipeline._id, { is_active: true }).subscribe();
  //   this.dealsService.selectedPipeline.next(pipeline);
  // }

  selectStage(stage: DealStage): void {
    const selPipeline = this.pipelines.filter((e) => {
      return e._id.includes(stage.pipe_line);
    });
    this.dealsService.selectedPipeline.next(selPipeline[0]);
    this.route.navigate(['/pipeline/stage/' + stage._id]);
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.searchSubscription && this.searchSubscription.unsubscribe();
    this.automationLoadSubscription &&
      this.automationLoadSubscription.unsubscribe();
    this.automationLibraryLoadSubscription &&
      this.automationLibraryLoadSubscription.unsubscribe();
    this.templateLoadSubscription &&
      this.templateLoadSubscription.unsubscribe();
    this.templateLibraryLoadSubscription &&
      this.templateLibraryLoadSubscription.unsubscribe();
    this.teamLoadSubscription && this.teamLoadSubscription.unsubscribe();
    this.materialLoadSubscription &&
      this.materialLoadSubscription.unsubscribe();
    this.materialLibraryLoadSubscription &&
      this.materialLibraryLoadSubscription.unsubscribe();
    this.dealLoadSubscription && this.dealLoadSubscription.unsubscribe();
    this.dealSearchLoadSubscription &&
      this.dealSearchLoadSubscription.unsubscribe();
    this.pipelineLoadSubscription &&
      this.pipelineLoadSubscription.unsubscribe();
    this.campaignLoadSubscription &&
      this.campaignLoadSubscription.unsubscribe();
    for (let i = 0; i < this.loadSubscription.length; i++) {
      this.loadSubscription[i] && this.loadSubscription[i].unsubscribe();
    }
  }
}
