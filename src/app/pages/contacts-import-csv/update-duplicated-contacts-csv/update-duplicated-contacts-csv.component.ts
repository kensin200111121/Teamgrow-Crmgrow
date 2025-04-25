// Added by Sylla
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { Automation } from '@models/automation.model';
import { Contact2I } from '@models/contact.model';
import { AutomationService } from '@services/automation.service';
import { UserService } from '@services/user.service';
import { contactHeaderOrder, formatValue } from '@utils/contact';
import { Contact2IGroup } from '@utils/data.types';
import { FieldTypeEnum } from '@utils/enum';

@Component({
  selector: 'app-update-duplicated-contacts-csv',
  templateUrl: './update-duplicated-contacts-csv.component.html',
  styleUrls: ['./update-duplicated-contacts-csv.component.scss']
})
export class UpdateDuplicatedContactsCsvComponent implements OnInit {
  @Output() onClose = new EventEmitter();
  @Output() onUpdate = new EventEmitter();

  @Input('group') group: Contact2IGroup;
  @Input('pcMatching') pcMatching = {};
  @Input('properties') properties = {};

  isUpdating = false;
  additionalFields: any[] = [];
  result: Contact2I;
  automations: Automation[] = [];
  fieldValues = [];

  contactHeaderOrder = contactHeaderOrder;
  formatValue = formatValue;
  garbageSubscription: Subscription;
  automationSubscription: Subscription;

  constructor(
    private userService: UserService,
    private automationService: AutomationService
  ) {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        this.additionalFields = garbage.additional_fields.map((e) => e);
      }
    );
    this.automationSubscription && this.automationSubscription.unsubscribe();
    this.automationSubscription = this.automationService.automations$.subscribe(
      (res) => {
        this.automations = [...res];
      }
    );
  }

  ngOnInit(): void {
    this.isUpdating = false;
    this.result = JSON.parse(JSON.stringify(this.group.result));
    const pcMatchings = this.pcMatching;
    for (const key in pcMatchings) {
      const values = this.getFieldValues(pcMatchings[key]);
      this.fieldValues[pcMatchings[key]] = values;
    }
  }

  ngOnChanges(changes): void {
    if (changes.group) {
      this.group = changes.group.currentValue;
      this.result = JSON.parse(JSON.stringify(this.group.result));
    }
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.automationSubscription && this.automationSubscription.unsubscribe();
  }

  /**
   * callback on cancel the update
   */
  onCancel(): void {
    this.onClose.emit();
  }

  /**
   * callback on update contact
   */
  onUpdateContact(): void {
    this.isUpdating = true;
    this.group.result = JSON.parse(JSON.stringify(this.result));
    this.group.updated = true;
    this.additionalFields.forEach((field) => {
      const value = this.group.result[field.name];
      if (value && value !== '' && field.type === FieldTypeEnum.DATE) {
        this.group.result[field.name] = new Date(value);
      }
    });
    this.onUpdate.emit(this.group);
    this.isUpdating = false;
  }

  isSingleValue(field: string): boolean {
    return this.fieldValues[field]?.length <= 1;
  }

  getFieldValues(field: string): any[] {
    const values = [];
    this.group.contacts.forEach((contact) => {
      const customField = this.additionalFields.find((e) => e.name === field);
      if (
        customField &&
        customField.type === FieldTypeEnum.DATE &&
        contact[field]
      ) {
        let value = contact[field];
        if (typeof value === 'string') {
          value = new Date(value);
        }
        const index = values.findIndex((v) => v.getTime() === value.getTime());
        if (index === -1) {
          values.push(value);
        }
      } else if ((field === 'tags' || field === 'notes') && contact[field]) {
        contact[field].forEach((value) => {
          if (values.indexOf(value) === -1) {
            values.push(value);
          }
        });
      } else {
        if (
          contact[field] &&
          contact[field] !== '' &&
          values.indexOf(contact[field]) === -1
        ) {
          values.push(contact[field]);
        }
      }
    });
    return values;
  }

  isSelectedOption(value1: any, value2: any, field: string): boolean {
    const customField = this.additionalFields.find((e) => e.name === field);
    if (
      customField &&
      customField.type === FieldTypeEnum.DATE &&
      value1 &&
      value2
    ) {
      let fValue1 = value1;
      let fValue2 = value2;
      if (typeof value1 === 'string') {
        fValue1 = new Date(value1);
      }
      if (typeof value2 === 'string') {
        fValue2 = new Date(value2);
      }
      return fValue1.getTime() === fValue2.getTime();
    }
    return value1 === value2;
  }

  contactAutomation(item: Automation): boolean {
    for (const contact of this.group.contacts) {
      if (contact['automation_id'] && contact['automation_id'] === item._id) {
        return true;
      }
    }
    return false;
  }
}
// End by Sylla
