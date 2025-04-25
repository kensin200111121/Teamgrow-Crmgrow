import { SspaService } from '../../../services/sspa.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { Papa } from 'ngx-papaparse';
import { saveAs } from 'file-saver';
import _ from 'lodash';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { DialogSettings } from '@constants/variable.constants';
import { Contact2I } from '@models/contact.model';
import { contactTablePropertiseMap } from '@utils/data';
import { isValidPhone, validateEmail } from '@app/helper';
import { HandlerService } from '@services/handler.service';
import {
  checkDuplicatedContact,
  contactHeaderOrder,
  formatValue,
  validateCustomField
} from '@utils/contact';
import { UserService } from '@services/user.service';
import { ArrayObject } from 'ngx-papaparse/lib/interfaces/unparse-data';
import { ContactCreateEditComponent } from '@app/components/contact-create-edit/contact-create-edit.component';

@Component({
  selector: 'app-invalid-contacts',
  templateUrl: './invalid-contacts.component.html',
  styleUrls: ['./invalid-contacts.component.scss']
})
export class InvalidContactsComponent implements OnInit {
  @Input() contactsToUpload: Contact2I[] = [];
  @Input() contacts: Contact2I[] = [];
  @Input() pcMatching = {};
  @Output('onPrev') onPrev = new EventEmitter();
  @Output('onNext') onNext = new EventEmitter();

  phoneUtil = PhoneNumberUtil.getInstance();
  selectedCountry = {
    areaCodes: undefined,
    dialCode: '',
    iso2: '',
    name: '',
    placeholder: '',
    priority: 0
  };

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
  additionalFields: any[] = [];

  contactHeaderOrder = contactHeaderOrder;
  formatValue = formatValue;

  constructor(
    private dialog: MatDialog,
    private handlerService: HandlerService,
    private userService: UserService,
    private papa: Papa,
    public sspaService: SspaService
  ) {
    this.userService.garbage$.subscribe((garbage) => {
      this.additionalFields = garbage.additional_fields.map((e) => e);
    });
  }

  ngOnInit(): void {
    this.selectedCountry = this.handlerService.selectedCountry;
  }

  onChangePage(page: number): void {
    this.page = page;
  }

  onChangePageSize(type: { id: number; label: string }): void {
    if (this.pageSize.id !== type.id) {
      this.pageSize = type;
    }
  }

  getInvalidCount(): number {
    let count = 0;
    this.contacts.forEach((contact) => {
      const keys = Object.keys(contact);
      for (const key of keys) {
        if (!this.isValidField(contact[key], key)) {
          count += 1;
          break;
        }
      }
    });
    return count;
  }

  onEditContact(index: number): void {
    const gIndex = index + (this.page - 1) * this.pageSize.id;
    this.dialog
      .open(ContactCreateEditComponent, {
        data: {
          contact: { ...this.contacts[gIndex] },
          type: 'csv_edit'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const updated = new Contact2I().deserialize({ ...res });
          let code = '';
          if (updated.cell_phone.includes('+')) {
            const tel = this.phoneUtil.parse(updated.cell_phone);
            updated.cell_phone = this.phoneUtil.format(
              tel,
              PhoneNumberFormat.E164
            );
          } else {
            code = this.selectedCountry['iso2'];
            updated.cell_phone = this.getInternationalPhone(
              updated.cell_phone,
              code
            );
          }
          if (updated) {
            this.contacts[gIndex] = updated;
          }
        }
      });
  }

  onContinue(): void {
    this.isSaving = true;
    const contactsToUpload = [...this.contactsToUpload];
    // merge valid contacts and current contacts
    this.contacts.forEach((contact) => {
      let validAdditionalFields = true;
      this.additionalFields.forEach((field) => {
        if (
          Object.keys(contact).includes(field.name) &&
          contact[field.name] &&
          contact[field.name] !== ''
        ) {
          validAdditionalFields = validateCustomField(
            field,
            contact[field.name]
          );
        }
      });
      if (
        contact.isValidEmails &&
        contact.isValidPhones &&
        validAdditionalFields
      ) {
        contactsToUpload.push(contact);
      }
    });
    const response = checkDuplicatedContact(contactsToUpload);

    this.onNext.emit({
      contacts: response.contacts,
      csvContactGroups: response.groups
    });
    this.isSaving = false;
  }

  onIgnoreAndContinue(): void {
    this.isSaving = true;
    const confirmDlg = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Review Invalid Contacts',
        message:
          'There are invalid contacts yet. Are you sure to ignore the invalid contacts and move to next step?',
        confirmLabel: 'Ignore & Next',
        additional: 'export the invalid contacts'
      }
    });
    confirmDlg.afterClosed().subscribe((res) => {
      if (res) {
        this.onContinue();
      }
    });
    confirmDlg.componentInstance.onOtherAction.subscribe((data) => {
      // Download the Invalid Contacts
      this.downloadInvalidContacts();
    });
  }

  downloadInvalidContacts(): void {
    const invalidContactArr: Contact2I[] = [];
    this.contacts.forEach((contact) => {
      if (!contact.isValidEmails || !contact.isValidPhones) {
        invalidContactArr.push(contact);
      }
    });
    // download the invalid
    this.downloadCSV(invalidContactArr, 'crmgrow Import(Invalid)');
  }

  downloadCSV(contacts: Contact2I[], fileName: string): void {
    for (const key in this.properties) {
      if (key === 'notes' || key === 'tags') {
        contacts[0][key] = contacts[0][key] || [];
      } else {
        contacts[0][key] = contacts[0][key] || '';
      }
    }

    const data: ArrayObject = JSON.parse(JSON.stringify(contacts));
    const csvText = this.papa.unparse(data);

    const blob = new Blob([csvText], { type: 'text/csv' });
    saveAs(blob, fileName + '.csv');
  }

  onBack(): void {
    this.onPrev.emit();
  }

  /**
   * Convert the General number to International Number
   * @param phoneNumber: Local number or international number
   * @returns: International Format number
   */
  getInternationalPhone(phoneNumber: string, code: string): any {
    if (phoneNumber) {
      try {
        const formatted = this.phoneUtil.format(
          this.phoneUtil.parse(phoneNumber, code),
          PhoneNumberFormat.E164
        );
        return formatted;
      } catch (err) {
        return '';
      }
    }
    return '';
  }

  /**
   * Check if the contact field value is valid value.
   * @param value: Contact Field Data
   * @param field: Field to check the validation
   * @returns
   */
  isValidField(value: string, field: string): boolean {
    if (
      field !== 'email' &&
      field !== 'cell_phone' &&
      field !== 'secondary_email' &&
      field !== 'secondary_phone'
    ) {
      const customField = this.additionalFields.find(
        (_field) => _field.name === field
      );
      if (customField !== undefined) {
        return validateCustomField(customField, value);
      }
      return true;
    }
    if (field === 'email' || field === 'secondary_email') {
      return validateEmail(value);
    }
    if (field === 'cell_phone' || field === 'secondary_phone') {
      return isValidPhone(value + '');
    }
  }
}
// End by Sylla
