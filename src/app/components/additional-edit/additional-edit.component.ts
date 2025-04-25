import { CountryISO } from 'ngx-intl-tel-input';
import { PHONE_COUNTRIES } from '@constants/variable.constants';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Contact } from '@models/contact.model';
import { ContactService } from '@services/contact.service';
import { UserService } from '@services/user.service';
import { Deal } from '@models/deal.model';
import { DealsService } from '@services/deals.service';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import { CustomFieldAddComponent } from '@components/custom-field-add/custom-field-add.component';
import moment from 'moment-timezone';
import { formatDate } from '@utils/functions';
import { TagService } from '@app/services/tag.service';
@Component({
  selector: 'app-additional-edit',
  templateUrl: './additional-edit.component.html',
  styleUrls: ['./additional-edit.component.scss']
})
export class AdditionalEditComponent implements OnInit, OnDestroy {
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  contact: Contact = new Contact();
  deal: Deal = new Deal();
  isUpdating = false;
  updateSubscription: Subscription;
  garbageSubscription: Subscription;
  additional_fields: any[] = [];
  lead_fields: any[] = [];
  submitted = false;
  type = 'contact';
  @ViewChildren('phoneControl') phoneControls: QueryList<PhoneInputComponent>;
  constructor(
    private dialogRef: MatDialogRef<AdditionalEditComponent>,
    private contactService: ContactService,
    private userService: UserService,
    private dealService: DealsService,
    private tagService: TagService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.type === 'deal') {
      this.type = 'deal';
      this.deal = new Deal().deserialize(this.data.deal);
      if (this.deal.additional_field) {
        for (const key in this.deal.additional_field) {
          const item = {
            name: key,
            type: 'text',
            value: this.deal.additional_field[key],
            isExtra: true
          };
          this.additional_fields.push(item);
        }
      }
    } else {
      if (this.data && this.data.contact) {
        this.contact = new Contact().deserialize(this.data.contact);
        this.contact.tags = [...this.contact.tags];
        const additional_field = this.contact.additional_field || {};
        this.data.lead_fields.forEach((field) => {
          this.additional_fields.push({
            ...field,
            value: additional_field[field.name],
            isExtra: false
          });
          this.lead_fields.push(field.name);
        });

        if (!this.contact.additional_field) {
          this.contact.additional_field = {};
        } else {
          // check extra additional fields which not defined on settings
          // this could be occur when change field's name on settings
          for (const key in this.contact.additional_field) {
            if (this.lead_fields.indexOf(key) === -1) {
              this.additional_fields.push({
                name: key,
                type: 'text',
                value: this.getExtraAdditionalFieldValue(
                  this.contact.additional_field[key]
                ),
                isExtra: true
              });
            }
          }
        }
      }
    }
  }

  ngOnInit(): void {
    // this.garbageSubscription = this.userService.garbage$.subscribe(
    //   (_garbage) => {
    //     this.additional_fields = _garbage.additional_fields;
    //   }
    // );

    if (this.additional_fields.length > 0) {
      for (const field of this.additional_fields) {
        if (field.type === 'date') {
          const field_name = field.name.toUpperCase();
          if (field_name.indexOf('BIRTH') >= 0) {
            const minYear = moment().year() - 70;
            field.minDate = { year: minYear, month: 1, day: 1 };
            const maxYear = moment().year() - 10;
            field.maxDate = { year: maxYear, month: 1, day: 1 };
          }
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  addField(): void {
    this.additional_fields.push({
      name: '',
      type: 'text',
      value: '',
      isExtra: true
    });
  }

  removeField(index): void {
    this.additional_fields.splice(index, 1);
  }

  update(): void {
    if (this.type === 'contact') {
      // validation Checking
      let valid = true;
      const contactId = this.contact._id;
      this.contact.additional_field = {};
      if (this.additional_fields.length > 0) {
        let phoneIndex = 0;
        for (const field of this.additional_fields) {
          if (field.type === 'date') {
            if (field.value) {
              if (field?.value?.year) {
                this.contact.additional_field[field.name] = `${field.value.month
                  .toString()
                  .padStart(2, 0)}/${field.value.day
                  .toString()
                  .padStart(2, 0)}/${field.value.year}`;
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
      this.isUpdating = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.contactService
        .updateContact(contactId, {
          source: this.contact.source,
          brokerage: this.contact.brokerage,
          tags: this.contact.tags,
          additional_field: this.contact.additional_field
        })
        .subscribe((res) => {
          this.isUpdating = false;
          if (res?.status) {
            this.tagService.getAllTags();
            this.dialogRef.close({
              success: res,
              source: this.contact.source,
              brokerage: this.contact.brokerage,
              tags: this.contact.tags,
              additional_field: this.contact.additional_field
            });
          }
        });
    } else if (this.type === 'deal') {
      this.deal.additional_field = {};
      if (this.additional_fields.length > 0) {
        for (const field of this.additional_fields) {
          this.deal.additional_field[field.name] = field.value;
        }
      }

      this.isUpdating = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.dealService
        .editDeal(this.deal._id, this.deal)
        .subscribe((res) => {
          this.isUpdating = false;
          if (res) {
            this.dialogRef.close(this.additional_fields);
          }
        });
    }
  }

  /**
   * Phone Number Validation Checking function
   * @param wrapper: Form Group Wrapper Dom Object
   * @param form: Form Control Object
   * @param event: Changed Value
   */
  checkPhoneValidation(wrapper, form, event): void {
    const wrapperDom = wrapper && <HTMLDivElement>wrapper;
    if (form.valid || !event) {
      // Remove Error State
      wrapperDom &&
        wrapperDom.classList &&
        wrapperDom.classList.remove('invalid-phone');
    } else {
      // Insert the Error State
      wrapperDom &&
        wrapperDom.classList &&
        wrapperDom.classList.add('invalid-phone');
    }
  }

  convertField(field, index): void {
    this.dialog
      .open(CustomFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          mode: 'convert',
          field
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const data = {
            ...res,
            isExtra: false
          };
          this.additional_fields.splice(index, 1);
          const localIndex = this.additional_fields.findIndex(
            (item) => item.isExtra == true
          );
          if (localIndex > 0) {
            this.additional_fields.splice(localIndex, 0, data);
          } else {
            this.additional_fields.push(data);
          }

          if (this.type === 'contact') {
            // validation Checking
            let valid = true;
            const contactId = this.contact._id;
            this.contact.additional_field = {};
            if (this.additional_fields.length > 0) {
              let phoneIndex = 0;
              for (const field of this.additional_fields) {
                if (field.type !== 'phone') {
                  this.contact.additional_field[field.name] = field.value;
                } else {
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
                }
              }
            }

            if (!valid) {
              return;
            }
            this.updateSubscription && this.updateSubscription.unsubscribe();
            this.updateSubscription = this.contactService
              .updateContact(contactId, {
                source: this.contact.source,
                brokerage: this.contact.brokerage,
                tags: this.contact.tags,
                additional_field: this.contact.additional_field
              })
              .subscribe((res) => {});
          } else if (this.type === 'deal') {
            if (this.additional_fields.length > 0) {
              this.deal.additional_field = {};
              for (const field of this.additional_fields) {
                this.deal.additional_field[field.name] = field.value;
              }
            }
            this.updateSubscription && this.updateSubscription.unsubscribe();
            this.updateSubscription = this.dealService
              .editDeal(this.deal._id, this.deal)
              .subscribe((res) => {});
          }
        }
      });
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
}
