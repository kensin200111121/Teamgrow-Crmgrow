import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  TRIGGER_ICONS,
  TRIGGER_TYPES
} from '@app/constants/variable.constants';
import { ITrigger } from '@app/types/trigger';

@Component({
  selector: 'app-start-trigger',
  templateUrl: './start-trigger.component.html',
  styleUrls: ['./start-trigger.component.scss']
})
export class StartTriggerComponent implements OnInit {
  submitted = false; // SUBMITTING FALSE
  readonly TRIGGER_TYPES = TRIGGER_TYPES;
  DisplayTriggers = [
    {
      type: TRIGGER_TYPES.DEAL_STAGE_CHANGE,
      title: TRIGGER_TYPES.DEAL_STAGE_CHANGE,
      description: `${TRIGGER_TYPES.DEAL_STAGE_CHANGE}_description`,
      icon: TRIGGER_ICONS.DEAL_STAGE_CHANGE
    },
    {
      type: TRIGGER_TYPES.CONTACT_TAG_ADDED,
      title: TRIGGER_TYPES.CONTACT_TAG_ADDED,
      description: `${TRIGGER_TYPES.CONTACT_TAG_ADDED}_description`,
      icon: TRIGGER_ICONS.CONTACT_TAG_ADDED
    },
    {
      type: TRIGGER_TYPES.CONTACT_STATUS_CHANGED,
      title: TRIGGER_TYPES.CONTACT_STATUS_CHANGED,
      description: `${TRIGGER_TYPES.CONTACT_STATUS_CHANGED}_description`,
      icon: TRIGGER_ICONS.CONTACT_STATUS_CHANGED
    },
    {
      type: TRIGGER_TYPES.CONTACT_FORM_COMPLETE,
      title: TRIGGER_TYPES.CONTACT_FORM_COMPLETE,
      description: `${TRIGGER_TYPES.CONTACT_FORM_COMPLETE}_description`,
      icon: TRIGGER_ICONS.CONTACT_FORM_COMPLETE
    },
    {
      type: TRIGGER_TYPES.CONTACT_VIEWS_MEDIA,
      title: TRIGGER_TYPES.CONTACT_VIEWS_MEDIA,
      description: `${TRIGGER_TYPES.CONTACT_VIEWS_MEDIA}_description`,
      icon: TRIGGER_ICONS.CONTACT_VIEWS_MEDIA
    }
  ];
  selectedTrigger: any = null;
  initTrigger = null;
  private _automationTrigger: ITrigger | null = null;
  @Input('automationTrigger')
  set automationTrigger(value: ITrigger) {
    this.initTrigger = value;
    this._initData();
  }
  get automationTrigger() {
    return this._automationTrigger;
  }

  @Output() onClose = new EventEmitter<ITrigger | undefined>();
  constructor() {}

  ngOnInit(): void {}

  private _initData() {
    if (this.initTrigger) {
      this._automationTrigger = { ...this.initTrigger };
      this.selectedTrigger = this.DisplayTriggers.find(
        (item) => item.type === this.initTrigger?.type
      );
    } else {
      this.selectedTrigger = null;
      this._automationTrigger = {
        type: null,
        detail: null
      };
    }
  }

  closeDrawer(): void {
    this._initData();
    this.onClose.emit(null);
  }

  fillContent(trigger: string, e): void {
    e?.preventDefault();
    e?.stopPropagation();
    this.selectedTrigger = trigger;
  }

  backTrigger(e): void {
    e?.preventDefault();
    e?.stopPropagation();
    this.selectedTrigger = null;
  }

  decideTrigger() {
    this.submitted = true;
    const type = this.selectedTrigger.type;
    switch (type) {
      case TRIGGER_TYPES.DEAL_STAGE_CHANGE:
        if (
          !this._automationTrigger?.detail?.pipeline ||
          !this._automationTrigger?.detail?.stage
        ) {
          return false;
        }
        break;
      case TRIGGER_TYPES.CONTACT_TAG_ADDED:
        if (
          !this._automationTrigger?.detail?.tags ||
          !this._automationTrigger?.detail?.tags.length
        ) {
          return false;
        }
        break;
      case TRIGGER_TYPES.CONTACT_STATUS_CHANGED:
        if (!this._automationTrigger?.detail?.status) {
          return false;
        }
        break;
      case TRIGGER_TYPES.CONTACT_FORM_COMPLETE:
        if (!this._automationTrigger?.detail?.form_id) {
          return false;
        }
        break;
      case TRIGGER_TYPES.CONTACT_VIEWS_MEDIA:
        if (!this._automationTrigger?.detail?.id) {
          return false;
        }
        break;
      default:
        return false;
    }
    this._automationTrigger.type = type;
    this.onClose.emit(this._automationTrigger);
  }

  selectTags(val): void {
    this._automationTrigger.detail = {
      tags: val || []
    };
  }

  selectStatus(val): void {
    this._automationTrigger.detail = {
      status: val || ''
    };
  }
  onChangePipeline(event) {
    this._automationTrigger.detail = {
      pipeline: event || '',
      stage: ''
    };
  }
  onChangeStage(event) {
    this._automationTrigger.detail = {
      pipeline: this._automationTrigger.detail?.pipeline,
      stage: event || ''
    };
  }

  onChangedMaterialTrigger(trigger): void {
    this._automationTrigger = trigger;
  }
}
