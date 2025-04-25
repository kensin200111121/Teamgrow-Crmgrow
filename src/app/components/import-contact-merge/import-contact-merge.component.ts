import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { Contact2I } from '@models/contact.model';
import { ContactService } from '@services/contact.service';
import * as _ from 'lodash';
import { DealsService } from '@services/deals.service';

@Component({
  selector: 'app-import-contact-merge',
  templateUrl: './import-contact-merge.component.html',
  styleUrls: ['./import-contact-merge.component.scss']
})
export class ImportContactMergeComponent implements OnInit {
  contacts: Contact2I[] = [];

  MERGETYPE = {
    CONTACT: 1,
    CSV: 2,
    CONTACT_CSV: 3
  };

  merge_type = this.MERGETYPE.CSV;
  collection = {};
  emails = [];
  phones = [];

  contactFields = [];
  fields2Merge = []; // Fields to merge

  previewContact: Contact2I = new Contact2I();

  updateColumn;
  columns = [];

  updating = false;
  merging = false;
  activity = 'Keep primary';
  followup = 'Both';
  automation = 'Keep primary';
  notes = 'Both';

  mergeActions = ['Both', 'Keep primary', 'Remove'];
  automationMergeAction = ['Keep primary', 'Remove'];

  checkableColumn = [
    'first_name',
    'last_name',
    'address',
    'country',
    'city',
    'state',
    'zip',
    'label',
    'brokerage',
    'source',
    'primary_email',
    'primary_phone',
    'secondary_email',
    'secondary_phone',
    'website'
  ];

  emailPhoneColumn = [
    'primary_email',
    'primary_phone',
    'secondary_email',
    'secondary_phone'
  ];

  contactCSVColumn = {
    first_name: 'first_name',
    last_name: 'last_name',
    primary_email: 'primary_email',
    primary_phone: 'primary_phone',
    secondary_email: 'secondary_email',
    secondary_phone: 'secondary_phone',
    address: 'address',
    city: 'city',
    state: 'state',
    zip: 'zip',
    label: 'label',
    country: 'country',
    source: 'source',
    brokerage: 'brokerage',
    tags: 'tags',
    website: 'website',
    notes: 'notes'
  };

  contactContactColumn = {
    ...this.contactCSVColumn,
    last_activity: 'last_activity',
    auto_follow_up: 'auto_follow_up',
    automation: 'automation'
  };

  constructor(
    private dialogRef: MatDialogRef<ImportContactMergeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private contactService: ContactService,
    private dealService: DealsService
  ) {}

  ngOnInit(): void {
    this.loadContact();
  }

  loadContact(): void {
    if (this.data) {
      this.contacts = this.data.contacts;
      this.merge_type = this.mergeType();
      if (this.merge_type === this.MERGETYPE.CONTACT_CSV) {
        this.contactFields = Object.keys(this.properties);
        this.contacts.some((e) => {
          if (e._id) {
            this.previewContact = Object.assign({}, e);
            return true;
          }
        });
      } else if (this.merge_type === this.MERGETYPE.CONTACT) {
        this.contactFields = Object.keys(this.properties);
        this.previewContact = Object.assign({}, this.contacts[0]);
      } else if (this.merge_type === this.MERGETYPE.CSV) {
        this.contactFields = this.data.fields;
        this.previewContact = Object.assign({}, this.contacts[0]);
      }

      const collectionFields = _.difference(this.contactFields, [
        'email',
        'cell_phone',
        'secondary_email',
        'secondary_phone'
      ]);
      this.emails = [];
      this.phones = [];
      this.contacts.forEach((e) => {
        if (e.email) {
          this.emails.push(e.email.toLowerCase());
        }
        if (e.secondary_email) {
          this.emails.push(e.secondary_email.toLowerCase());
        }
        if (e.cell_phone) {
          this.phones.push(e.cell_phone);
        }
        if (e.secondary_phone) {
          this.phones.push(e.secondary_phone);
        }
        collectionFields.forEach((_field) => {
          if (this.collection[_field]) {
            if (_field === 'notes' || _field === 'tags') {
              if (e[_field] && e[_field].length) {
                this.collection[_field] = [
                  ...this.collection[_field],
                  ...e[_field]
                ];
              }
            } else {
              if (e[_field]) {
                this.collection[_field].push(e[_field]);
              }
            }
          } else {
            if (_field === 'notes' || _field === 'tags') {
              if (e[_field] && e[_field].length) {
                this.collection[_field] = e[_field];
              }
            } else {
              if (e[_field]) {
                this.collection[_field] = [e[_field]];
              }
            }
          }
        });
      });
      this.emails = _.uniqBy(this.emails, (e) => e.toLowerCase());
      this.phones = _.uniqBy(this.phones, (e) => e.toLowerCase());
      if (this.collection['tags'] && this.collection['tags'].length) {
        this.collection['tags'] = this.collection['tags'].filter((e) => !!e);
      }
      if (this.collection['notes'] && this.collection['notes'].length) {
        this.collection['notes'] = this.collection['notes'].filter((e) => !!e);
      }
      collectionFields.forEach((_field) => {
        this.collection[_field] = _.uniqBy(this.collection[_field], (e) =>
          e.toLowerCase()
        );
        if (this.collection[_field].length) {
          this.fields2Merge.push(_field);
          if (
            !this.previewContact[_field] ||
            !this.previewContact[_field].length ||
            (this.previewContact[_field] &&
              this.previewContact[_field].length == 1 &&
              !this.previewContact[_field][0])
          ) {
            if (_field === 'tags' || _field === 'notes') {
              this.previewContact[_field] = [this.collection[_field][0]];
            } else {
              this.previewContact[_field] = this.collection[_field][0];
            }
          }
        }
      });
      if (this.emails.length) {
        this.fields2Merge.push('email');
        if (!this.previewContact.email) {
          this.previewContact.email = this.emails[0];
        }
        if (this.emails.length > 1) {
          this.fields2Merge.push('secondary_email');
          if (!this.previewContact.secondary_email) {
            this.previewContact.secondary_email = this.emails[1];
          }
        }
      }
      if (this.phones.length) {
        this.fields2Merge.push('cell_phone');
        if (!this.previewContact.cell_phone) {
          this.previewContact.cell_phone = this.phones[0];
        }
        if (this.phones.length > 1) {
          this.fields2Merge.push('secondary_phone');
          if (!this.previewContact.secondary_phone) {
            this.previewContact.secondary_phone = this.phones[1];
          }
        }
      }
      if (this.previewContact && this.previewContact.email) {
        this.previewContact.email = this.previewContact.email.toLowerCase();
      }
      if (this.previewContact && this.previewContact.cell_phone) {
        this.previewContact.cell_phone =
          this.previewContact.cell_phone.toLowerCase();
      }
      const originalFields = Object.keys(this.properties);
      this.fields2Merge.sort((a, b) => {
        if (originalFields.indexOf(a) > originalFields.indexOf(b)) {
          return 1;
        } else {
          return -1;
        }
      });
    }
  }

