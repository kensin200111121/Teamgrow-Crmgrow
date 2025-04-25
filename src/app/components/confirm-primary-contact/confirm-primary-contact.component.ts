import { Component, Inject, OnInit } from '@angular/core';
import { Contact } from '@models/contact.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-primary-contact',
  templateUrl: './confirm-primary-contact.component.html',
  styleUrls: ['./confirm-primary-contact.component.scss']
})
export class ConfirmPrimaryContactComponent implements OnInit {
  submitting = false;
  contacts = [];
  selectedContact = null;
  constructor(
    public dialogRef: MatDialogRef<ConfirmPrimaryContactComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.contacts = this.data.contacts;
  }

  ngOnInit(): void {
    if (this.contacts && this.contacts.length > 0) {
      this.selectedContact = this.contacts[0];
    }
  }

  selectContact(contact): void {
    this.selectedContact = contact;
  }

  isSelected(contact): boolean {
    if (this.selectedContact && this.selectedContact._id === contact._id) {
      return true;
    }
    return false;
  }

  confirm(): void {
    this.dialogRef.close({ primary: this.selectedContact });
  }
}
