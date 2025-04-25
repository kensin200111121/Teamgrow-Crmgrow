import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-share-contacts',
  templateUrl: './confirm-share-contacts.component.html',
  styleUrls: ['./confirm-share-contacts.component.scss']
})
export class ConfirmShareContactsComponent implements OnInit {
  permissionContacts = [];
  runningContacts = [];
  constructor(
    private dialogRef: MatDialogRef<ConfirmShareContactsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.additional) {
      this.permissionContacts = [];
      this.runningContacts = [];
      Object.keys(this.data.additional).forEach((key) => {
        const error = key;
        const contacts = [];
        (this.data.additional[key] || []).map((e) => {
          contacts.push(e.contact);
        });
        this.permissionContacts.push({
          error,
          contacts
        });

        if (key === 'Running job') {
          (this.data.additional[key] || []).map((e) => {
            this.runningContacts.push({
              ...e.contact,
              reasons: e.reasons
            });
          });
        }
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  fullName(contact): string {
    if (contact.first_name && contact.last_name) {
      return contact.first_name + ' ' + contact.last_name;
    } else if (contact.first_name) {
      return contact.first_name;
    } else if (contact.last_name) {
      return contact.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }

  avatarName(contact): string {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name) {
      return contact.first_name.substring(0, 2);
    } else if (contact.last_name) {
      return contact.last_name.substring(0, 2);
    } else {
      return 'UN';
    }
  }
}
