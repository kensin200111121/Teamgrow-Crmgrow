import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Contact } from '@models/contact.model';
import { Garbage } from '@models/garbage.model';
import { ContactService } from '@services/contact.service';
import { UserService } from '@services/user.service';
import { CustomFieldService } from '@app/services/custom-field.service';

@Component({
  selector: 'app-custom-fields-merge',
  templateUrl: './custom-fields-merge.component.html',
  styleUrls: ['./custom-fields-merge.component.scss']
})
export class CustomFieldsMergeComponent implements OnInit {
  mergeList: any[] = []; // the fields list
  mergeFields: any[] = []; // selected fields to be merged
  mergeToField = ''; // the field id that will be existed after merge
  garbage: Garbage;
  step = 1;
  isProcessing = false;
  isLoading = false;
  PAGE_COUNTS = [
    { id: 5, label: '5' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;
  total = 0;
  ids: string[] = [];
  contacts: Contact[] = [];
  updatedContacts: string[] = [];
  failedContacts: string[] = [];
  fields: any[] = [];

  garbageSubscription: Subscription;
  contactSubscription: Subscription;
  additionalFieldSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<CustomFieldsMergeComponent>,
    private contactService: ContactService,
    private customFieldService: CustomFieldService,
    private userService: UserService,
    private toast: ToastrService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.mergeFields) {
      this.mergeFields = this.data.mergeFields;
    }
    if (this.data && this.data.mergeList) {
      this.mergeList = this.data.mergeList;
    }
  }

  ngOnInit(): void {
    this.step = 1;
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      if (res) {
        this.garbage = new Garbage().deserialize(res);
      }
    });
    this.mergeToField = this.data.selectedField.id;
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.contactSubscription && this.contactSubscription.unsubscribe();
    this.additionalFieldSubscription &&
      this.additionalFieldSubscription.unsubscribe();
  }

  getFieldName(): string {
    const field = this.mergeList.find(
      (_field) => _field._id === this.mergeToField
    );
    if (field) {
      return field.name;
    }
    return '';
  }

  onMergeField(force = false): void {
    this.isProcessing = true;
    const removeFields = [];
    this.mergeList.forEach((field) => {
      if (field._id !== this.mergeToField) {
        removeFields.push(field._id);
      }
    });

    // filter the only field names
    const mergeFields = [];
    let mergeToField = ''; // field name which all fields will be merged to
    for (const field of this.mergeList) {
      if (field._id !== this.mergeToField) {
        mergeFields.push(field.name);
      } else {
        mergeToField = field.name;
      }
    }
    this.fields = [...mergeFields, mergeToField];
    // check that any template tokens matched with the merging fields
    const tokens = this.garbage.template_tokens.filter(
      (token) => !mergeFields.includes(token.match_field)
    );
    const updateData = { template_tokens: tokens };
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService
      .updateGarbage(updateData)
      .subscribe(() => {
        this.userService.updateGarbageImpl(updateData);
        // merge the fields
        this.additionalFieldSubscription &&
          this.additionalFieldSubscription.unsubscribe();
        this.additionalFieldSubscription = this.contactService
          .mergeAdditionalFields(mergeFields, mergeToField)
          .subscribe(
            (res) => {
              this.isProcessing = false;
              if (res && res['status']) {
                if (res['ids'].length > 0) {
                  this.ids = res['ids'];
                  this.total = this.ids.length;
                  this.loadPageContacts();
                  this.step = 2;
                } else {
                  this.customFieldService
                    .deleteFields(removeFields)
                    .subscribe((res) => {
                      this.dialogRef.close({
                        field: this.mergeToField
                      });
                    });
                }
              } else {
                this.toast.error(res['error']);
              }
            },
            (err) => {
              this.isProcessing = false;
              this.toast.error(err);
            }
          );
      });
  }

  getFieldsList(): any[] {
    return this.mergeList.filter((item) => item.id !== this.mergeToField);
  }

  changePageSize(type: { id: number; label: string }): void {
    if (type.id === this.pageSize.id) return;
    this.pageSize = type;
    this.page = 1;
    this.loadPageContacts();
  }

  changePage(page: number): void {
    this.page = page;
    this.loadPageContacts();
  }

  loadPageContacts(): void {
    this.isLoading = true;
    this.updatedContacts = [];
    this.failedContacts = [];
    const startIndex = (this.page - 1) * this.pageSize.id;
    const endIndex =
      this.page * this.pageSize.id > this.total
        ? this.total
        : this.page * this.pageSize.id;
    const subIds = this.ids.slice(startIndex, endIndex);
    this.additionalFieldSubscription &&
      this.additionalFieldSubscription.unsubscribe();
    this.additionalFieldSubscription = this.contactService
      .loadAdditionalFieldsConflictContactsPagination(subIds)
      .subscribe((res) => {
        if (res) {
          this.contacts = res;
        }
        this.isLoading = false;
      });
  }

  solvedContact(contact: Contact): boolean {
    for (const field of this.mergeList) {
      if (field.id !== this.mergeToField) {
        if (
          contact.additional_field[field.name] &&
          contact.additional_field[field.name] !== ''
        ) {
          return false;
        }
      }
    }
    return true;
  }

  updatedContact(contact: Contact): boolean {
    return this.updatedContacts.includes(contact._id);
  }

  failedContact(contact: Contact): boolean {
    return this.failedContacts.includes(contact._id);
  }

  getAvailableValues(contact: Contact): any[] {
    const values = [];
    this.mergeList.forEach((field) => {
      if (field.id !== this.mergeToField) {
        const value = contact['additional_field'][field.name];
        if (value && value !== '' && !values.includes(value)) {
          values.push(value);
        }
      }
    });
    return values;
  }

  onUpdateContact(contact: Contact): void {
    this.mergeList.forEach((field) => {
      if (field.id !== this.mergeToField) {
        contact.additional_field[field.name] = '';
      }
    });
    this.contactSubscription && this.contactSubscription.unsubscribe();
    this.contactSubscription = this.contactService
      .updateContact(contact._id, contact)
      .subscribe((res) => {
        if (res?.status) {
          this.updatedContactSuccess(contact);
        } else {
          this.updatedContactFailure(contact);
        }
      });
  }

  updatedContactSuccess(contact: Contact): void {
    if (!this.updatedContacts.includes(contact._id)) {
      this.updatedContacts.push(contact._id);
    }
    if (this.failedContacts.includes(contact._id)) {
      this.failedContacts = this.failedContacts.filter(
        (id) => id !== contact._id
      );
    }
  }

  updatedContactFailure(contact: Contact): void {
    if (!this.failedContacts.includes(contact._id)) {
      this.failedContacts.push(contact._id);
    }
    if (this.updatedContacts.includes(contact._id)) {
      this.updatedContacts = this.updatedContacts.filter(
        (id) => id !== contact._id
      );
    }
  }

  openContact(contact: Contact): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`/contacts/${contact._id}`])
    );
    window.open(url, '_blank');
  }

  close(): void {
    this.dialogRef.close({
      field: this.mergeToField
    });
  }
}
