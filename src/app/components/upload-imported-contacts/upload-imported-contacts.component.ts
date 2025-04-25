import { SspaService } from '../../services/sspa.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { FileUploader } from 'ng2-file-upload';
import { saveAs } from 'file-saver';
import { Papa } from 'ngx-papaparse';
import _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { Contact2I } from '@models/contact.model';
import { HandlerService } from '@services/handler.service';
import { UserService } from '@services/user.service';
import { LabelService } from '@services/label.service';
import {
  checkDuplicatedContact,
  formatContact,
  generateDealArray,
  getContact2IObj
} from '@utils/contact';
import { contactTablePropertiseMap } from '@utils/data';
import { Contact2IGroup, DealGroup } from '@utils/data.types';
import { DealsService } from '@services/deals.service';
import { FieldTypeEnum } from '@utils/enum';
import { ArrayObject } from 'ngx-papaparse/lib/interfaces/unparse-data';
import { environment } from '@environments/environment';
import { OnboardingService } from '@app/services/onboarding-services';
@Component({
  selector: 'app-upload-imported-contacts',
  templateUrl: './upload-imported-contacts.component.html',
  styleUrls: ['./upload-imported-contacts.component.scss']
})
export class UploadImportedContactsComponent implements OnInit {
  mode = '';
  step = 0; // 1: create deals, 2: upload contacts, 3: exceed contacts, 4: duplicated contacts, 5: imported success, 6: upload duplicated contacts
  uploadContactPercent = 0;
  uploadedContacts = 0;
  overallContacts = 0;
  duplicatedContacts = 0;

  createDealPercent = 0;
  createdDeals = 0;
  overallDeals = 0;

  updateContactPercent = 0;
  updatedContacts = 0;
  overallUpdateContacts = 0;

  contactsToUpload: Contact2I[] = [];
  chunkContacts: Contact2I[] = [];
  deals: any[] = [];
  failedDeals: any[] = [];
  dealGroups: DealGroup[] = [];

  failedContacts: Contact2I[] = [];
  exceedContacts: Contact2I[] = [];
  succeedContacts: Contact2I[] = [];

  contactGroups: Contact2IGroup[] = [];
  chunkGroups: Contact2IGroup[] = [];
  updatedContactsIds: string[] = [];

  pcMatching = {};
  isDeal = false;
  stages: any[] = [];
  force = false;

  isUploading = false;
  isCheckingDuplicates = false;

  phoneUtil = PhoneNumberUtil.getInstance();
  selectedCountry = {
    areaCodes: undefined,
    dialCode: '',
    iso2: '',
    name: '',
    placeholder: '',
    priority: 0
  };
  additionalFields: any[] = [];

  public uploader: FileUploader = new FileUploader({
    url: environment.api + 'contact/import-csv-chunk',
    authToken: this.userService.getToken(),
    itemAlias: 'csv'
  });

  public dpUploader: FileUploader = new FileUploader({
    url: environment.api + 'contact/duplicate-csv',
    authToken: this.userService.getToken(),
    itemAlias: 'csv'
  });

  CHUNK_SIZE = 50;
  ePSize = 10;
  ePage = 1;
  isSspa = environment.isSspa;
  constructor(
    private dialogRef: MatDialogRef<UploadImportedContactsComponent>,
    private dealsService: DealsService,
    private userService: UserService,
    private handlerService: HandlerService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toastr: ToastrService,
    private papa: Papa,
    public sspaService: SspaService,
    private labelService: LabelService,
    private onboardingService: OnboardingService
  ) {
    if (this.data && this.data.mode) {
      this.mode = this.data.mode;
      if (this.mode === 'deal-creation') {
        this.force = false;
      } else if (this.mode === 'deal-conflict') {
        this.force = true;
      }
    }
    if (this.data && this.data.contacts) {
      this.contactsToUpload = JSON.parse(JSON.stringify(this.data.contacts));
      this.overallContacts = this.contactsToUpload.length;
    }
    if (this.data && this.data.contactGroups) {
      this.contactGroups = this.data.contactGroups;
      this.overallUpdateContacts = this.contactGroups.length;
    }
    if (this.data && this.data.pcMatching) {
      this.pcMatching = this.data.pcMatching;
    }
    if (this.data && this.data.isDeal) {
      this.isDeal = this.data.isDeal;
    }
    if (this.data && this.data.deals) {
      this.deals = this.data.deals;
      this.overallDeals = this.deals.length;
    }
    if (this.data && this.data.stages) {
      this.stages = this.data.stages;
    }
    this.userService.garbage$.subscribe((garbage) => {
      this.additionalFields = garbage.additional_fields.map((e) => e);
    });
  }

