// Added by Sylla
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { StringUtils } from 'turbocommons-ts';
import * as _ from 'lodash';
import { NotifyComponent } from '@components/notify/notify.component';
import { Contact2I } from '@models/contact.model';
import {
  contactTableFields,
  contactTableMandatoryFields,
  contactTablePropertiseMap
} from '@utils/data';
import { Contact2IGroup } from '@utils/data.types';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { CustomFieldAddComponent } from '@components/custom-field-add/custom-field-add.component';
import { PHONE_COUNTRIES } from '@constants/variable.constants';
import { CountryISO } from 'ngx-intl-tel-input';
import { COUNTRIES } from '@constants/countries.constant';
import {
  checkDuplicatedContact,
  getInternationalPhone,
  getPhoneNumberPlaceHolder,
  validateCustomField
} from '@utils/contact';
import { HandlerService } from '@services/handler.service';
import { FieldTypeEnum } from '@utils/enum';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { UserFeatureService } from '@app/services/user-features.service';
@Component({
  selector: 'app-match-column',
  templateUrl: './match-column.component.html',
  styleUrls: ['./match-column.component.scss']
})
export class MatchColumnComponent implements OnInit {
  readonly USER_FEATURES = USER_FEATURES;
  @Input('columns') columns: any[] = [];
  @Input('lines') lines: any[] = [];

  @Output('onPrev') onPrev = new EventEmitter();
  @Output('onNext') onNext = new EventEmitter();
  private labels = [];
  pcMatching = {};
  private phoneUtil = PhoneNumberUtil.getInstance();
  selectedCountry: any = {
    areaCodes: undefined,
    dialCode: '',
    iso2: '',
    name: '',
    placeholder: '',
    priority: 0
  };
  COUNTRIES = [];
  countries: string[] = PHONE_COUNTRIES;
  selectedCountryISO = CountryISO.UnitedStates;

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;

  contacts: Contact2I[] = [];
  private invalidContacts: Contact2I[] = [];
  private contactsToUpload: Contact2I[] = [];
  private csvContactGroups: Contact2IGroup[] = [];

  private additionalFields: any[] = [];

  private fields = contactTableFields; // Array of fields like `{ label: 'First Name', value: 'first_name' }`
  properties = contactTablePropertiseMap; // JSON for matching the field name and field label like `first_name: First Name`

  isSaving = false;
  isLoading = false;