  mergeType(): any {
    let contactCount = 0;
    for (const contact of this.contacts) {
      if (contact._id) {
        contactCount++;
      }
    }
    if (contactCount > 1) {
      return this.MERGETYPE.CONTACT;
    } else if (contactCount === 1) {
      return this.MERGETYPE.CONTACT_CSV;
    }
    return this.MERGETYPE.CSV;
  }

  mergeCSV(): void {
    const merged = {
      ...this.previewContact
    };
    this.dialogRef.close({
      type: 'csv-csv',
      merged: new Contact2I().deserialize(merged)
    });
  }

  formatContact(data): any {
    for (const key in data) {
      if (key === 'id') {
      } else if (key === 'notes' || key === 'tags') {
        if (data[key] == undefined) {
          delete data[key];
        }
      } else {
        if (key == undefined) {
          delete data[key];
        } else {
          if (Array.isArray(data[key])) {
            if (data[key].length < 1) {
              delete data[key];
            }
          } else {
            if (data[key] == '' || data[key] == null) {
              delete data[key];
            }
          }
        }
      }
    }
    return data;
  }

  update(): void {
    this.updating = true;
    let data = Object.assign({}, this.previewContact);
    data = this.formatContact(data);
    this.contactService.update(data).subscribe(
      (res) => {
        this.updating = false;
        if (res) {
          const merged = new Contact2I().deserialize({
            ...this.previewContact
          });

          // if has deal field, add contact to deal.
          if (this.previewContact.deal) {
            for (const contact of this.contacts) {
              if (contact.deal && contact.deal === this.previewContact.deal) {
                const dealId = contact['deal_id'];
                const action = 'add';
                const contacts = [this.previewContact._id];
                this.dealService
                  .updateContact({ dealId, action, ids: contacts })
                  .subscribe((res) => {});
              }
            }
          }
          this.dialogRef.close({ type: 'contact-csv', merged });
        }
      },
      (error) => {
        this.updating = false;
      }
    );
  }

  mergeContact(): void {
    if (this.contacts.length > 1) {
      const data = {
        primary_contact: this.contacts[0]._id,
        secondary_contact: this.contacts[1]._id,
        activity_merge: this.activity,
        followup_merge: this.followup,
        automation_merge: this.automation
      };

      let labelName = this.contacts[0].label;
      let labelId = this.contacts[0].label_id;
      if (this.previewContact['label'] === this.contacts[0].label) {
        labelName = this.contacts[0].label;
        labelId = this.contacts[0].label_id;
        this.previewContact['label'] = this.contacts[0].label_id;
      } else {
        labelName = this.contacts[1].label;
        labelId = this.contacts[1].label_id;
        this.previewContact['label'] = this.contacts[1].label_id;
      }

      for (const field in this.contactContactColumn) {
        if (field === 'primary_email') {
          data['email'] = this.previewContact[this.contactContactColumn[field]];
        } else if (field === 'primary_phone') {
          data['cell_phone'] =
            this.previewContact[this.contactContactColumn[field]];
        } else {
          data[field] = this.previewContact[this.contactContactColumn[field]];
        }
      }
      this.merging = true;
      this.contactService.mergeContacts(data).subscribe(
        (res) => {
          this.merging = false;
          if (res) {
            const merged = {
              ...res,
              primary_email: res.email,
              primary_phone: res.cell_phone,
              label: labelName,
              label_id: labelId
            };

            this.dialogRef.close({ type: 'contact-contact', merged });
          }
        },
        (error) => {
          this.merging = false;
        }
      );
    }
  }

  properties = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Primary Email',
    cell_phone: 'Primary Phone',
    secondary_email: 'Secondary Email',
    secondary_phone: 'Secondary Phone',
    brokerage: 'Company',
    website: 'Website',
    address: 'Address',
    country: 'Country',
    state: 'State',
    city: 'City',
    zip: 'Zipcode',
    tags: 'Tags',
    source: 'Source',
    label: 'Label',
    notes: 'Notes',
    deal: 'Deal'
  };
}
