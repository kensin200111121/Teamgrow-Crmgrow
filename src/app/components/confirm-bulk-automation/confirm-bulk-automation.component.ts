import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as _ from 'lodash';
import { ContactActivity } from '@models/contact.model';

@Component({
  selector: 'app-confirm-bulk-automation',
  templateUrl: './confirm-bulk-automation.component.html',
  styleUrls: ['./confirm-bulk-automation.component.scss']
})
export class ConfirmBulkAutomationComponent implements OnInit {
  permissionContacts = [];
  contacts = [];
  automations = [];
  selection = [];

  constructor(
    private dialogRef: MatDialogRef<ConfirmBulkAutomationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.contacts) {
      this.contacts = this.data.contacts;
    }
    if (this.data && this.data.automations) {
      this.automations = this.data.automations;
    }
  }

  ngOnInit(): void {
    this.masterToggle();
  }

  isAllSelected(): boolean {
    return this.contacts.length === this.selection.length;
  }

  isSelected(contact): boolean {
    const index = this.selection.findIndex((item) => item._id == contact._id);
    if (index >= 0) {
      return true;
    }
    return false;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection = _.differenceBy(this.selection, this.contacts, '_id');
      return;
    }
    this.contacts.forEach((e) => {
      if (!this.isSelected(e)) {
        this.selection.push(e);
      }
    });
  }

  toggle(contact): void {
    const selectedContact = contact;
    const toggledAllSelection = _.xorBy(
      this.selection,
      [selectedContact],
      '_id'
    );
    this.selection = toggledAllSelection;
  }

  getAutomation(contact): any {
    const index = this.automations.findIndex(
      (item) => item.contact === contact._id
    );
    if (index >= 0) {
      return this.automations[index].title || '';
    }
    return '';
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close({ contacts: this.selection });
  }
}
