import { SspaService } from '../../services/sspa.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ContactService } from '@services/contact.service';
import {
  CONTACT_SORT_OPTIONS,
  STATUS,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { Subscription } from 'rxjs';
import { MatDrawer } from '@angular/material/sidenav';
import { ContactBulkComponent } from '@components/contact-bulk/contact-bulk.component';
import { SearchOption } from '@models/searchOption.model';
import { Contact, ContactActivity } from '@models/contact.model';
import { Router } from '@angular/router';
import { StoreService } from '@services/store.service';
import { UserService } from '@services/user.service';
import { DealsService } from '@services/deals.service';
import { HandlerService } from '@services/handler.service';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

@Component({
  selector: 'app-campaign-add-contact',
  templateUrl: './campaign-add-contact.component.html',
  styleUrls: ['./campaign-add-contact.component.scss']
})
export class CampaignAddContactComponent implements OnInit {
  STATUS = STATUS;
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  ACTIONS = [
    {
      spliter: true,
      label: 'Select all filtered',
      type: 'button',
      command: 'select',
      loading: false
    },
    {
      label: 'Deselect filtered',
      type: 'button',
      command: 'deselect',
      loading: false
    }
  ];
  NORMAL_COLUMNS = [
    'select',
    'contact_name',
    'contact_label',
    'activity',
    'contact_tags',
    'contact_email',
    'contact_phone',
    'contact_address'
  ];
  SORTED_COLUMNS = [
    'select',
    'contact_name',
    'contact_label',
    'activity',
    'activity_added',
    'contact_tags',
    'contact_email',
    'contact_phone',
    'contact_address'
  ];
  DISPLAY_COLUMNS = this.NORMAL_COLUMNS;
  SORT_TYPES = [
    { id: 'alpha_up', label: 'Alphabetical Z-A' },
    { id: 'alpha_down', label: 'Alphabetical A-Z' },
    { id: 'last_added', label: 'Last added' },
    { id: 'last_activity', label: 'Last activity' }
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];

  userId = '';
  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('editPanel') editPanel: ContactBulkComponent;
  panelType = '';

  sortType = this.SORT_TYPES[1];
  pageSize = this.PAGE_COUNTS[3];
  searchOption: SearchOption = new SearchOption();

  total = 0;
  contacts = [];
  pageContacts: ContactActivity[] = [];
  loadingContacts = STATUS.NONE;
  page = 1;
  loadSubscription: Subscription;

  selection: Contact[] = [];
  selecting = false;
  selectSource = '';
  selectSubscription: Subscription;

  // Variables for Label Update
  profileSubscription: Subscription;

  adding = false;

  constructor(
    public router: Router,
    public storeService: StoreService,
    public contactService: ContactService,
    public userService: UserService,
    public dealsService: DealsService,
    private dialog: MatDialog,
    private handlerService: HandlerService,
    private toast: ToastrService,
    private dialogRef: MatDialogRef<CampaignAddContactComponent>,
    public sspaService: SspaService
  ) { }

  ngOnInit(): void {
    this.loadContacts();
  }

  changeSearchOption(option: SearchOption): void {
    this.searchOption = option;
    this.loadContacts();
  }

  changeSearchStr(str: string): void {
    this.searchOption.searchStr = str;
    this.loadContacts();
  }

  clearSearchStr(): void {
    this.searchOption.searchStr = '';
    this.loadContacts();
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection = _.differenceBy(this.selection, this.pageContacts, '_id');
      return;
    }
    this.pageContacts.forEach((e) => {
      if (!this.isSelected(e)) {
        this.selection.push(e.mainInfo);
      }
    });
  }

  toggle(contact: ContactActivity): void {
    const selectedContact = contact.mainInfo;
    const toggledAllSelection = _.xorBy(
      this.selection,
      [selectedContact],
      '_id'
    );
    this.selection = toggledAllSelection;
  }

  isSelected(contact: ContactActivity): boolean {
    const selectedContact = contact.mainInfo;
    const index = _.findIndex(this.selection, (item) => item._id === selectedContact._id);
    if (index > -1) {
      return true;
    }else{
      return false;
    }
  }

  isAllSelected(): boolean {
    const currentSelection = _.intersectionBy(
      this.selection,
      this.pageContacts,
      '_id'
    );
    return currentSelection.length === this.pageContacts.length;
  }

  changeSort(type: any): void {
    this.sortType = type;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    if (this.searchOption.isEmpty()) {
      this.loadingContacts = STATUS.REQUEST;
      this.loadSubscription = this.contactService
        .loadImpl2(
          this.page,
          this.pageSize.id,
          CONTACT_SORT_OPTIONS[this.sortType.id]
        )
        .subscribe((res) => {
          this.loadingContacts = STATUS.SUCCESS;
          if (res && res['contacts']) {
            this.contacts = res['contacts'];
            this.total = res['total'];
            this.pageContacts = this.contacts;
          }
        });
    } else {
      this.loadingContacts = STATUS.REQUEST;
      this.contactService
        .advancedSearchImpl2(
          this.searchOption,
          this.page,
          this.pageSize.id,
          CONTACT_SORT_OPTIONS[this.sortType.id]
        )
        .subscribe((res) => {
          this.loadingContacts = STATUS.SUCCESS;
          if (res && res['contacts']) {
            this.contacts = res['contacts'];
            this.total = res['total'];
            this.pageContacts = this.contacts;
          }
        });
    }
  }

  doAction(event: any): void {
    if (event.command === 'select') {
      this.selectAll();
      return;
    } else if (event.command === 'deselect') {
      this.selection = [];
      return;
    }
  }
  selectAll(source = false): void {
    if (source) {
      this.selectSource = 'header';
      this.loadingContacts = STATUS.REQUEST;
    } else {
      this.selectSource = 'page';
    }
    if (this.searchOption.isEmpty()) {
      // Load All contacts
      this.selecting = true;
      this.contactService.selectAllUserContacts().subscribe((res) => {
        this.selecting = false;
        this.loadingContacts = STATUS.SUCCESS;
        if (res && res.length) {
          this.selection = _.unionBy(this.selection, res, '_id');
        }
      });
    } else {
      // Select one by one from filtered
      this.contactService
        .advancedSelectAllUserContacts(this.searchOption)
        .subscribe((res) => {
          this.loadingContacts = STATUS.SUCCESS;
          this.selection = res;
        });
    }
  }
  deselectAll(): void {
    this.selection = [];
  }
  loadContacts(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    if (this.searchOption.isEmpty()) {
      this.loadingContacts = STATUS.REQUEST;
      this.loadSubscription = this.contactService
        .loadImpl2(1, this.pageSize.id, CONTACT_SORT_OPTIONS[this.sortType.id])
        .subscribe((res) => {
          this.loadingContacts = STATUS.SUCCESS;
          if (res && res['contacts']) {
            this.contacts = res['contacts'];
            this.total = res['total'];
            this.pageContacts = this.contacts;
          }
        });
    } else {
      this.loadingContacts = STATUS.REQUEST;
      this.loadSubscription = this.contactService
        .advancedSearchImpl2(
          this.searchOption,
          1,
          this.pageSize.id,
          CONTACT_SORT_OPTIONS[this.sortType.id]
        )
        .subscribe((res) => {
          this.loadingContacts = STATUS.SUCCESS;
          if (res) {
            this.contacts = res['contacts'];
            this.total = res['total'];
            this.pageContacts = this.contacts;
          }
        });
    }
  }

  changeContactPage(page: number): void {
    this.page = page;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    if (this.searchOption.isEmpty()) {
      this.loadingContacts = STATUS.REQUEST;
      this.loadSubscription = this.contactService
        .loadImpl2(
          this.page,
          this.pageSize.id,
          CONTACT_SORT_OPTIONS[this.sortType.id]
        )
        .subscribe((res) => {
          this.loadingContacts = STATUS.SUCCESS;
          if (res && res['contacts']) {
            this.contacts = res['contacts'];
            this.total = res['total'];
            this.pageContacts = this.contacts;
          }
        });
    } else {
      this.loadingContacts = STATUS.REQUEST;
      this.loadSubscription = this.contactService
        .advancedSearchImpl2(
          this.searchOption,
          this.page,
          this.pageSize.id,
          CONTACT_SORT_OPTIONS[this.sortType.id]
        )
        .subscribe((res) => {
          this.loadingContacts = STATUS.SUCCESS;
          if (res && res['contacts']) {
            this.contacts = res['contacts'];
            this.total = res['total'];
            this.pageContacts = this.contacts;
          }
        });
    }
  }

  changePageSize(type): void {
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    if (currentSize < this.pageSize.id) {
      // If page size get bigger
      const loaded = this.page * currentSize;
      let newPage = Math.floor(loaded / this.pageSize.id);
      newPage = newPage > 0 ? newPage : 1;
      this.changeContactPage(newPage);
    } else {
      // if page size get smaller: TODO -> Set Selection and Page contacts
      if (this.searchOption.isEmpty()) {
        const skipped = (this.page - 1) * currentSize;
        const newPage = Math.floor(skipped / this.pageSize.id) + 1;
        this.changeContactPage(newPage);
      } else {
        this.changeContactPage(this.page);
      }
    }
  }

  addContacts(): void {
    this.dialogRef.close({ contacts: this.selection });
  }
}
