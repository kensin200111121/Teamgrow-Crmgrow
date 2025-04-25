import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Contact, ContactDetail } from '@models/contact.model';
import * as _ from 'lodash';
import { ContactService } from '@services/contact.service';
import { Label } from '@models/label.model';
import { contactMergeFields, contactSingleMergeFields } from '@app/utils/data';

@Component({
  selector: 'app-contact-merge',
  templateUrl: './contact-merge.component.html',
  styleUrls: ['./contact-merge.component.scss']
})
export class ContactMergeComponent implements OnInit {
  saving = false;
  type = 'single';
  sourceContact: ContactDetail = new ContactDetail();
  mergeContact: ContactDetail = new ContactDetail();
  previewContact = {};
  collection = {};
  emails = [];
  phones = [];
  contacts = [];

  columns = contactSingleMergeFields;

  activity = 'Keep primary';
  followup = 'Both';
  automation = 'Keep primary';
  notes = 'Both';
  label: Label = new Label();

  mergeActions = [
    { label: 'Both', value: 'both' },
    { label: 'Keep primary', value: 'primary' },
    { label: 'Remove', value: 'remove' }
  ];

  multiMergeActions = [
    { label: 'All', value: 'all' },
    { label: 'Remove', value: 'remove' }
  ];

  automationMergeActions = [
    { label: 'Keep primary', value: 'primary' },
    { label: 'Remove', value: 'remove' }
  ];

