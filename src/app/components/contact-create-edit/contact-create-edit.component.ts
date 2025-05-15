import {
  Component,
  OnDestroy,
  OnInit,
  Inject,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { CountryISO } from 'ngx-intl-tel-input';
import {
  PHONE_COUNTRIES,
  REGIONS,
  STAGES,
  orderOriginal
} from '@constants/variable.constants';
import { DOCUMENT } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { Contact } from '@models/contact.model';
import { ContactService } from '@services/contact.service';
import { Subscription, fromEvent } from 'rxjs';
import { HandlerService } from '@services/handler.service';
import { Router } from '@angular/router';
import { TagService } from '@app/services/tag.service';

import { AUTOCOMPLETE_CLOSE_PROVIDER } from '@app/variables/providers';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { Automation } from '@models/automation.model';
import { AutomationService } from '@services/automation.service';
import { DealsService } from '@services/deals.service';
import { UserService } from '@app/services/user.service';
import { User } from '@app/models/user.model';
import { ConfirmBusinessComponent } from '../confirm-business-hour/confirm-business-hour.component';
import { USER_FEATURES } from '@app/constants/feature.constants';
import moment from 'moment-timezone';
import { formatDate } from '@utils/functions';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { CustomFieldService } from '@app/services/custom-field.service';
import { SelectStageComponent } from '@app/components/select-stage/select-stage.component';
import { InputAutomationComponent } from '@app/components/input-automation/input-automation.component';

@Component({
  selector: 'app-contact-create-edit',
  templateUrl: './contact-create-edit.component.html',
  styleUrls: ['./contact-create-edit.component.scss'],
  providers: [AUTOCOMPLETE_CLOSE_PROVIDER]
})
export class ContactCreateEditComponent implements OnInit, OnDestroy {
  readonly USER_FEATURES = USER_FEATURES;
  // Setting Variable for the UI
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  // COUNTRIES = COUNTRIES;
  COUNTRIES: { code: string; name: string }[] = [];
  // COUNTRY_REGIONS = REGIONS;
  DefaultCountryStates = REGIONS;
  COUNTRY_REGIONS: any[] = [];
  LOCATION_COUNTRIES = ['US'];
  currentYear: string;
  STAGES = STAGES;
  orderOriginal = orderOriginal;

  contact = new Contact();
  phones: any[] = [
    {
      value: '',
      type: '',
      isPrimary: true,
      errors: { required: false, pattern: false }
    }
  ];
  emails: any[] = [
    {
      value: '',
      type: '',
      isPrimary: true,
      errors: { required: false, pattern: false }
    }
  ];
  addresses: any[] = [];
  birthday: any = {};

  automation = '';
  userId;
  user: User = new User();

  contactEmailSubscription: Subscription;
  contactPhoneSubscription: Subscription;
  customFieldSubscription: Subscription;
  selectedPipeline = '';

  addWebSite = false;
  addSource = false;
  addCompany = false;
  showBirthday = false;
  showAutomation = false;
  showDeal = false;
  disableExtra = true;
  relatedPerson = false;
  isEditTag = false; // open the tag selector by default for this flag true status

  note = '';
  isCreate = true;
  isSubmitting = false;
  createSubscription: Subscription;
  updateSubscription: Subscription;
  assignSubscription: Subscription;
  modalScrollHandler: Subscription;
  documentScrollHandler: Subscription;
  defaultPipeline: string;

  additional_fields: any[] = [];
  lead_fields: any[] = [];
  labels = ['Work', 'Home', 'Mobile'];
  @ViewChildren(PhoneInputComponent)
  phoneControls: QueryList<PhoneInputComponent>;
  @ViewChildren(DateInputComponent) dateControls: QueryList<DateInputComponent>;
  @ViewChild(SelectStageComponent) selectStage: SelectStageComponent;
  @ViewChild(InputAutomationComponent)
  inputAutomation: InputAutomationComponent;

  get isInvalidBirthday(): boolean {
    return (
      (this.birthday.year || this.birthday.month || this.birthday.day) &&
      (!this.birthday.year || !this.birthday.month || !this.birthday.day)
    );
  }

  constructor(
    private dialogRef: MatDialogRef<ContactCreateEditComponent>,
    private contactService: ContactService,
    private handlerService: HandlerService,
    private tagService: TagService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(DOCUMENT) private document: Document,
    private el: ElementRef,
    public dealsService: DealsService,
    private userService: UserService,
    private dialog: MatDialog,
    private automationService: AutomationService,
    private customFieldService: CustomFieldService
  ) {
    this.customFieldService.loadContactFields(true);
    if (this.data) {
      this.isEditTag = this.data.isEditTag;
      if (this.data.contact && Object.keys(this.data.contact).length > 0) {
        this.contact = this.data.contact;
        this.resetContactInfo();
      }
      switch (this.data.focusField) {
        case 'address':
          this.addAddress();
          break;
        case 'phone':
          this.addPhoneNumber();
          break;
        case 'email':
          this.addEmail();
          break;
        case 'source':
          this.addSource = true;
          break;
        default:
          break;
      }
    } else {
      this.addEmail();
      this.addPhoneNumber();
    }
  }

  ngOnInit(): void {
    this.COUNTRIES = this.contactService.COUNTRIES;
    this.COUNTRY_REGIONS = this.contactService.COUNTRY_REGIONS;
    if (!this.contact.tags) this.contact.tags = [];
    if(this.contact?.owner?.length) this.relatedPerson = true;

    const profile = this.userService.profile.getValue();
    if (profile) {
      this.userId = profile._id;
      this.user = profile;
    }

    this.modalScrollHandler = fromEvent(
      this.el.nativeElement.querySelector('.mat-dialog-content'),
      'scroll'
    ).subscribe((e: any) => {
      this.closePopups();
    });

    this.documentScrollHandler = fromEvent(this.document, 'scroll').subscribe(
      (e: any) => {
        this.closePopups();
      }
    );

    this.currentYear = new Date().getFullYear().toString();
    this.customFieldSubscription && this.customFieldSubscription.unsubscribe();
    this.customFieldSubscription = this.customFieldService.fields$.subscribe(
      (_fields) => {
        if(this.userId == this.contact.user || this.contact.user == undefined){
          this.additional_fields = _fields;
        }else{
          this.additional_fields = this.contact.customFields ?? [];
        }
        const additional_field = this.contact.additional_field || {};
        this.additional_fields = this.additional_fields.map((item) => {
          if (additional_field.hasOwnProperty(item.name)) {
            return {
              ...item,
              value: additional_field[item.name]
            };
          }
          return item;
        });
      }
    );
  }

  closePopups(): void {
    // Street Address
    const elements = this.document.querySelectorAll('.pac-container');
    elements.forEach((element: HTMLElement) => {
      element.style.display = 'none';
    });

    // Automation
    if (this.inputAutomation) {
      this.inputAutomation.closePopups();
    }

    // Deal Stage
    if (this.selectStage) {
      this.selectStage.closePopups();
    }

    // Phones
    this.phoneControls.forEach((phoneControl) => {
      phoneControl.closePopups();
    });

    // Date
    this.dateControls.forEach((dateControl) => {
      dateControl.close();
    });
  }

  ngOnDestroy(): void {
    this.documentScrollHandler && this.documentScrollHandler.unsubscribe();
    this.modalScrollHandler && this.modalScrollHandler.unsubscribe();
  }

  resetContactInfo() {
    this.isCreate = false;

    // Emails
    this.emails = [];
    this.contact.emails.forEach((e) => {
      if (e.value) {
        this.emails.push({ ...e, errors: { required: false, pattern: false } });
      }
    });
    if (this.contact.email && this.emails.length === 0) {
      this.emails.push({
        value: this.contact.email,
        isPrimary: true,
        type: '',
        errors: { required: false, pattern: false }
      });
    }
    // Phones
    this.phones = [];
    this.contact.phones.forEach((e) => {
      if (e.value) {
        this.phones.push({ ...e, errors: { required: false, pattern: false } });
      }
    });
    if (this.contact.cell_phone && this.phones.length === 0) {
      this.phones.push({
        value: this.contact.cell_phone,
        isPrimary: true,
        type: '',
        errors: { required: false, pattern: false }
      });
    }

    // Addresses
    this.addresses = [];
    if (this.contact.addresses) {
      this.contact.addresses.forEach((e) => {
        if (e.address || e.city || e.state || e.country || e.zip) {
          this.addresses.push({
            ...e,
            errors: { required: false, pattern: false }
          });
        }
      });
    }
    if (
      (this.contact.address ||
        this.contact.city ||
        this.contact.state ||
        this.contact.country ||
        this.contact.zip) &&
      this.addresses.length === 0
    ) {
      this.addresses.push({
        street: this.contact.address,
        city: this.contact.city,
        state: this.contact.state,
        zip: this.contact.zip,
        country: this.contact.country,
        isPrimary: true,
        errors: { required: false, pattern: false }
      });
    }

    this.birthday = this.contact.birthday || { year: 1970, month: '', day: '' };
    if (
      this.contact?.birthday?.year &&
      this.contact?.birthday?.month &&
      this.contact?.birthday?.day
    ) {
      this.showBirthday = true;
    }

    if (this.contact.website) {
      this.addWebSite = true;
    }

    if (this.contact.brokerage) {
      this.addCompany = true;
    }
    if (this.contact.source) {
      this.addSource = true;
    }
  }

  submit() {
    let error = false;
    this.phones.forEach((e) => {
      if (e.value && !this.phoneNumberisValid(e.value)) {
        e.errors.pattern = true;
        e.errors.required = false;
        error = true;
      } else {
        e.errors.pattern = false;
        e.errors.required = false;
      }
    });

    this.emails.forEach((e) => {
      if (e.value && !this.isValidEmail(e.value)) {
        e.errors.required = false;
        e.errors.pattern = true;
        error = true;
      } else {
        e.errors.required = false;
        e.errors.pattern = false;
      }
    });

    if (
      this.showBirthday &&
      (this.birthday.year || this.birthday.month || this.birthday.day) &&
      (!this.birthday.year || !this.birthday.month || !this.birthday.day)
    ) {
      this.birthday.error = true;
      error = true;
    }

    if (error) return;

    this.contact.emails = this.emails
      .filter(({ value }) => {
        return !!value;
      })
      .map(({ value, isPrimary, type }) => {
        return { value: value.replace(/\s/g, ''), isPrimary, type };
      });

    const emailIndex = this.contact.emails.findIndex((e) => e.isPrimary);
    if (emailIndex >= 0)
      this.contact.email = this.contact.emails[emailIndex].value;
    else this.contact.email = '';

    this.contact.phones = this.phones
      .filter(({ value }) => {
        return !!value;
      })
      .map(({ value, isPrimary, type }) => {
        let phoneNumber = value['internationalNumber'].replace(/\D/g, '');
        phoneNumber = '+' + phoneNumber;
        return { value: phoneNumber, isPrimary, type };
      });

    const phoneIndex = this.contact.phones.findIndex((e) => e.isPrimary);
    if (phoneIndex >= 0)
      this.contact.cell_phone = this.contact.phones[phoneIndex].value;
    else this.contact.cell_phone = '';

    if (this.contact?.website) {
      this.contact.website = this.contact.website.trim();
    }

    this.contact.addresses = this.addresses
      .filter((e) => {
        if (
          !e.street &&
          !e.city &&
          (!e.state || e.state === 'None') &&
          !e.zip &&
          (!e.country || e.country === 'None')
        ) {
          return false;
        } else {
          return true;
        }
      })
      .map((e) => {
        if (e.state === 'None') {
          e.state = '';
        }
        if (e.country === 'None') {
          e.country = '';
        }
        return e;
      });

    const addressIndex = this.contact.addresses.findIndex((e) => e.isPrimary);

    if (addressIndex >= 0) {
      this.contact.address = this.contact.addresses[addressIndex].street;
      this.contact.zip = this.contact.addresses[addressIndex].zip;
      this.contact.state = this.contact.addresses[addressIndex].state;
      this.contact.country = this.contact.addresses[addressIndex].country;
      this.contact.city = this.contact.addresses[addressIndex].city;
    } else {
      this.contact.address = '';
      this.contact.zip = '';
      this.contact.state = '';
      this.contact.country = '';
      this.contact.city = '';
    }
    if (this.showBirthday)
      this.contact.birthday = {
        year: this.birthday.year,
        month: this.birthday.month,
        day: this.birthday.day
      };
    else this.contact.birthday = null;

    // Additional Fields
    let valid = true;
    this.contact.additional_field = {};
    if (this.additional_fields.length > 0) {
      let phoneIndex = 0;
      for (const field of this.additional_fields) {
        if (field.type === 'date') {
          if (field.value) {
            if (field?.value?.year) {
              this.contact.additional_field[field.name] = `${field.value.month
                .toString()
                .padStart(2, 0)}/${field.value.day.toString().padStart(2, 0)}/${
                field.value.year
              }`;
            } else {
              if (field.value instanceof Date) {
                this.contact.additional_field[field.name] = formatDate(
                  field.value.getDate(),
                  field.value.getMonth() + 1,
                  field.value.getFullYear()
                );
              } else {
                this.contact.additional_field[field.name] = field.value;
              }
            }
          }
        } else if (field.type === 'phone') {
          if (
            field.value &&
            this.phoneControls &&
            this.phoneControls['_results'] &&
            this.phoneControls['_results'][phoneIndex] &&
            this.phoneControls['_results'][phoneIndex].valid
          ) {
            this.contact.additional_field[field.name] =
              field.value['internationalNumber'];
          } else if (field.value) {
            valid = false;
          }
          phoneIndex++;
        } else {
          this.contact.additional_field[field.name] = field.value;
        }
      }
    }
    if (!valid) {
      return;
    }

    if (this.isCreate) {
      this.create();
    } else {
      this.update();
    }
  }

  create(): any {
    const contactData = this.contact;
    this.isSubmitting = true;
    this.createSubscription && this.createSubscription.unsubscribe();
    this.createSubscription = this.contactService
      .create(contactData)
      .subscribe((res) => {
        this.isSubmitting = false;
        if (res?.data) {
          const contact = new Contact().deserialize(res['data']);
          let isRedirect = false;
          if (contact) {
            this.contactService.onCreate();
            this.handlerService.addContact$(contact);

            if (
              !this.user.onboard.created_contact &&
              this.user.user_version >= 2.1
            ) {
              this.user.onboard.created_contact = true;
              if (this.user.is_primary) isRedirect = true;
              this.userService
                .updateProfile({ onboard: this.user.onboard })
                .subscribe(() => {
                  this.userService.updateProfileImpl({
                    onboard: this.user.onboard
                  });
                });
            } else {
              isRedirect = false;
            }

            // If automation is enabled please assign the automation.
            if (this.automation) {
              const flag = this.getConfirmedAutomationBusinessHour();
              if (!flag) {
                this.dialog
                  .open(ConfirmBusinessComponent, {
                    maxWidth: '500px',
                    width: '96vw',
                    data: {
                      title: 'Confirm Business Hour',
                      message:
                        'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
                      cancelLabel: 'Cancel',
                      confirmLabel: 'Ok'
                    }
                  })
                  .afterClosed()
                  .subscribe((response) => {
                    if (response) {
                      if (response.notShow) {
                        this.updateConfirmAutomationBusinessHour();
                      }
                      this._assignAutomation(contact, isRedirect);
                    }
                  });
              } else {
                this._assignAutomation(contact, isRedirect);
              }
            } else {
              this.dialogRef.close({
                created: true,
                contact,
                redirect: isRedirect
              });
            }

            this.tagService.getAllTags();
          }
        }
      });
  }

  update(): void {
    const contactId = this.contact._id;
    this.isSubmitting = true;
    if (this.data.type === 'csv_edit') {
      this.dialogRef.close({ ...this.contact });
    } else {
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.contactService
        .updateContact(contactId, this.contact)
        .subscribe((res) => {
          this.isSubmitting = false;
          if (res?.status) {
            this.dialogRef.close({ ...this.contact, ...res?.data });
            this.tagService.getAllTags();
          }
        });
    }
  }

  addEmail() {
    this.emails.push({
      value: '',
      type: '',
      isPrimary: this.emails.length === 0,
      errors: { required: false, pattern: false }
    });
  }

  removeEmail(index: number) {
    if (this.emails[index].isPrimary) {
      this.emails.splice(index, 1);
      if (this.emails.length > 0) this.emails[0].isPrimary = true;
    } else {
      this.emails.splice(index, 1);
    }
  }

  onEmailTypeChange(selectedIndex: number, isPrimary: boolean) {
    if (isPrimary) {
      this.emails.forEach((emailObj, index) => {
        emailObj.isPrimary = index === selectedIndex;
      });
    } else {
      this.emails[selectedIndex].isPrimary = false;
    }
  }

  onChangedEmailPrimary(selectedIndex: number) {
    this.emails.forEach((emailObj, index) => {
      emailObj.isPrimary = index === selectedIndex;
    });
  }

  addPhoneNumber() {
    this.phones.push({
      value: '',
      type: '',
      isPrimary: this.phones.length === 0,
      errors: { required: false, pattern: false }
    });
  }

  removePhoneNumber(index: number) {
    if (this.phones[index].isPrimary) {
      this.phones.splice(index, 1);
      if (this.phones.length > 0) this.phones[0].isPrimary = true;
    } else {
      this.phones.splice(index, 1);
    }
  }

  onPhoneTypeChange(selectedIndex: number, isPrimary: boolean) {
    if (isPrimary) {
      this.phones.forEach((phoneObj, index) => {
        phoneObj.isPrimary = index === selectedIndex;
      });
    } else {
      this.phones[selectedIndex].isPrimary = false;
    }
  }

  onChangedPhoneNumberPrimary(selectedIndex: number) {
    this.phones.forEach((emailObj, index) => {
      emailObj.isPrimary = index === selectedIndex;
    });
  }

  addAddress() {
    this.addresses.push({
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      isPrimary: this.addresses.length === 0,
      errors: { required: false, pattern: false }
    });
  }

  removeAddress(index: number) {
    if (this.addresses[index].isPrimary) {
      this.addresses.splice(index, 1);
      if (this.addresses.length > 0) this.addresses[0].isPrimary = true;
    } else {
      this.addresses.splice(index, 1);
    }
  }

  onAddressTypeChange(selectedIndex: number, isPrimary: boolean) {
    if (isPrimary) {
      this.addresses.forEach((addressObj, index) => {
        addressObj.isPrimary = index === selectedIndex;
      });
    } else {
      this.addresses[selectedIndex].isPrimary = false;
    }
  }

  onChangedAddressPrimary(selectedIndex: number) {
    this.addresses.forEach((address, index) => {
      address.isPrimary = index === selectedIndex;
    });
  }

  goToContact(item: Contact): void {
    this.router.navigate(['/contacts/' + item._id]);
    this.dialogRef.close();
  }

  phoneNumberisValid(value): boolean {
    if (!value) {
      return false;
    }
    let number;
    try {
      number = PhoneNumberUtil.getInstance().parse(
        value.number,
        value.countryCode
      );
    } catch (e) {
      return false;
    }
    if (
      !PhoneNumberUtil.getInstance().isValidNumberForRegion(
        number,
        value.countryCode
      )
    ) {
      return false;
    }
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  removeCompany(): void {
    this.addCompany = false;
    this.contact.brokerage = '';
  }

  removeSource(): void {
    this.addSource = false;
    this.contact.source = '';
  }

  removeWebsite(): void {
    this.addWebSite = false;
    this.contact.website = '';
  }

  removeAutomation(): void {
    this.showAutomation = false;
    this.automation = '';
  }

  removeRelatedPerson(): void {
    this.relatedPerson = false;
    this.changeAssignee('');
  }

  removeDealState(): void {
    this.showDeal = false;
    this.contact.deal_stage = '';
  }

  updateLabel(label: string): void {
    this.contact.label = label;
  }

  selectAutomation(automation: Automation): void {
    this.automation = automation._id;
    return;
  }

  _assignAutomation(contact, isRedirect): void {
    this.isSubmitting = true;
    this.assignSubscription && this.assignSubscription.unsubscribe();
    this.assignSubscription = this.automationService
      .bulkAssign(this.automation, [contact._id], null)
      .subscribe((status) => {
        this.isSubmitting = false;
        if (status) {
          // Reload the Current List
          this.handlerService.reload$();
        }
        this.dialogRef.close({
          created: true,
          contact,
          redirect: isRedirect
        });
      });
  }

  getConfirmedAutomationBusinessHour(): boolean {
    const garbage = this.userService.garbage.getValue();
    if (garbage.confirm_message) {
      return garbage.confirm_message.automation_business_hour;
    }
    return false;
  }

  updateConfirmAutomationBusinessHour(): void {
    const garbage = this.userService.garbage.getValue();
    const data = {
      ...garbage.confirm_message,
      automation_business_hour: true
    };
    this.userService.updateGarbage({ confirm_message: data }).subscribe(() => {
      this.userService.updateGarbageImpl({
        confirm_message: data
      });
    });
  }

  manageField(event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.router.navigate(['/contacts/contact-manager/custom-contact-fields']);
    this.dialogRef.close();
  }

  getExtraAdditionalFieldValue(fieldValue: string): any {
    if (moment(fieldValue, moment.ISO_8601, true).isValid()) {
      const date = new Date(fieldValue);
      const dd = date.getDate();
      const mm = date.getMonth() + 1;
      const yyyy = date.getFullYear();
      return formatDate(dd, mm, yyyy);
    }
    return fieldValue;
  }

  onChangePipeline(evt: any): void {
    const tempPipeArray = this.dealsService.pipelines.getValue();
    const pipeline = tempPipeArray.find((e) => e._id == evt);
    if (pipeline) {
      this.dealsService.easyLoadStage(true, pipeline);
    }
  }
  onChangeDealStage(evt: any): void {
    this.contact.deal_stage = evt;
  }

  changeAssignee(evt: any): void {
    this.contact.owner = evt === 'unassign' ? '' : evt;
  }
}
