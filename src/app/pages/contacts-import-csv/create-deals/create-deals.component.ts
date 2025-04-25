import { SspaService } from '../../../services/sspa.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Contact2I } from '@models/contact.model';
import { Pipeline } from '@models/pipeline.model';
import { DealsService } from '@services/deals.service';
import { contactHeaderOrder, formatValue } from '@utils/contact';
import { contactTablePropertiseMap } from '@utils/data';

@Component({
  selector: 'app-create-deals',
  templateUrl: './create-deals.component.html',
  styleUrls: ['./create-deals.component.scss']
})
export class CreateDealsComponent implements OnInit {
  @Input() deals: any[] = [];
  @Input() pcMatching = {};
  @Output() onNext = new EventEmitter();
  @Output() onPrev = new EventEmitter();

  pipelines: Pipeline[] = [];
  pipeline: string;
  stages: any[] = [];
  hasMoreThanTenContacts: any[] = [];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;
  properties = contactTablePropertiseMap;

  isSaving = false;
  loadingStage = false;
  contactHeaderOrder = contactHeaderOrder;
  formatValue = formatValue;

  pipelineSubscription: Subscription;
  stageSubscription: Subscription;

  constructor(
    private dealService: DealsService,
    private toastr: ToastrService,
    public sspaService: SspaService
  ) {
    this.pipelineSubscription && this.pipelineSubscription.unsubscribe();
    this.pipelineSubscription = this.dealService.pipelines$.subscribe((res) => {
      this.pipelines = res.map((e) => e);
      const selectedPipeline = this.dealService.selectedPipeline.getValue();
      this.pipeline = selectedPipeline
        ? selectedPipeline._id
        : this.pipelines[0]._id;
    });
    this.dealService.stages$.subscribe((res) => {
      this.stages = res.map((e) => e);
    });
  }

  ngOnInit(): void {
    if (this.deals.length === 0) this.onPrev.emit();
    this.hasMoreThanTenContacts = this.deals.filter(
      (deal) => deal.contacts && deal.contacts.length > 10
    );
  }

  ngOnDestroy(): void {
    this.pipelineSubscription && this.pipelineSubscription.unsubscribe();
    this.stageSubscription && this.stageSubscription.unsubscribe();
  }

  onChangePipeline(value: string): void {
    this.pipeline = value;
    const pipeline = this.pipelines.find((e) => e._id === value);
    this.loadingStage = true;
    this.stageSubscription && this.stageSubscription.unsubscribe();
    this.stageSubscription = this.dealService
      .loadStage(pipeline)
      .subscribe((res) => {
        this.loadingStage = false;
        this.stages = res.map((e) => e);
        if (this.stages.length > 0) {
          this.onResetDealStages();
        } else {
          this.toastr.error('There is no stages in the selected pipeline');
        }
      });
  }

  getDealId(dIndex: number): string {
    return (this.page - 1) * this.pageSize.id + dIndex + '';
  }

  onResetDealStages(): void {
    this.deals.forEach((deal) => {
      deal.deal_stage = this.stages[0]._id;
    });
  }

  onChangePage(page: number): void {
    this.page = page;
  }

  onChangePageSize(type: any): void {
    if (this.pageSize.id === type.id) return;
    this.pageSize = type;
  }

  setPrimary(deal: any, contact: Contact2I): void {
    deal.primary_contact = contact;
  }

  removeContactFromDeal(
    contact: Contact2I,
    deal: any,
    dIndex: number,
    cIndex: number
  ): void {
    const gIndex = (this.page - 1) * this.pageSize.id + dIndex;
    if (deal.contacts.length === 1) {
      this.deals.splice(gIndex, 1);
    } else {
      deal.contacts.splice(cIndex, 1);
      if (deal.primary_contact && deal.primary_contact.id === contact.id) {
        deal.primary_contact = deal.contacts[0];
      }
      this.deals[gIndex] = deal;
    }
    this.hasMoreThanTenContacts = this.deals.filter(
      (deal) => deal.contacts && deal.contacts.length > 10
    );
  }

  onContinue(): void {
    if (this.loadingStage) return;

    if (this.hasMoreThanTenContacts.length > 0) {
      this.hasMoreThanTenContacts.forEach((deal) => {
        this.toastr.error(`${deal.title} have more than 10 contacts`);
      });
    } else {
      this.onNext.emit({ deals: this.deals, stages: this.stages });
    }
  }

  moveScrollById(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }

  onBack(): void {
    if (this.loadingStage) return;
    this.onPrev.emit();
  }
}
