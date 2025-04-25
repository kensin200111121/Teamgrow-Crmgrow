import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin, Subscription } from 'rxjs';
import { Automation } from '@models/automation.model';
import { AutomationService } from '@services/automation.service';
import { DealsService } from '@services/deals.service';

@Component({
  selector: 'app-merge-deals',
  templateUrl: './merge-deals.component.html',
  styleUrls: ['./merge-deals.component.scss']
})
export class MergeDealsComponent implements OnInit {
  result: any;
  deals: any[] = [];
  contacts: any[] = [];
  stages: any[] = [];
  automations: Automation[] = [];
  newContact: any;
  adding = false;
  saving = false;
  automationSubscription: Subscription;
  mergeDealSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<MergeDealsComponent>,
    private dealService: DealsService,
    private automationService: AutomationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.automationSubscription && this.automationSubscription.unsubscribe();
    this.automationSubscription = this.automationService.automations$.subscribe(
      (res) => {
        this.automations = [...res];
      }
    );
    if (this.data && this.data.stages) {
      this.stages = this.data.stages;
    }
    if (this.data && this.data.contacts) {
      this.contacts = this.data.contacts;
    }
    if (this.data && this.data.deals) {
      this.deals = JSON.parse(JSON.stringify(this.data.deals));
      const primaryDeal = this.deals.find((e) => e._id);
      this.result = JSON.parse(JSON.stringify(primaryDeal));
      this.result.contacts = this.contacts;
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.automationSubscription && this.automationSubscription.unsubscribe();
    this.mergeDealSubscription && this.mergeDealSubscription.unsubscribe();
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
    this.result.primary_contact = contact;
  }

  getContactsList(): any[] {
    const contacts = this.result.contacts.map((e) => e._id);
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
    if (this.saving) return;
    if (this.newContact && this.newContact._id) {
      this.result.contacts.push(this.newContact);
      this.adding = false;
      this.newContact = null;
    }
  }

  cancelAddContactToDeal(): void {
    if (this.saving) return;
    this.newContact = null;
    this.adding = false;
  }

  removeContact(contact: any): void {
    if (this.saving) return;
    this.result.contacts = this.result.contacts.filter(
      (e) => e._id !== contact._id
    );
    if (this.result.primary_contact._id === contact._id) {
      this.result.primary_contact = this.result.contacts[0];
    }
  }

  getTitles(): any[] {
    const titles = [];
    for (const deal of this.deals) {
      if (titles.indexOf(deal.title) === -1) {
        titles.push(deal.title);
      }
    }
    return titles;
  }

  getStages(): any[] {
    const stageIds = [];
    for (const deal of this.deals) {
      if (stageIds.indexOf(deal.deal_stage) === -1) {
        stageIds.push(deal.deal_stage);
      }
    }
    const stages = this.stages.filter((e) => stageIds.indexOf(e._id) > -1);
    return stages;
  }

  hasAutomation(): boolean {
    for (const deal of this.deals) {
      if (deal.automation_id) {
        return true;
      }
    }
    return false;
  }

  getAutomations(): Automation[] {
    const automationIds = [];
    for (const deal of this.deals) {
      if (
        deal.automation_id &&
        automationIds.indexOf(deal.automation_id + '') === -1
      ) {
        automationIds.push(deal.automation_id + '');
      }
    }
    const automations = this.automations.filter(
      (e) => automationIds.indexOf(e._id) > -1
    );
    return automations;
  }

  save(): void {
    this.saving = true;
    if (this.hasAutomation() && this.result.automation_id) {
      for (const deal of this.deals) {
        if (
          deal.automation_id &&
          deal.automation_id === this.result.automation_id
        ) {
          const id = deal.id + '';
          deal.id = deal._id = this.result.id + '';
          this.result.id = this.result._id = id;
        }
      }
    }
    const remainDeals = this.deals.filter(
      (deal) => deal.id !== this.result.id || !deal._id
    );
    const csvDeal = this.deals.find((e) => !e._id);
    const deleteDeals = remainDeals.map((e) => e.id);

    const contacts = this.result.contacts.map((e) => e._id);
    const primary_contact = this.result.primary_contact._id;
    const data = {
      title: this.result.title,
      deal_stage: this.result.deal_stage,
      contacts,
      primary_contact
    };
    forkJoin({
      deletion: this.dealService.bulkDelete({ deals: deleteDeals }),
      update: this.dealService.editDeal(this.result.id, data)
    }).subscribe((res) => {
      const deletion = res.deletion;
      const update = res.update;
      if (deletion && update) {
        this.saving = false;
        const deletions = deletion || [];
        if (csvDeal) {
          deletions.push(csvDeal.id);
        }
        this.dialogRef.close({
          merge: this.result,
          deletions
        });
      }
    });
  }

  cancel(): void {
    if (this.saving) return;
    this.dialogRef.close();
  }
}
