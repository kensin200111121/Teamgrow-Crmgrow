import { USER_FEATURES } from '@app/constants/feature.constants';
import { SspaService } from '../../../services/sspa.service';
// Added by Sylla
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { Automation } from '@models/automation.model';
import { Contact2I } from '@models/contact.model';
import { contactHeaderOrder, formatValue } from '@utils/contact';
import { contactTablePropertiseMap } from '@utils/data';
import { DealsService } from '@app/services/deals.service';
@Component({
  selector: 'app-review-to-upload',
  templateUrl: './review-to-upload.component.html',
  styleUrls: ['./review-to-upload.component.scss']
})
export class ReviewToUploadComponent implements OnInit, AfterViewInit {
  readonly USER_FEATURES = USER_FEATURES;
  @Output() onPrev = new EventEmitter();
  @Output() onNext = new EventEmitter();

  @Input() contactsToUpload: Contact2I[] = [];
  @Input() pcMatching = {};

  selectedContactsToUpload: Contact2I[] = [];
  searchedContacts: Contact2I[] = [];
  contacts: Contact2I[] = [];
  automations = {};
  all_dealStage: string;
  dealStages = {};
  searchQuery = '';
  defaultPipeline: string;
  defaultPipelines = {};
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;
  properties = contactTablePropertiseMap;

  contactHeaderOrder = contactHeaderOrder;
  formatValue = formatValue;

  constructor(
    public sspaService: SspaService,
    private dealsService: DealsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchedContacts = this.contactsToUpload;
    if (this.searchedContacts.length > this.pageSize.id) {
      this.contacts = this.searchedContacts.slice(0, this.pageSize.id);
    } else {
      this.contacts = this.searchedContacts;
    }
  }

  ngOnChanges(change): void {
    if (change.contactsToUpload) {
      this.selectedContactsToUpload = change.contactsToUpload.currentValue.map(
        (e) => e
      );
    }
  }

  /**
   * callback on change the page
   * @param page: selected page
   */
  changePage(page: number): void {
    this.page = page;
    this.loadPageContacts();
  }

  /**
   * callback on change the page size
   * @param pageSize: selected page size
   */
  changePageSize(pageSize: any): void {
    this.pageSize = pageSize;
    this.page = 1;
    this.loadPageContacts();
  }

  /**
   * callback to load the contacts of the selected page
   */
  loadPageContacts(): void {
    this.contacts = [];
    const startIndex = (this.page - 1) * this.pageSize.id;
    const endIndex = startIndex + this.pageSize.id;
    this.contacts = this.searchedContacts.slice(startIndex, endIndex);
  }

  /**
   * callback on select the row
   * @param contact:
   */
  onCheck(contact: Contact2I): void {
    const index = this.selectedContactsToUpload.findIndex(
      (_contact) => _contact.id === contact.id
    );
    if (index > -1) {
      this.selectedContactsToUpload.splice(index, 1);
    } else {
      this.selectedContactsToUpload.push(contact);
    }
  }

  /**
   * callback on check all contacts
   * @returns
   */
  onCheckAllPage(): void {
    const isAllSelectedPage = this.isAllCheckedPage();

    for (const contact of this.contacts) {
      const index = this.selectedContactsToUpload.findIndex(
        (_contact) => _contact.id === contact.id
      );
      if (isAllSelectedPage) {
        this.selectedContactsToUpload.splice(index, 1);
      } else {
        if (index === -1) {
          this.selectedContactsToUpload.push(contact);
        }
      }
    }
  }

  onDeselect(): void {
    this.selectedContactsToUpload = [];
  }

  /**
   * callback on click the checkbox from table status bar
   */
  onCheckAll(): void {
    const isAllChecked = this.isAllChecked();
    if (isAllChecked) {
      this.selectedContactsToUpload = [];
    } else {
      this.searchedContacts.forEach((contact) => {
        const index = this.selectedContactsToUpload.findIndex(
          (_contact) => _contact.id === contact.id
        );
        if (index === -1) {
          this.selectedContactsToUpload.push(contact);
        }
      });
    }
  }

