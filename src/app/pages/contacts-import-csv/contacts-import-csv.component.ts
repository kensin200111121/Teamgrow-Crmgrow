import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HandlerService } from '@services/handler.service';
import { Contact2I } from '@models/contact.model';
import { Contact2IGroup, DealGroup } from '@utils/data.types';
import { PageCanDeactivate } from '@variables/abstractors';
import { DealsService } from '@services/deals.service';
import { Subscription } from 'rxjs';
import _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { UploadImportedContactsComponent } from '@components/upload-imported-contacts/upload-imported-contacts.component';
import { DialogSettings } from '@constants/variable.constants';
import { generateDealArray } from '@utils/contact';
import { UserFeatureService } from '@app/services/user-features.service';
import { USER_FEATURES } from '@app/constants/feature.constants';
@Component({
  selector: 'app-contacts-import-csv',
  templateUrl: './contacts-import-csv.component.html',
  styleUrls: ['./contacts-import-csv.component.scss']
})
export class ContactsImportCsvComponent
  extends PageCanDeactivate
  implements OnInit
{
  saved: boolean;
  isReadFile = false;
  columns = [];
  lines = [];
  stages = [];

  step = 0;
  stepHistories: number[] = [];

  pcMatching = {}; // Property and Column matching relationship
  isDeal = false;
  duplicatedContacts: Contact2I[] = []; // duplicated contacts
  invalidContacts: Contact2I[] = []; // invalid contact is loaded from file & edited as valid contacts
  importedContacts: Contact2I[] = []; // valid contacts after matching the column
  contacts: Contact2I[] = []; // contacts after update invalid contacts
  csvContactGroups: Contact2IGroup[] = []; // Duplicated contact groups in csv file
  contactGroups: Contact2IGroup[] = []; // Duplicated contact groups between csv file and existing contacts
  contactsToUpload: Contact2I[] = []; // Contacts to upload (passed in duplication checking)
  selectedContacts: Contact2I[] = [];
  deals: any[] = [];
  dealGroups: DealGroup[] = [];
  failedDeals: any[] = [];
  loadStage = false;

  dealStageLoadSubscription: Subscription;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private handlerService: HandlerService,
    private dealsService: DealsService,
    private featureService: UserFeatureService
  ) {
    super();
    this.loadDealStage();
  }

  loadDealStage(): void {
    this.dealsService.easyLoadStage(
      true,
      this.dealsService.selectedPipeline.getValue()
    );
    this.dealStageLoadSubscription &&
      this.dealStageLoadSubscription.unsubscribe();
    this.dealStageLoadSubscription = this.dealsService.stages$.subscribe(
      (res) => {
        this.stages = [...res];
        if (this.stages.length === 0 && !this.loadStage) {
          this.loadStage = true;
          this.dealsService.easyLoadStage(
            true,
            this.dealsService.selectedPipeline.getValue()
          );
        }
      }
    );
  }

  ngOnInit(): void {
    this.isReadFile = false;
    if (this.handlerService.columns && this.handlerService.columns.length > 0) {
      this.columns = this.handlerService.columns;
      const isDeal = this.featureService.isEnableFeature(USER_FEATURES.DEAL);
      const isAutomation = this.featureService.isEnableFeature(
        USER_FEATURES.AUTOMATION
      );
      for (let i = this.columns.length - 1; i >= 0; i--) {
        switch (this.columns[i]) {
          case 'deal':
            if (!isDeal) this.columns.splice(i, 1);
            break;
          case 'automation_id':
            if (!isAutomation) this.columns.splice(i, 1);
            break;
        }
      }
      this.lines = this.handlerService.lines;
      this.step = 1;
      this.stepHistories.push(this.step);
    } else {
      this.router.navigate(['contacts/import-csv']);
    }
  }

  ngOnDestroy(): void {
    this.dealStageLoadSubscription &&
      this.dealStageLoadSubscription.unsubscribe();
  }

  onCompletedColumnMatching($event: any): void {
    this.invalidContacts = $event.invalidContacts; // invalid contacts after matching the column
    this.csvContactGroups = $event.csvContactGroups; // duplicated contact groups in csv file
    this.importedContacts = $event.contacts; // valid contacts in invalid step
    this.contacts = $event.contacts; // valid contacts in duplicate csv step
    this.contactsToUpload = $event.contacts; // valid contacts in review to upload step
    this.pcMatching = $event.pcMatching;
    const iPCMatching = _.invert(this.pcMatching);
    this.isDeal = Object.keys(iPCMatching).includes('deal');

    if (this.invalidContacts.length > 0) {
      this.step = 2;
    } else if (this.csvContactGroups.length > 0) {
      this.step = 3;
    } else {
      this.step = 4;
    }
    this.stepHistories.push(this.step);
  }

  onFixedInvalidContacts($event): void {
    this.contacts = $event.contacts; // valid contacts in duplicate csv step
    this.contactsToUpload = $event.contacts; // valid contacts in review upload
    this.csvContactGroups = $event.csvContactGroups; // duplicated contact groups in csv file

    if (this.csvContactGroups.length > 0) {
      this.step = 3;
    } else {
      this.step = 4;
    }
    this.stepHistories.push(this.step);
  }

  onResolvedDuplicatedContactsCsv($event: any): void {
    this.contactsToUpload = $event.contacts; // valid contacts in review to upload
    this.step = 4;
    this.stepHistories.push(this.step);
  }

  onUploadContacts($event: Contact2I[]): void {
    this.step = 8;
    this.selectedContacts = $event;
    this.dialog
      .open(UploadImportedContactsComponent, {
        ...DialogSettings.UPLOAD,
        data: {
          pcMatching: this.pcMatching,
          contacts: this.selectedContacts,
          stages: this.stages,
          isDeal: this.isDeal,
          mode: 'import'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.completed) {
          // importing csv succeed without duplicats and deal
          this.handlerService.clearImportCSVContact$();
          this.saved = true;
          this.router.navigate(['/contacts']);
        } else if (res.contactGroups && res.contactGroups.length > 0) {
          // some contacts are duplicated
          if (this.isDeal && this.stages.length) {
            this.deals = generateDealArray(
              res.succeedContacts,
              this.stages[0]._id
            );
          }
          this.contactGroups = res.contactGroups;
          this.saved = true;
          this.step = 5;
        } else if (res.deals && res.deals.length > 0) {
          // deal column matched
          this.deals = res.deals;
          this.step = 6;
          this.stepHistories.push(this.step);
        }
      });
  }

  onResolvedDuplicatedContacts(updatedContacts: any[]): void {
    if (this.stages.length && this.isDeal) {
      const deals = generateDealArray(updatedContacts, this.stages[0]._id);
      this.deals.push(...deals);
      this.step = 6;
      this.stepHistories.push(this.step);
    } else {
      this.handlerService.clearImportCSVContact$();
      this.saved = true;
      this.router.navigate(['/contacts']);
    }
  }

  onCreateDeals($event): void {
    this.step = 8;
    const deals = $event.deals;
    this.stages = $event.stages;
    this.dialog
      .open(UploadImportedContactsComponent, {
        ...DialogSettings.UPLOAD,
        data: {
          pcMatching: this.pcMatching,
          deals,
          stages: this.stages,
          mode: 'deal-creation'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.completed) {
          this.handlerService.clearImportCSVContact$();
          this.saved = true;
          this.router.navigate(['/contacts']);
        } else if (res.dealGroups && res.dealGroups.length > 0) {
          this.dealGroups = res.dealGroups;
          this.failedDeals = res.failedDeals;
          this.step = 7;
        }
      });
  }

  onResolvedDuplicatedDeals(dealGroups: DealGroup[]): void {
    const deals = [];
    dealGroups.forEach((group) => {
      const csvDeal = group.deals.find((e) => !e._id);
      if (csvDeal) {
        deals.push(csvDeal);
      }
    });
    this.dialog
      .open(UploadImportedContactsComponent, {
        ...DialogSettings.UPLOAD,
        data: {
          pcMatching: this.pcMatching,
          deals,
          stages: this.stages,
          mode: 'deal-conflict'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.completed) {
          this.handlerService.clearImportCSVContact$();
          this.saved = true;
          this.router.navigate(['/contacts']);
        }
      });
  }

  onCancel(): void {
    this.stepHistories = [];
    this.saved = true;
    this.router.navigate(['/contacts']);
  }

  onBack(): void {
    this.stepHistories.pop();
    this.step = this.stepHistories[this.stepHistories.length - 1];
  }
}
