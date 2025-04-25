import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DealsService } from '@services/deals.service';

@Component({
  selector: 'app-edit-deal',
  templateUrl: './edit-deal.component.html',
  styleUrls: ['./edit-deal.component.scss']
})
export class EditDealComponent implements OnInit {
  deal: any;
  contacts: any[] = [];
  stages: any[] = [];
  newContact: any;
  adding = false;
  saving = false;
  saveDealSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<EditDealComponent>,
    private dealService: DealsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.stages) {
      this.stages = this.data.stages;
    }
    if (this.data && this.data.deal) {
      this.deal = JSON.parse(JSON.stringify(this.data.deal));
    }
    if (this.data && this.data.contacts) {
      this.contacts = this.data.contacts;
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.saveDealSubscription && this.saveDealSubscription.unsubscribe();
  }

  getAvatarName(contact: any): string {
    if (contact.first_name && contact.first_name !== '') {
      return contact.first_name.substring(0, 2).toUpperCase();
    } else if (contact.last_name && contact.last_name !== '') {
      return contact.last_name.substring(0, 2).toUpperCase();
    }
    return '';
  }

  setPrimary(contact: any): void {
    if (this.saving) return;
    this.deal.primary_contact = contact;
  }

  getContactsList(): any[] {
    const contacts = this.deal.contacts.map((e) => e._id);
    const remainContacts = this.contacts.filter(
      (e) => contacts.indexOf(e._id) === -1
    );
    return remainContacts;
  }

  hasContacts(): boolean {
    const contacts = this.getContactsList();
    return contacts.length > 0;
  }

  addContacts(): void {
    if (this.saving) return;
    this.adding = true;
    this.newContact = null;
  }

  addContactToDeal(): void {
    if (this.newContact && this.newContact._id) {
      this.deal.contacts.push(this.newContact);
      this.adding = false;
      this.newContact = null;
    }
  }

  cancelAddContactToDeal(): void {
    this.newContact = null;
    this.adding = false;
  }

  removeContact(contact: any): void {
    this.deal.contacts = this.deal.contacts.filter(
      (e) => e._id !== contact._id
    );
    if (this.deal.primary_contact._id === contact._id) {
      this.deal.primary_contact = this.deal.contacts[0];
    }
  }

  save(): void {
    if (this.saving) return;
    if (this.deal._id) {
      this.saving = true;
      const contacts = this.deal.contacts.map((e) => e._id + '');
      let primary_contact = contacts[0];
      if (this.deal.primary_contact) {
        primary_contact = this.deal.primary_contact._id + '';
      }
      const data = {
        title: this.deal.title,
        deal_stage: this.deal.deal_stage,
        contacts,
        primary_contact
      };
      this.saveDealSubscription && this.saveDealSubscription.unsubscribe();
      this.saveDealSubscription = this.dealService
        .editDeal(this.deal._id, data)
        .subscribe((res) => {
          if (res) {
            this.saving = false;
            this.dialogRef.close(this.deal);
          } else {
            this.saving = false;
          }
        });
    } else {
      this.dialogRef.close(this.deal);
    }
  }

  cancel(): void {
    if (this.saving) return;
    this.dialogRef.close();
  }
}