  isAllChecked(): boolean {
    return (
      this.searchedContacts.length > 0 &&
      this.selectedContactsToUpload.length >= this.searchedContacts.length
    );
  }

  /**
   * check the all contacts of the page are selected or not
   */
  isAllCheckedPage(): boolean {
    if (this.contacts.length === 0) {
      return false;
    }
    for (const contact of this.contacts) {
      if (this.selectedContactsToUpload.indexOf(contact) === -1) {
        return false;
      }
    }
    return true;
  }

  /**
   * check the contact is selected or not
   * @param contact
   */
  isChecked(contact: Contact2I): boolean {
    const index = this.selectedContactsToUpload.findIndex(
      (_contact) => _contact.id === contact.id
    );
    return index > -1;
  }

  /**
   * callback on change the search string
   * @param query: changed search string
   */
  onChangeQuery(query: string): void {
    const searchQuery = query ? query.toLowerCase() : '';
    this.searchedContacts = [];
    for (const contact of this.contactsToUpload) {
      const name = (contact.first_name || '') + (contact.last_name || '');
      if (name.toLowerCase().includes(searchQuery)) {
        this.searchedContacts.push(contact);
      }
    }
    this.loadPageContacts();
  }

  /**
   * callback on clear the search string
   */
  onClearQuery(): void {
    this.searchQuery = '';
    this.searchedContacts = this.contactsToUpload;
    this.loadPageContacts();
  }

  /**
   * callback on change automation from table header
   * @param $event: selected automation value
   */
  onChangeAutomationOnHeader(evt: Automation): void {
    for (const contact of this.contactsToUpload) {
      const index = this.contactsToUpload.indexOf(contact);
      contact['automation_id'] = evt ? evt._id : null;
      this.contactsToUpload[index] = contact;
      this.automations[contact.id] = evt ? evt._id : null;
    }
    this.onChangeQuery(this.searchQuery);
  }
  onChangeDealStageHeader(evt: any): void {
    for (const contact of this.contactsToUpload) {
      const index = this.contactsToUpload.indexOf(contact);
      contact['dealStage_id'] = evt;
      this.contactsToUpload[index] = contact;
      this.dealStages[contact.id] = evt;
    }
    this.all_dealStage = evt;
  }
  onChangePipelineHeader(evt: any): void {
    for (const contact of this.contactsToUpload) {
      this.defaultPipelines[contact.id] = evt;
    }
    this.defaultPipeline = evt;
  }
  /**
   * callback on change automation from table body
   * @params $event, contact
   */
  onChangeAutomation(evt: Automation, contact: Contact2I): void {
    const index = this.contactsToUpload.indexOf(contact);
    contact['automation_id'] = evt ? evt._id : null;
    this.contactsToUpload[index] = contact;
    this.automations[contact.id] = evt ? evt._id : null;
    this.onChangeQuery(this.searchQuery);
  }
  onChangeDealStage(evt: any, contact: Contact2I): void {
    const index = this.contactsToUpload.indexOf(contact);
    contact['dealStage_id'] = evt;
    this.contactsToUpload[index] = contact;
    this.dealStages[contact.id] = evt;
  }

  onAddAutomation(element: HTMLElement): void {
    element.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * callback on cancel the upload
   */
  onBack(): void {
    this.onPrev.emit();
  }

  /**
   * callback on upload the imported contacts
   */
  onUpload(): void {
    this.onNext.emit(this.selectedContactsToUpload);
  }
  ngAfterViewInit() {
    this.initializeValues();
    this.cdr.detectChanges();
  }
  initializeValues() {
    const pipeline = this.dealsService.selectedPipeline.getValue();
    this.defaultPipeline = pipeline?._id;
    for (const contact of this.contactsToUpload) {
      this.defaultPipelines[contact.id] = pipeline?._id;
    }
  }
}
// End by Sylla
