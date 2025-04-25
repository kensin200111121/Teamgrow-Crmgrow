import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { Automation } from '@models/automation.model';
import { LabelService } from '@services/label.service';
import { ContactService } from '@services/contact.service';
import { DealsService } from '@services/deals.service';
import { AutomationService } from '@services/automation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-select-contact-condition',
  templateUrl: './select-contact-condition.component.html',
  styleUrls: ['./select-contact-condition.component.scss']
})
export class SelectContactConditionComponent implements OnInit {
  node;
  conditions = [];
  selectedCondition = '';
  automations: Automation[] = [];
  COUNTRIES: { code: string; name: string }[] = [];
  labels = [];
  automationsSubscription: Subscription;
  dealsSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<SelectContactConditionComponent>,
    private dialog: MatDialog,
    private automationService: AutomationService,
    private contactService: ContactService,
    public labelService: LabelService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.node = this.data.node;
      this.conditions = this.node['contact_conditions'];
      this.selectedCondition = this.conditions[0];
    }

    this.automationsSubscription && this.automationsSubscription.unsubscribe();
    this.automationsSubscription =
      this.automationService.automations$.subscribe((res) => {
        this.automations = res;
      });
  }

  ngOnInit(): void {
    this.COUNTRIES = this.contactService.COUNTRIES;
    this.labelService.allLabels$.subscribe((res) => {
      this.labels = res;
    });
  }

  setCondition(condition): void {
    this.selectedCondition = condition;
  }

  isSelected(condition): boolean {
    if (
      this.getContactConditionLabel(condition) ==
      this.getContactConditionLabel(this.selectedCondition)
    ) {
      return true;
    }
    return false;
  }

  getContactConditionLabel(condition): any {
    if (this.node['condition_field'] === 'tags') {
      return condition.join(', ');
    } else if (this.node['condition_field'] === 'automation') {
      const index = this.automations.findIndex(
        (item) => item._id === condition
      );
      if (index >= 0) {
        return this.automations[index].title;
      }
    } else if (this.node['condition_field'] === 'country') {
      const index = this.COUNTRIES.findIndex((item) => item.code === condition);
      if (index >= 0) {
        return this.COUNTRIES[index].name;
      } else {
        return '';
      }
    } else if (this.node['condition_field'] === 'label') {
      const label = this.labels.find((e) => e._id === condition);
      if (label) return label.name;
      else return '';
    } else {
      return condition;
    }
  }

  onConfirm(): void {
    this.dialogRef.close({ condition: this.selectedCondition });
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
