import { Component, Input, OnInit } from '@angular/core';
import { TRIGGER_TYPES } from '@app/constants/variable.constants';
import { DealsService } from '@app/services/deals.service';
import { LabelService } from '@app/services/label.service';
import { StoreService } from '@app/services/store.service';
import { OverlayService } from '@app/services/overlay.service';
import { LeadFormService } from '@app/services/lead-form.service';

@Component({
  selector: 'app-automation-trigger-overlay',
  templateUrl: './automation-trigger-overlay.component.html',
  styleUrls: ['./automation-trigger-overlay.component.scss']
})
export class AutomationTriggerOverlayComponent implements OnInit {
  TRIGGER_TYPES = TRIGGER_TYPES;
  _trigger: any = null;
  @Input('trigger')
  set trigger(value) {
    this.setTriggerInfo(value);
  }
  get trigger() {
    return this._trigger;
  }
  pipelines = [];
  statuses = [];
  materials = [];
  leadForms = [];

  readonly OPERATOR_DESC = {
    '=': 'is equal to',
    '>=': 'is bigger than',
    '<=': 'is less than',
    include: 'should include'
  };

  get formConditions(): string {
    if (
      this._trigger?.type === TRIGGER_TYPES.CONTACT_FORM_COMPLETE &&
      this._trigger?.detail?.form &&
      this._trigger?.detail?.conditions?.length
    ) {
      const ruleTexts = [];
      for (const rule of this._trigger?.detail?.conditions) {
        const conditionTexts = [];
        for (const condition of rule) {
          if (!condition.operator || !condition.value || !condition.field) {
            // handle invalid
          }
          const conditionText = `"${condition.field}" ${
            this.OPERATOR_DESC[condition.operator]
          } "${condition.value}"`;
          conditionTexts.push(conditionText);
        }
        ruleTexts.push(conditionTexts.join(' and '));
      }
      return ruleTexts.join(' OR ');
    }
    return '';
  }

  constructor(
    public overlayService: OverlayService,
    public dealService: DealsService,
    public labelService: LabelService,
    public storeService: StoreService,
    public leadFormService: LeadFormService
  ) {}

  ngOnInit(): void {
    this._initData();
  }

  private _initData(): void {
    this.dealService.pipelineStages$.subscribe((pipelines) => {
      this.pipelines = [...pipelines];
      if (
        this.trigger?.type === TRIGGER_TYPES.DEAL_STAGE_CHANGE &&
        !!this.trigger?.detail?.stage
      ) {
        const pipeline = pipelines.find((pipeline) =>
          pipeline.stages.some(
            (stage) => stage._id == this.trigger?.detail?.stage
          )
        );
        const stage = (pipeline?.stages || []).find(
          (e) => e._id === this.trigger?.detail?.stage
        );
        this._trigger.detail.pipeline = pipeline;
        this._trigger.detail.stage = stage;
      }
    });
    this.storeService.materials$.subscribe((materials) => {
      this.materials = [...materials];
      if (
        this.trigger?.type === TRIGGER_TYPES.CONTACT_VIEWS_MEDIA &&
        !!this.trigger?.detail?.id
      ) {
        const material = materials.find(
          (e) => e._id === this.trigger?.detail?.id
        );
        this._trigger.detail.file = material?.title;
      }
    });
    this.leadFormService.formList$.subscribe((forms) => {
      this.leadForms = [...forms];
      if (
        this.trigger?.type === TRIGGER_TYPES.CONTACT_FORM_COMPLETE &&
        !!this.trigger?.detail?.form_id
      ) {
        const form = forms.find(
          (form) => form._id == this.trigger?.detail?.form_id
        );
        this._trigger.detail.form = form;
      }
    });
  }

  setTriggerInfo(trigger) {
    switch (trigger?.type) {
      case TRIGGER_TYPES.DEAL_STAGE_CHANGE:
        const pipeline = this.pipelines.find((pipeline) =>
          pipeline.stages.some((stage) => stage._id == trigger?.detail?.stage)
        );
        const stage = (pipeline?.stages || []).find(
          (e) => e._id === trigger?.detail?.stage
        );
        if (pipeline && stage) {
          this._trigger = {
            ...trigger,
            detail: {
              pipeline,
              stage
            }
          };
        } else {
          this._trigger = { ...trigger };
        }
        break;
      case TRIGGER_TYPES.CONTACT_TAG_ADDED:
      case TRIGGER_TYPES.CONTACT_STATUS_CHANGED:
        this._trigger = { ...trigger };
        break;
      case TRIGGER_TYPES.CONTACT_FORM_COMPLETE:
        this._trigger = { ...trigger };
        if (!!this.trigger?.detail?.form_id) {
          const form = this.leadForms.find(
            (form) => form._id == this.trigger?.detail?.form_id
          );
          this._trigger.form = form;
        }
        break;
      case TRIGGER_TYPES.CONTACT_VIEWS_MEDIA:
        const material = this.materials.find(
          (e) => e._id === trigger?.detail?.id
        );
        this._trigger = {
          ...trigger,
          detail: {
            ...trigger?.detail,
            file: material?.title || ''
          }
        };
        break;
      default:
        break;
    }
  }

  update() {
    this.overlayService.close({ type: 'edit' });
  }
  remove() {
    this.overlayService.close({ type: 'remove' });
  }
}