  ngOnInit(): void {
    if (this.mode === 'import') {
      // initialize the file uploader and import csv contacts
      this.initImportContacts();
      if (this.dealGroups.length > 0) {
        this.step = 1;
        this.createChunkDeals();
      } else {
        this.step = 2;
        this.chunkContacts = this.contactsToUpload
          .splice(0, this.CHUNK_SIZE)
          .map((e) => formatContact(e));
        setTimeout(() => {
          this.uploadChunkContacts();
        }, 1000);
      }
    } else if (this.mode === 'update') {
      // initialize the file uploader and update the duplicated contacts
      this.initDuplicatedContacts();
      this.step = 6;
      this.chunkGroups = this.contactGroups.splice(0, this.CHUNK_SIZE);
      setTimeout(() => {
        this.updateChunkContacts();
      }, 1000);
    } else if (this.mode === 'deal-creation' || this.mode === 'deal-conflict') {
      // create deals with imported & updated contacts
      this.step = 1;
      this.createChunkDeals();
    }
  }

  initImportContacts(): void {
    this.selectedCountry = this.handlerService.selectedCountry;
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
      if (this.uploader.queue.length > 1) {
        this.uploader.queue.splice(0, 1);
      }
    };

    this.uploader.onCompleteItem = (
      item: any,
      response: any,
      status: any,
      headers: any
    ) => {
      response = JSON.parse(response);
      if (response.status) {
        this.onboardingService.completeOnboardingStep('contacts');
        this.isUploading = false;

        const succeed = response.succeed_contacts || [];
        const duplicated = response.duplicate_contacts || [];
        const exceed = response.exceed_contacts || [];

        if (succeed && succeed.length) {
          this.succeedContacts.push(...succeed);
        }

        this.uploadContactPercent = Math.ceil(
          (1 - this.contactsToUpload.length / this.overallContacts) * 100
        );
        const duplicatedIds = (duplicated || []).map((d) => d.id);
        const duplicatedCount = this.chunkContacts.filter(
          (c) => duplicatedIds.indexOf(c.id) > -1
        ).length;
        this.duplicatedContacts += duplicatedCount;
        this.uploadedContacts +=
          this.chunkContacts.length - duplicatedCount - exceed.length;
        // check if the contact has date additional fields, reformat the value to `new Date()`
        if (duplicated && duplicated.length) {
          duplicated.forEach((e) => {
            const origin = { ...e };
            const contact = getContact2IObj(
              origin,
              e,
              this.handlerService.selectedCountry
            );
            if (e['automation_id']) {
              contact['automation_id'] = e['automation_id'];
            }
            this.additionalFields.forEach((field) => {
              const value = contact[field.name];
              if (value && value !== '' && field.type === FieldTypeEnum.DATE) {
                contact[field.name] = new Date(value);
              }
            });
            this.failedContacts.push(contact);
          });
        }
        if (exceed.length) {
          // Stop the uploading
          // fill excceed contacts with rest contacts
          exceed.forEach((e) => {
            this.exceedContacts.push(new Contact2I().deserialize(e));
          });
          this.exceedContacts = [
            ...this.exceedContacts,
            ...this.contactsToUpload
          ];
          this.step = 3;
          return;
        }

        if (this.contactsToUpload.length > 0) {
          // Upload next chunk
          this.chunkContacts = this.contactsToUpload.splice(0, this.CHUNK_SIZE);
          this.uploadChunkContacts();
        } else {
          this.isUploading = false;
          // complete the first import
          // 1: Exceed Data checking
          // 2: Failed Data checking
          if (this.exceedContacts.length) {
            this.step = 3;
            return;
          } else if (this.failedContacts.length > 0) {
            // Rechecking the duplication with db contacts and csv contacts
            this.step = 4;
            return;
          }
          // 3: completed successfully
          if (!this.failedContacts.length && !this.exceedContacts.length) {
            this.handlerService.bulkContactAdd$();
            this.step = 5;
          }
        }
      } else if (response.error === 'max_exceed') {
        this.isUploading = false;
        // exceed contacts
        this.exceedContacts = [
          ...this.exceedContacts,
          ...this.chunkContacts,
          ...this.contactsToUpload
        ];
        this.step = 3;
      } else {
        this.toastr.error(response.error);
        this.dialogRef.close();
      }
    };
  }

  initDuplicatedContacts(): void {
    this.dpUploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
      if (this.dpUploader.queue.length > 1) {
        this.dpUploader.queue.splice(0, 1);
      }
    };

    this.dpUploader.onCompleteItem = (
      item: any,
      response: any,
      status: any,
      headers: any
    ) => {
      this.isUploading = false;
      response = JSON.parse(response);
      if (response.status) {
        const update = response.updates || [];
        this.updatedContactsIds.push(...update);

        this.updateContactPercent = Math.ceil(
          (1 - this.contactGroups.length / this.overallUpdateContacts) * 100
        );
        this.updatedContacts += update.length;

        if (this.contactGroups.length > 0) {
          // Upload next chunk
          this.chunkGroups = this.contactGroups.splice(0, this.CHUNK_SIZE);
          this.updateChunkContacts();
        } else {
          if (this.updatedContactsIds.length > 0) {
            this.handlerService.bulkContactAdd$();
          }
          setTimeout(() => {
            this.dialogRef.close({
              completed: true,
              ids: this.updatedContactsIds
            });
          }, 1000);
        }
      } else {
        this.toastr.error(response.error);
        this.dialogRef.close({
          completed: true,
          ids: []
        });
      }
    };
  }

  uploadChunkContacts(): void {
    for (const key in contactTablePropertiseMap) {
      if (
        key === 'notes' ||
        key === 'tags' ||
        key === 'emails' ||
        key === 'phones'
      ) {
        this.chunkContacts[0][key] = this.chunkContacts[0][key] || [];
      } else {
        this.chunkContacts[0][key] = this.chunkContacts[0][key] || '';
      }
    }

    const data: ArrayObject = JSON.parse(JSON.stringify(this.chunkContacts));
    const dataText = this.papa.unparse(data);

    let file;
    try {
      file = new File([dataText], 'upload-chunk.csv');
    } catch {
      const blob = new Blob([dataText]);
      Object.assign(blob, {});
      file = blob as File;
    }
    this.uploader.addToQueue([file]);
    this.uploader.queue[0].withCredentials = false;
    this.uploader.uploadAll();
    this.isUploading = true;
  }

  updateChunkContacts(): void {
    const chunkContacts = this.chunkGroups.map((group) => {
      const result = formatContact(group.result);
      if (result['automation_id']) {
        const contact = group.contacts.find((e) => e.id === result.id);
        if (
          contact['automation_id'] &&
          contact['automation_id'] === result['automation_id']
        ) {
          result['automation_id'] = '';
        }
      }
      return result;
    });
    for (const key in contactTablePropertiseMap) {
      if (key === 'notes' || key === 'tags') {
        chunkContacts[0][key] = chunkContacts[0][key] || [];
      } else {
        chunkContacts[0][key] = chunkContacts[0][key] || '';
      }
    }

    const data: ArrayObject = JSON.parse(JSON.stringify(chunkContacts));
    const dataText = this.papa.unparse(data);

    let file;
    try {
      file = new File([dataText], 'duplicate.csv');
    } catch {
      const blob = new Blob([dataText]);
      Object.assign(blob, {});
      file = blob as File;
    }
    this.dpUploader.addToQueue([file]);
    this.dpUploader.queue[0].withCredentials = false;
    this.dpUploader.uploadAll();
    this.isUploading = true;
  }

  createChunkDeals(): void {
    const deals = this.deals.slice(0, this.CHUNK_SIZE);
    const stages = this.stages.map((e) => e._id);
    const data = { deals, stages, force: this.force };
    this.dealsService.bulkCreateCSV(data).subscribe((res) => {
      if (res) {
        if (res.failed && res.failed.length) {
          res.failed.forEach((e) => {
            const deals = e.map((item) => {
              if (item._id) {
                item.id = item._id;
              }
              return item;
            });
            this.failedDeals.push(...deals);
            const group: DealGroup = {
              deals: deals,
              selection: [],
              unique_contacts: [],
              saving: false,
              completed: false
            };
            this.dealGroups.push(group);
          });
          this.createdDeals += this.deals.length - res.failed.length;
        } else {
          this.createdDeals += this.deals.length;
        }
        this.createDealPercent = Math.ceil(
          (this.createdDeals / this.overallDeals) * 100
        );
        this.deals = this.deals.slice(this.CHUNK_SIZE);
        if (this.deals.length > 0) {
          this.createChunkDeals();
        } else {
          this.step = 7;
        }
      }
    });
  }

  closeExceedContacts(): void {
    if (this.failedContacts.length > 0) {
      this.step = 4;
    } else {
      this.step = 5;
    }
  }

  closeReviewDuplication(): void {
    this.step = 5;
  }

  changeExceedPage(page: number): void {
    this.ePage = page;
  }

  confirmDuplicates(): void {
    this.isCheckingDuplicates = true;
    const response = checkDuplicatedContact(this.failedContacts);
    this.isCheckingDuplicates = false;
    this.dialogRef.close({
      completed: false,
      succeedContacts: this.succeedContacts,
      contactGroups: response.groups
    });
  }

  nextDeal(): boolean {
    const dealContact = this.succeedContacts.find(
      (e) => e.deal && e.deal !== ''
    );
    return this.isDeal && dealContact !== null;
  }

  moveToDealCreation(): void {
    if (this.stages.length === 0)
      this.toastr.error('The stage does not exist.');
    else {
      const deals = generateDealArray(this.succeedContacts, this.stages[0]._id);
      this.dialogRef.close({ deals, completed: false });
    }
  }

  moveToDealConflict(): void {
    this.failedDeals = _.uniqBy(this.failedDeals, 'id');
    this.dialogRef.close({
      dealGroups: this.dealGroups,
      failedDeals: this.failedDeals
    });
  }

  back(): void {
    this.labelService.loadLabels();
    this.dialogRef.close({ completed: true });
  }

  downloadFailed(): void {
    const failed = this.failedContacts.filter((e) => !e._id);
    this.downloadCSV(failed, 'crmgrow Import Failed(with contacts)');
  }

  downloadExceed(): void {
    this.downloadCSV(
      this.exceedContacts,
      'crmgrow Import Exceed(with contacts)'
    );
  }

  downloadCSV(contacts: Contact2I[], fileName: string): void {
    for (const key in contactTablePropertiseMap) {
      if (key === 'notes' || key === 'tags') {
        contacts[0][key] = contacts[0][key] || [];
      } else {
        contacts[0][key] = contacts[0][key] || '';
      }
    }

    const data: ArrayObject = JSON.parse(JSON.stringify(contacts));
    const csvText = this.papa.unparse(data);

    const blob = new Blob([csvText], { type: 'text/csv' });
    saveAs(blob, fileName + '.csv');
  }
}
