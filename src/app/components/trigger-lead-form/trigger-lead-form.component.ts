import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FIELDS_OPERATES } from '@utils/data';
import { LeadFormService } from '@app/services/lead-form.service';
import { LeadForm } from '@app/models/lead-form.model';
import { Subscription } from 'rxjs';
import { STATUS } from '@app/constants/variable.constants';

@Component({
  selector: 'app-trigger-lead-form',
  templateUrl: './trigger-lead-form.component.html',
  styleUrls: ['./trigger-lead-form.component.scss']
})
export class TriggerLeadFormComponent implements OnInit {
  STATUS = STATUS;
  selectedForms = [];
  leadFormConditions = [];
  leadForms: LeadForm[];
  leadForm: LeadForm;
  leadFormsSubscription: Subscription;
  operateList = FIELDS_OPERATES;
  _automationTrigger: any;
  @Input('automationTrigger')
  set automationTrigger(value) {
    this._automationTrigger = value;
    if (this.leadForms?.length) {
      this.onInitValue();
    }
  }
  @Output() onChanged = new EventEmitter();
  formId = '';

  constructor(public leadFormService: LeadFormService) {
    this.leadFormService.load();
  }
  private onInitValue(): void {
    const formId = this._automationTrigger?.detail?.form_id || '';
    const selectForm = this.leadForms.find((it) => it._id == formId);
    if (!this.leadForm) {
      this.leadForm = selectForm;
      this.leadFormConditions =
        this._automationTrigger?.detail?.conditions || [];
      if (this.formId != formId) this.formId = formId;
    }
  }
  ngOnInit(): void {
    this.leadFormsSubscription && this.leadFormsSubscription.unsubscribe();
    this.leadFormsSubscription = this.leadFormService.forms$.subscribe(
      (res) => {
        this.leadForms = res;
        if (this.leadForms?.length) {
          this.onInitValue();
        }
      }
    );
  }

  onSelectForm(formId: string): void {
    const index = this.leadForms.findIndex((e) => e._id === formId);
    if (index !== -1) {
      this.leadForm = this.leadForms[index];
      this.leadFormConditions = [
        [
          {
            field: '',
            operator: '',
            type: 'text',
            value: ''
          }
        ]
      ];
      this.commitFormSetting();
    } else {
      this.leadForm = null;
      this._automationTrigger = {};
    }
  }
  onAddCondition(idx: number): void {
    this.leadFormConditions[idx].push({
      field: '',
      operator: '',
      type: 'text',
      value: ''
    });
    this.commitFormSetting();
  }
  onRemoveCondition(index: number, cIndx: number): void {
    if (this.leadFormConditions[index].length === 1) {
      if (index === 0) {
        this.leadFormConditions[index] = [
          {
            field: '',
            operator: '',
            type: 'text',
            value: ''
          }
        ];
      } else {
        this.leadFormConditions.splice(index, 1);
      }
    } else {
      this.leadFormConditions[index].splice(cIndx, 1);
    }
    this.commitFormSetting();
  }
  private commitFormSetting(): void {
    this._automationTrigger = {
      type: 'form_submitted',
      detail: {
        form_id: this.leadForm._id,
        conditions: this.leadFormConditions
      }
    };
    this.onChanged.emit(this._automationTrigger);
  }
  updateCondition(): void {
    this.commitFormSetting();
  }
  updateField($evt, index, idx): void {
    const _field = this.leadForm.fields.find((e) => e.name === $evt);
    if (_field) {
      this.leadFormConditions[index][idx].type = _field.type;
    }
  }
  onAddOrCondition(): void {
    this.leadFormConditions.push([
      {
        field: '',
        operator: '',
        type: 'text',
        value: ''
      }
    ]);
    this.commitFormSetting();
  }
}