  constructor(
    private dialogRef: MatDialogRef<ContactMergeComponent>,
    private contactService: ContactService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.contact) {
      this.sourceContact = this.data.contact;
    }
    if (this.data && this.data.type === 'multi') {
      this.type = this.data.type;
      this.contacts = this.data.contacts;
      this.columns = contactMergeFields;
      this.activity = 'All';
    }
  }

  ngOnInit(): void {
    this.initContact();
  }

  initContact(): void {
    this.collection = {};
    if (this.type !== 'multi') {
      this.previewContact = new Contact();
      for (const column of this.columns) {
        if (this.sourceContact[column.value]) {
          if (column.value !== 'tags') {
            this.collection[column.value] = [this.sourceContact[column.value]];
          } else {
            this.collection[column.value] = [
              ...this.sourceContact[column.value]
            ];
          }
        }
      }

      if (this.sourceContact['email']) {
        this.emails.push(this.sourceContact['email']);
      }
      if (this.sourceContact['secondary_email']) {
        this.emails.push(this.sourceContact['secondary_email']);
      }
      if (this.sourceContact['cell_phone']) {
        this.phones.push(this.sourceContact['cell_phone']);
      }
      if (this.sourceContact['secondary_phone']) {
        this.phones.push(this.sourceContact['secondary_phone']);
      }

      if (this.emails.length > 0) {
        this.previewContact['primary_email'] = this.emails[0];
        if (this.emails.length > 1) {
          this.previewContact['secondary_email'] = this.emails[1];
        }
      }
      if (this.phones.length > 0) {
        this.previewContact['primary_phone'] = this.phones[0];
        if (this.phones.length > 1) {
          this.previewContact['secondary_phone'] = this.phones[1];
        }
      }
    } else {
      this.previewContact = {
        ...this.sourceContact
      };
      for (const column of this.columns) {
        this.collection[column.value] = [];
        this.contacts.forEach((contact) => {
          if (column.value === 'tags' && contact[column.value]) {
            contact[column.value].forEach((e) => {
              if (!this.collection[column.value].some((arr) => arr[0] === e)) {
                this.collection[column.value].push([e]);
              }
            });
          } else if (
            column.value === 'additional_field' &&
            contact[column.value]
          ) {
            Object.keys(contact[column.value]).forEach((key) => {
              if (
                !this.collection[column.value].some((arr) => arr[0] === key)
              ) {
                this.collection[column.value].push([key]);
              }
            });
          } else {
            if (
              contact[column.value] &&
              !this.collection[column.value].includes(contact[column.value])
            ) {
              this.collection[column.value].push(contact[column.value]);
            }
          }
        });
        if (this.collection[column.value].length) {
          this.previewContact[column.value] = this.collection[column.value][0];
        }
      }
      let duplicated = false;
      this.contacts.forEach((contact) => {
        if (contact.mergedIds?.length) {
          duplicated = true;
        }
        if (contact.original_user) {
          const data = {
            label: contact.original_user[0].user_name + '(contact owner)',
            value: contact.original_user[0]._id
          };
          this.multiMergeActions.splice(
            this.multiMergeActions.length - 1,
            0,
            data
          );
        }
      });
      if (duplicated) {
        this.multiMergeActions = [
          {
            label: 'Add the activity of merged contacts',
            value: 'all'
          },
          {
            label: `Doesn't add the activity of merged contacts`,
            value: 'remove'
          }
        ];
        this.activity = 'Add the activity of merged contacts';
      }
    }
  }

  isExistMergeContact(): any {
    return this.mergeContact && this.mergeContact._id;
  }

  addContacts(contact: any): void {
    this.emails = [];
    this.phones = [];
    this.initContact();
    this.mergeContact = new ContactDetail();

    if (!contact) {
      return;
    }

    this.mergeContact = contact;
    for (const column of this.columns) {
      if (this.mergeContact[column.value]) {
        if (this.collection[column.value]) {
          if (column.value !== 'tags') {
            if (
              this.collection[column.value].indexOf(
                this.mergeContact[column.value]
              ) < 0
            ) {
              this.collection[column.value].push(
                this.mergeContact[column.value]
              );
            }
          } else {
            for (const tag of this.mergeContact[column.value]) {
              if (this.collection[column.value].indexOf(tag) < 0) {
                this.collection[column.value].push(tag);
              }
            }
            this.previewContact[column.value] = [
              ...this.collection[column.value]
            ];
          }
        } else {
          if (column.value !== 'tags') {
            this.collection[column.value] = [this.mergeContact[column.value]];
            this.previewContact[column.value] =
              this.collection[column.value].length > 0
                ? this.collection[column.value][0]
                : null;
          } else {
            this.collection[column.value] = [
              ...this.mergeContact[column.value]
            ];
            this.previewContact[column.value] = [
              ...this.collection[column.value]
            ];
          }
        }
      }
    }

    if (this.mergeContact['email']) {
      this.emails.push(this.mergeContact['email']);
    }
    if (this.mergeContact['secondary_email']) {
      this.emails.push(this.mergeContact['secondary_email']);
    }
    if (this.mergeContact['cell_phone']) {
      this.phones.push(this.mergeContact['cell_phone']);
    }
    if (this.mergeContact['secondary_phone']) {
      this.phones.push(this.mergeContact['secondary_phone']);
    }

    if (!this.previewContact['primary_email'] && this.emails.length > 0) {
      this.previewContact['primary_email'] = this.emails[0];
    }
    if (!this.previewContact['secondary_email'] && this.emails.length > 1) {
      this.previewContact['secondary_email'] = this.emails[1];
    }
    if (!this.previewContact['primary_phone'] && this.phones.length > 0) {
      this.previewContact['primary_phone'] = this.phones[0];
    }
    if (!this.previewContact['secondary_phone'] && this.phones.length > 1) {
      this.previewContact['secondary_phone'] = this.phones[1];
    }
  }

  submit(): void {
    if (!this.mergeContact._id && this.type !== 'multi') {
      return;
    }
    this.saving = true;

    if (this.type !== 'multi') {
      const activityIndex = this.mergeActions.findIndex(
        (item) => item.label === this.activity
      );
      const followupIndex = this.mergeActions.findIndex(
        (item) => item.label === this.followup
      );
      const automationIndex = this.automationMergeActions.findIndex(
        (item) => item.label === this.automation
      );
      const notesIndex = this.mergeActions.findIndex(
        (item) => item.label === this.notes
      );
      const data = {
        primary_contact: this.sourceContact._id,
        secondary_contact: this.mergeContact._id,
        activity_merge: this.mergeActions[activityIndex].value,
        followup_merge: this.mergeActions[followupIndex].value,
        automation_merge: this.automationMergeActions[automationIndex].value,
        notes_merge: this.mergeActions[notesIndex].value,
        ...this.previewContact,
        cell_phone: this.previewContact['primary_phone'],
        email: this.previewContact['primary_email']
      };
      this.contactService.mergeContacts(data).subscribe((res) => {
        this.saving = false;
        if (res) {
          this.dialogRef.close(true);
        }
      });
    } else {
      const activityIndex = this.multiMergeActions.findIndex(
        (item) => item.label === this.activity
      );

      let label = '';
      if (this.previewContact['label']?.['_id']) {
        label = this.previewContact['label']['_id'];
      } else {
        delete this.previewContact['label'];
      }
      const additional_field = {};
      if (this.previewContact['additional_field'].length) {
        this.previewContact['additional_field'].forEach((field) => {
          this.contacts.forEach((contact) => {
            if (
              contact.additional_field &&
              Object.keys(contact.additional_field).includes(field)
            ) {
              additional_field[field] = contact.additional_field[field];
            }
          });
        });
      }
      let mergedIds = [];
      this.contacts.forEach((contact) => {
        if (contact._id) {
          mergedIds.push(contact._id);
        } else if (contact.mergedIds?.length) {
          mergedIds = [...new Set([...mergedIds, ...contact.mergedIds])];
        }
      });
      let activity_merge = this.multiMergeActions[activityIndex].value;
      if (activity_merge !== 'all' && activity_merge !== 'remove') {
        this.contacts.forEach((contact) => {
          if (
            contact.original_user &&
            contact.original_user[0]._id == activity_merge
          ) {
            activity_merge = contact._id;
          }
        });
      }

      let data;
      if (label) {
        data = {
          activity_merge: activity_merge,
          ...this.previewContact,
          label,
          additional_field,
          mergedIds
        };
      } else {
        data = {
          activity_merge: activity_merge,
          ...this.previewContact,
          additional_field,
          mergedIds
        };
      }
      this.saving = false;
      this.dialogRef.close(data);
    }
  }
}