  private garbageSubscription: Subscription;
  isMatched = true;
  misMatchField = '';
  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private handlerService: HandlerService,
    private featureService: UserFeatureService
  ) {
    this.loadFields();
    this.loadCountries();
  }

  ngOnInit(): void {
    setTimeout(() => this.autoMatchColumns(), 50);
  }

  loadFields(): void {
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        const fields = [...contactTableFields];

        const isDeal = this.featureService.isEnableFeature(USER_FEATURES.DEAL);
        const dealIndex = this.fields.findIndex((f) => f.value === 'deal');
        if (dealIndex >= 0 && !isDeal) fields.splice(dealIndex, 1);

        this.additionalFields = garbage.additional_fields.map((e) => e);
        this.additionalFields.forEach((field) => {
          if (field.name) {
            fields.push({ value: field.name, label: field.name });
            this.properties[field.name] = field.name;
          }
        });
        this.fields = [...fields];
      }
    );
  }

  loadCountries(): void {
    for (let i = 0; i < COUNTRIES.length; i++) {
      const c = COUNTRIES[i];
      const country = {
        name: c[0].toString(),
        iso2: c[1].toString(),
        dialCode: c[2].toString(),
        priority: +c[3] || 0,
        areaCodes: c[4] || undefined,
        htmlId: `iti-0__item-${c[1].toString()}`,
        flagClass: `iti__${c[1].toString().toLocaleLowerCase()}`,
        placeHolder: '',
        mask: ''
      };
      country.placeHolder = getPhoneNumberPlaceHolder(
        country.iso2.toUpperCase()
      );
      country.mask = country.placeHolder.replace(/[0-9]/gi, '0');
      this.COUNTRIES.push(country);
    }
    const countriesTemp = [];
    if (this.countries.length) {
      this.countries.forEach((country) => {
        this.COUNTRIES.forEach((c) => {
          if (country === c.iso2) {
            countriesTemp.push(c);
          }
        });
      });
    }
    if (countriesTemp.length > 0) {
      this.COUNTRIES = countriesTemp;
    }
    this.selectedCountry = this.COUNTRIES.find((c) => {
      return c.iso2.toLowerCase() === this.selectedCountryISO.toLowerCase();
    });
    this.handlerService.saveSelectedCountry$(this.selectedCountry);
  }

  autoMatchColumns(): void {
    this.isLoading = true;
    this.columns.forEach((column) => {
      const columnStr = column.toLowerCase();
      let percent = 0;
      this.fields.forEach((field) => {
        const iPCMatching = _.invert(this.pcMatching);
        if (
          Object.keys(iPCMatching).indexOf(field.value) === -1 ||
          field.value === 'notes'
        ) {
          const similarity = StringUtils.compareSimilarityPercent(
            columnStr,
            field.value
          );
          if (
            (similarity > 60 ||
              field.value.includes(columnStr) ||
              columnStr.includes(field.value)) &&
            similarity > percent
          ) {
            percent = similarity;
            this.pcMatching[column] = field.value;
          }
        }
        if (field.value === 'brokerage') {
          this.pcMatching['company'] = field.value;
        }
      });
    });

    this.isMatchedRequiredFields();
    this.isLoading = false;
  }

  createCustomField(column = null): void {
    this.dialog
      .open(CustomFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          mode: 'create'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && column) {
          this.pcMatching[column] = res.name;
        }
      });
  }

  /**
   * Change the Page
   * @param page : Selected Page Index
   */
  changePage(page: number): void {
    this.page = page;
  }

  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
    if (type.id == this.pageSize.id) {
      return;
    }
    this.pageSize = type;
    this.page = 1;
  }

  /**
   * Check the required columns are matched or not
   * @returns
   */
  isMatchedRequiredFields(): void {
    const selectedColumns = [];
    this.isMatched = true;
    for (const key in this.pcMatching) {
      if (Object.prototype.hasOwnProperty.call(this.pcMatching, key)) {
        const element = this.pcMatching[key];
        selectedColumns.push(element);
      }
    }
    if (
      !(
        selectedColumns.includes(contactTableMandatoryFields[0]) &&
        selectedColumns.includes(contactTableMandatoryFields[1]) &&
        (selectedColumns.includes(contactTableMandatoryFields[2]) ||
          selectedColumns.includes(contactTableMandatoryFields[3]))
      )
    ) {
      if (!selectedColumns.includes(contactTableMandatoryFields[0])) {
        this.misMatchField = contactTableMandatoryFields[0]
          .split('_')
          .join(' ');
      }

      if (!selectedColumns.includes(contactTableMandatoryFields[1])) {
        this.misMatchField = contactTableMandatoryFields[1]
          .split('_')
          .join(' ');
      }

      if (
        !selectedColumns.includes(contactTableMandatoryFields[2]) &&
        !selectedColumns.includes(contactTableMandatoryFields[3])
      ) {
        const word1 = contactTableMandatoryFields[2].split('_').join(' ');
        const word2 = contactTableMandatoryFields[3].split('_').join(' ');
        this.misMatchField = word1 + ' or ' + word2;
      }
      this.isMatched = false;
    }
    return;
  }

  /**
   * Get the Matchable CRMGrow Properties
   * @returns
   */
  getColumnFields(): any {
    const selectedProperties = [];
    for (const key in this.pcMatching) {
      if (
        this.pcMatching[key] &&
        this.pcMatching[key] !== 'notes' &&
        this.pcMatching[key] !== 'secondary_phone' &&
        this.pcMatching[key] !== 'secondary_email'
      ) {
        selectedProperties.push(this.pcMatching[key]);
      }
    }
    const remainedProperties = this.fields.filter((field) => {
      return selectedProperties.indexOf(field.value) === -1;
    });
    return remainedProperties;
  }

  /**
   * callback on save & continue after finish the matching columns
   */
  onContinue(): void {
    if (this.isMatched) {
      this.isSaving = true;
      this.generateContacts();
      if (this.invalidContacts.length > 0) {
        this.onNext.emit({
          contacts: this.contacts,
          invalidContacts: this.invalidContacts,
          csvContactGroups: [],
          pcMatching: this.pcMatching
        });
      } else {
        const fields = [];
        this.columns.forEach((column) => {
          if (this.pcMatching[column] && this.pcMatching[column] !== '') {
            fields.push(this.pcMatching[column]);
          }
        });
        const response = checkDuplicatedContact(this.contacts);
        this.contactsToUpload = response.contacts;
        this.csvContactGroups = response.groups;

        this.onNext.emit({
          contacts: this.contactsToUpload,
          invalidContacts: this.invalidContacts,
          csvContactGroups: this.csvContactGroups,
          pcMatching: this.pcMatching
        });
        this.isSaving = false;
      }
    }
  }

  /**
   * Generate the contacts with updated columns
   */
  generateContacts(): void {
    const iPCMatching = _.invert(this.pcMatching);
    this.lines.map((record, cellIndex) => {
      const contact = new Contact2I();
      let validAdditionalFields = true;
      for (const key in this.pcMatching) {
        const property = this.pcMatching[key];
        const additionalField = this.additionalFields.find(
          (field) => field.name === property
        );
        const fieldType =
          additionalField !== undefined
            ? additionalField.type
            : FieldTypeEnum.TEXT;
        if (
          fieldType !== FieldTypeEnum.PHONE &&
          property !== 'notes' &&
          property !== 'tags' &&
          property !== 'cell_phone' &&
          property !== 'secondary_phone' &&
          property !== 'secondary_email'
        ) {
          validAdditionalFields = validateCustomField(
            additionalField,
            record[key]
          );
          if (fieldType === FieldTypeEnum.DATE && validAdditionalFields) {
            contact[property] = new Date(record[key]);
          } else {
            contact[property] = record[key];
            if (
              property == 'label' &&
              this.labels.indexOf(record[key]) === -1
            ) {
              this.labels.push(record[key]);
            }
          }
        } else if (
          fieldType === FieldTypeEnum.PHONE ||
          property === 'cell_phone' ||
          property === 'secondary_phone'
        ) {
          let code = '';
          let phone_number = '';
          if (record[key]?.charAt(0) == '+') {
            try {
              const tel = this.phoneUtil.parse(record[key]);
              phone_number = this.phoneUtil.format(tel, PhoneNumberFormat.E164);
            } catch (err) {
              phone_number = '';
            }
          } else {
            code = this.selectedCountry['iso2'];
            phone_number = getInternationalPhone(record[key], code);
          }
          if (iPCMatching['country'] && record['country']) {
            const country = record['country'];
            this.COUNTRIES.forEach((e) => {
              if (
                e.iso2.toLowerCase() == country.toLowerCase() ||
                e.name.toLowerCase() == country.toLowerCase()
              ) {
                code = e.iso2;
                phone_number = getInternationalPhone(record[key], code);
              }
            });
          }
          if (property === 'secondary_phone') {
            contact['phones'].push(phone_number);
            contact['secondary_phone'] = '';
          } else {
            contact[property] = phone_number;
          }
          if (fieldType === FieldTypeEnum.PHONE) {
            validAdditionalFields = validateCustomField(
              additionalField,
              contact[property]
            );
          }
        } else if (property === 'secondary_email') {
          contact['secondary_email'] = '';
          contact['emails'].push(record[key]);
        } else if (property === 'notes') {
          if (iPCMatching['notes'] instanceof Array) {
            iPCMatching['notes'].forEach((field) => {
              contact['notes'].push(record[field]);
            });
          } else {
            contact['notes'].push(record[key]);
          }
        } else if (property === 'tags') {
          contact['tags'] = (record?.[key] || '').split(',');
        }
      }
      contact.id = cellIndex + '';

      if (
        !contact.isValidEmails ||
        !contact.isValidPhones ||
        !validAdditionalFields
      ) {
        this.invalidContacts.push(contact);
      } else {
        this.contacts.push(contact);
      }
    });

    if (this.pcMatching['label'] && this.labels.length > 50) {
      this.dialog.open(NotifyComponent, {
        maxWidth: '420px',
        width: '96vw',
        data: {
          message: `We have a label limit of 50 labels per account.  You have reached this limit.  Please use tags to help reduce the amount of labels used going forward or reach out to support@crmgrow.com for help with label and tagging strategy.`
        }
      });
      return;
    }
    this.pcMatching = _.invert(iPCMatching);
  }

  onCountrySelect(country: any): void {
    if (this.selectedCountry.iso2 !== country.iso2) {
      this.selectedCountry = country;
      this.handlerService.saveSelectedCountry$(country);
    }
  }

  getFormattedPhoneNumber(phoneNumber: any): string {
    if (phoneNumber?.charAt(0) == '+') {
      try {
        const tel = this.phoneUtil.parse(phoneNumber);
        return this.phoneUtil.format(tel, PhoneNumberFormat.E164);
      } catch (err) {
        return '';
      }
    } else {
      const code = this.selectedCountry['iso2'];
      return getInternationalPhone(phoneNumber, code);
    }
  }

  /**
   * callback on cancel the column matching
   */
  onBack(): void {
    this.onPrev.emit();
  }
}
