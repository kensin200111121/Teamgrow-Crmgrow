import { SspaService } from '../../services/sspa.service';
import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BulkActions,
  DialogSettings,
  STATUS,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { Contact, ContactActivity } from '@models/contact.model';
import { ContactService } from '@services/contact.service';
import { StoreService } from '@services/store.service';
import { SearchOption } from '@models/searchOption.model';
import { UserService } from '@services/user.service';
import * as _ from 'lodash';
import { saveAs } from 'file-saver';
import { MatDrawer } from '@angular/material/sidenav';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ContactBulkComponent } from '@components/contact-bulk/contact-bulk.component';
import { NoteCreateComponent } from '@components/note-create/note-create.component';
import { TaskCreateComponent } from '@components/task-create/task-create.component';
import { HandlerService } from '@services/handler.service';
import { ContactAssignAutomationComponent } from '@components/contact-assign-automation/contact-assign-automation.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { SendEmailComponent } from '@components/send-email/send-email.component';
import { NotifyComponent } from '@components/notify/notify.component';
import { Team } from '@models/team.model';
import { TeamService } from '@services/team.service';
import { TeamContactShareComponent } from '@components/team-contact-share/team-contact-share.component';
import { environment } from '@environments/environment';
import { User } from '@models/user.model';
import { StopShareContactComponent } from '@components/stop-share-contact/stop-share-contact.component';
import { JSONParser } from '@app/utils/functions';
import { TeamMemberProfileComponent } from '@app/components/team-member-profile/team-member-profile.component';

@Component({
  selector: 'app-team-share-contact',
  templateUrl: './team-share-contact.component.html',
  styleUrls: ['./team-share-contact.component.scss']
})
export class TeamShareContactComponent implements OnInit, OnChanges {
  STATUS = STATUS;
  ACTIONS = BulkActions.TeamContacts;
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  DISPLAY_COLUMNS = [
    'select',
    'contact_name',
    'contact_label',
    'activity',
    'contact_tags',
    'contact_email',
    'contact_phone',
    'contact_address',
    'shared_with',
    'share-action'
  ];
  SORT_TYPES = [
    { id: 'alpha_up', label: 'Alphabetical Z-A' },
    { id: 'alpha_down', label: 'Alphabetical A-Z' },
    { id: 'last_added', label: 'Last added' },
    { id: 'last_active', label: 'Last activity' }
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];

  @Input('team') team: Team;
  @Input('role') role: string;
  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('editPanel') editPanel: ContactBulkComponent;
  panelType = '';

  sortType = this.SORT_TYPES[1];
  pageSize = this.PAGE_COUNTS[0];
  page = 1;
  searchOption: SearchOption = new SearchOption();
  searchStr = '';

  selecting = false;
  selectSubscription: Subscription;
  selectSource = '';
  selection: Contact[] = [];
  pageSelection: Contact[] = [];
  pageContacts: ContactActivity[] = [];

  // Variables for Label Update
  isUpdating = false;
  updateSubscription: Subscription;

  profileSubscription: Subscription;
  loadSubscription: Subscription;
  searchSubscription: Subscription;
  loading = false;
  contacts: Contact[] = [];
  contactCount = 0;
  userId = '';
  paginationLoading = false;
  loadingContact = false;
  loadContactSubscription: Subscription;
  detailContacts = [];
  siteUrl = environment.front;

  isShareWith = false;
  isShareBy = false;
  teamMembers: User[] = [];
  selectedMembers: User[] = [];

  disableActions = [];
  isPackageGroupEmail = true;
  isPackageAutomation = true;

  stopShareContactSubscription: Subscription;
  changeSearchStr = new Subject<string>();
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    public storeService: StoreService,
    public contactService: ContactService,
    public userService: UserService,
    private handlerService: HandlerService,
    private dialog: MatDialog,
    public teamService: TeamService,
    public sspaService: SspaService
  ) {
    this.changeSearchStr
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        if (!this.searchStr) {
          this.changePage(1);
          return;
        }
        const searchStr = {
          search: this.searchStr,
          team: this.team._id
        };
        this.searchSubscription && this.searchSubscription.unsubscribe();
        this.searchSubscription = this.teamService
          .searchContact(searchStr)
          .subscribe((res) => {
            if (res) {
              this.pageContacts = [];
              for (const contact of res['contacts']) {
                this.pageContacts.push(
                  new ContactActivity().deserialize(contact)
                );
              }
              this.contactCount = res['contacts'].length;
            }
          });
        this.page = 1;
      });
  }

  ngOnDestroy(): void {
    this.handlerService.pageName.next('');
  }

  ngOnInit(): void {
    const pageSize = localStorage.getCrmItem('teamContactbListPageSize');
    if (pageSize) this.pageSize = JSONParser(pageSize);
    else
      localStorage.setCrmItem(
        'teamContactbListPageSize',
        JSON.stringify(this.pageSize)
      );

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.userId = res._id;
      this.isPackageAutomation = res.automation_info?.is_enabled;
      this.isPackageGroupEmail = res.email_info?.mass_enable;
      this.disableActions = [];
      if (!this.isPackageGroupEmail) {
        this.disableActions.push({
          label: 'Send email',
          type: 'button',
          icon: 'i-message',
          command: 'message',
          loading: false
        });
      }
      if (!this.isPackageAutomation) {
        this.disableActions.push({
          label: 'New automation',
          type: 'button',
          icon: 'i-automation',
          command: 'automation',
          loading: false
        });
      }
    });

    this.handlerService.pageName.next('contacts');
    this.loadContact(0);

    this.pageSelection = [];
    this.selection = [];

    for (const owner of this.team.owner) {
      this.teamMembers.push(new User().deserialize(owner));
    }
    for (const member of this.team.members) {
      this.teamMembers.push(new User().deserialize(member));
    }
  }

  loadContact(page: number): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    const data = {
      team: this.team._id,
      count: this.pageSize.id,
      skip: page
    };

    this.teamService.loadSharedContacts(data);
    this.storeService.sharedContacts$.subscribe((res) => {
      if (res) {
        this.loading = false;
        this.pageContacts = res;
        this.contactCount = this.teamService.sharedContactsTotal.getValue();
      }
    });
  }

  ngOnChanges(changes): void {
    // if (changes.contacts && changes.contacts.currentValue) {
    //   this.pageContacts = [...changes.contacts.currentValue];
    // }
  }
  /**
   * Load the contacts: Advanced Search, Normal Search, API Call
   */
  load(): void {
    this.page = 1;
  }
  /**
   * Load the page contacts
   * @param page : Page Number to load
   */
  changePage(page: number): void {
    this.page = page;
    // Normal Load by Page
    let skip = (page - 1) * this.pageSize.id;
    skip = skip < 0 ? 0 : skip;

    let sort;

    if (this.sortType.id === this.SORT_TYPES[0].id) {
      sort = { first_name: -1 };
    } else if (this.sortType.id === this.SORT_TYPES[1].id) {
      sort = { first_name: 1 };
    } else if (this.sortType.id === this.SORT_TYPES[2].id) {
      sort = { created_at: -1 };
    } else if (this.sortType.id === this.SORT_TYPES[3].id) {
      sort = { updated_at: -1 };
    }

    if (this.searchStr === '') {
      this.paginationLoading = true;
      const data = {
        team: this.team._id,
        count: this.pageSize.id,
        skip,
        sort
      };
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.teamService.loadSharedContacts(data);
      this.storeService.sharedContacts$.subscribe((res) => {
        this.paginationLoading = false;
        if (res) {
          this.pageContacts = res;
          this.contactCount = this.teamService.sharedContactsTotal.getValue();
          this.pageSelection = _.intersectionBy(
            this.selection,
            this.pageContacts,
            '_id'
          );
        }
      });
    }
  }
  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
    if (this.pageSize.id === type.id) return;
    this.pageSize = type;
    localStorage.setCrmItem(
      'teamContactbListPageSize',
      JSON.stringify(this.pageSize)
    );
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    // Check with the Prev Page Size
    if (currentSize < this.pageSize.id) {
      // If page size get bigger
      const loaded = this.page * currentSize;
      let newPage = Math.floor(loaded / this.pageSize.id);
      newPage = newPage > 0 ? newPage : 1;
      this.changePage(newPage);
    } else {
      // if page size get smaller: TODO -> Set Selection and Page contacts
      const skipped = (this.page - 1) * currentSize;
      const newPage = Math.floor(skipped / this.pageSize.id) + 1;
      this.changePage(newPage);
    }
  }
  /**
   * Change the sort column and dir
   * @param type: Sort Type
   */
  changeSort(type: any): void {
    this.sortType = type;

    let sort;

    if (this.sortType.id === this.SORT_TYPES[0].id) {
      sort = { first_name: -1 };
    } else if (this.sortType.id === this.SORT_TYPES[1].id) {
      sort = { first_name: 1 };
    } else if (this.sortType.id === this.SORT_TYPES[2].id) {
      sort = { created_at: -1 };
    } else if (this.sortType.id === this.SORT_TYPES[3].id) {
      sort = { updated_at: -1 };
    }

    const data = {
      team: this.team._id,
      count: this.pageSize.id,
      skip: 0,
      sort
    };
    this.teamService.loadSharedContacts(data);
    this.storeService.sharedContacts$.subscribe((res) => {
      this.paginationLoading = false;
      if (res) {
        this.pageContacts = res;
        this.contactCount = this.teamService.sharedContactsTotal.getValue();
        this.pageSelection = _.intersectionBy(
          this.selection,
          this.pageContacts,
          '_id'
        );
      }
    });
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changePage(1);
  }

  /**
   * Toggle All Elements in Page
   */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection = _.differenceBy(
        this.selection,
        this.pageSelection,
        '_id'
      );
      this.pageSelection = [];
      return;
    }
    this.pageContacts.forEach((e) => {
      if (!this.isSelected(e)) {
        const contact = new Contact().deserialize(e);
        this.pageSelection.push(contact);
        this.selection.push(contact);
      }
    });
  }
  /**
   * Toggle Element
   * @param contact : Contact
   */
  toggle(contact: ContactActivity): void {
    const selectedContact = new Contact().deserialize(contact);
    const toggledSelection = _.xorBy(
      this.pageSelection,
      [selectedContact],
      '_id'
    );
    this.pageSelection = toggledSelection;

    const toggledAllSelection = _.xorBy(
      this.selection,
      [selectedContact],
      '_id'
    );
    this.selection = toggledAllSelection;
  }
  /**
   * Check contact is selected.
   * @param contact : ContactActivity
   */
  isSelected(contact: ContactActivity): boolean {
    const index = this.pageSelection.findIndex(
      (item) => item._id === contact._id
    );
    if (index >= 0) {
      return true;
    }
    return false;
  }
  /**
   * Check all contacts in page are selected.
   */
  isAllSelected(): boolean {
    if (this.selection.length === this.contactCount) {
      this.updateSelectActionStatus(false);
    } else {
      this.updateSelectActionStatus(true);
    }
    return this.pageSelection.length === this.pageContacts.length;
  }

  openFilter(): void {}

  /**
   * Open the contact detail page
   * @param contact : contact
   */
  openContact(contact: ContactActivity): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  /**
   * Update the Label of the current contact or selected contacts.
   * @param label : Label to update
   * @param _id : id of contact to update
   */
  updateLabel(label: string, _id: string): void {
    const newLabel = label ? label : null;
    let ids = [];
    this.selection.forEach((e) => {
      ids.push(e._id);
    });
    if (ids.indexOf(_id) === -1) {
      ids = [_id];
    }
    this.isUpdating = true;
    this.contactService
      .bulkUpdate(ids, { label: newLabel }, {})
      .subscribe((status) => {
        this.isUpdating = false;
        if (status) {
          this.handlerService.bulkContactUpdate$(ids, { label: newLabel }, {});
        }
      });
  }

  /**
   * Run the bulk action
   * @param event Bulk Action Command
   */
  doAction(event: any): void {
    switch (event.command) {
      case 'deselect':
        this.deselectAll();
        break;
      case 'select':
        this.selectAll(true);
        break;
      case 'delete':
        this.deleteConfirm();
        break;
      case 'edit':
        this.bulkEdit();
        break;
      case 'download':
        this.downloadCSV();
        break;
      case 'message':
        this.openMessageDlg();
        break;
      case 'add_note':
        this.openNoteDlg();
        break;
      case 'add_task':
        this.openTaskDlg();
        break;
      case 'automation':
        this.openAutomationDlg();
        break;
      case 'stopshare':
        this.bulkStopShare();
    }
  }

  /**
   * Update the Command Status
   * @param command :Command String
   * @param loading :Whether current action is running
   */
  updateActionsStatus(command: string, loading: boolean): void {
    this.ACTIONS.some((e) => {
      if (e.command === command) {
        e.loading = loading;
        return true;
      }
    });
  }

  updateSelectActionStatus(status: boolean): void {
    this.ACTIONS.some((e) => {
      if (e.command === 'select') {
        e.spliter = status;
      }
    });
  }

  /**
   * Download CSV
   */
  downloadCSV(): void {
    const ids = [];
    this.selection.forEach((e) => {
      ids.push(e._id);
    });
    this.updateActionsStatus('download', true);
    this.contactService.downloadCSV(ids).subscribe((data) => {
      const contacts = [];
      data.forEach((e) => {
        const contact = {
          first_name: e.contact.first_name,
          last_name: e.contact.last_name,
          email: e.contact.email,
          phone: e.contact.phone,
          source: e.contact.source,
          brokerage: e.contact.brokerage,
          city: e.contact.city,
          state: e.contact.state,
          zip: e.contact.zip,
          address: e.contact.address
        };
        const notes = [];
        if (e.note && e.note.length) {
          e.note.forEach((note) => {
            notes.push(note.content);
          });
        }
        let label = '';
        if (e.contact.label) {
          label = e.contact.label.name || '';
        }
        contact['note'] = notes.join('     ');
        contact['tags'] = e.contact.tags.join(', ');
        contact['label'] = label;
        contacts.push(contact);
      });
      if (contacts.length) {
        const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
        const header = Object.keys(contacts[0]);
        const csv = contacts.map((row) =>
          header
            .map((fieldName) => JSON.stringify(row[fieldName], replacer))
            .join(',')
        );
        csv.unshift(header.join(','));
        const csvArray = csv.join('\r\n');

        const blob = new Blob([csvArray], { type: 'text/csv' });
        saveAs(blob, 'myFile.csv');
      }
      this.updateActionsStatus('download', false);
    });
  }

  /**
   * Select All Contacts
   */
  selectAll(source = false): void {
    if (this.searchStr) {
      this.pageContacts.forEach((e) => {
        if (!this.isSelected(e)) {
          const contact = new Contact().deserialize(e);
          this.pageSelection.push(contact);
          this.selection.push(contact);
        }
      });
      return;
    }
    this.selecting = true;
    this.selectSubscription && this.selectSubscription.unsubscribe();
    this.selectSubscription = this.teamService
      .selectAllSharedContacts(this.team._id)
      .subscribe((contacts) => {
        this.selecting = false;
        this.selection = _.unionBy(this.selection, contacts, '_id');
        this.pageSelection = _.intersectionBy(
          this.selection,
          this.pageContacts,
          '_id'
        );
        this.updateActionsStatus('select', false);
        this.updateSelectActionStatus(false);
      });
  }

  deselectAll(): void {
    this.pageSelection = [];
    this.selection = [];
    this.updateSelectActionStatus(true);
  }

  /**
   * Delete Selected Contacts
   */
  deleteConfirm(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete contacts',
          message: 'Are you sure to delete contacts?',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.delete();
          this.handlerService.reload$();
        }
      });
  }

  delete(): void {
    const ids = [];
    this.selection.forEach((e) => {
      ids.push(e._id);
    });
    this.updateActionsStatus('delete', true);
    this.contactService.bulkDelete(ids).subscribe((status) => {
      this.updateActionsStatus('delete', false);
      if (!status) {
        return;
      }
      this.handlerService.readMessageContact.next(ids);
      if (this.searchStr || !this.searchOption.isEmpty()) {
        // Searched Contacts
        const selection = [...this.selection];
        this.selection = [];
        this.pageSelection = [];
        this.contactService.delete$([...selection]);
      } else {
        // Pages Contacts
        const selection = [...this.selection];
        this.selection = [];
        this.pageSelection = [];
        const { total, page } = this.contactService.delete$([...selection]);
        if (page) {
          return;
        }
        const maxPage =
          total % this.pageSize.id
            ? Math.floor(total / this.pageSize.id) + 1
            : total / this.pageSize.id;
        if (maxPage >= this.page) {
          this.changePage(this.page);
        }
      }
    });
  }

  /**
   * Bulk Edit Open
   */
  bulkEdit(): void {
    this.panelType = 'editor';
    this.drawer.open();
  }

  openMessageDlg(): void {
    this.dialog.open(SendEmailComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        contacts: this.selection
      }
    });
  }

  openNoteDlg(): void {
    this.dialog.open(NoteCreateComponent, {
      ...DialogSettings.NOTE,
      data: {
        contacts: this.selection
      }
    });
  }

  openTaskDlg(): void {
    this.dialog.open(TaskCreateComponent, {
      ...DialogSettings.TASK,
      data: {
        contacts: this.selection
      }
    });
  }

  openAutomationDlg(): void {
    if (this.selection.length <= 10) {
      this.dialog.open(ContactAssignAutomationComponent, {
        ...DialogSettings.AUTOMATION,
        data: {
          contacts: this.selection
        }
      });
    } else {
      this.dialog.open(NotifyComponent, {
        width: '98vw',
        maxWidth: '390px',
        data: {
          title: 'New Automation',
          message: 'You can assign to at most 10 contacts.'
        }
      });
    }
  }

  /**
   * Handler when page number get out of the bound after remove contacts.
   * @param $event : Page Number
   */
  pageChanged($event: number): void {
    this.changePage($event);
  }

  /**
   * Panel Open and Close event
   * @param $event Panel Open Status
   */
  setPanelType($event: boolean): void {
    if (!$event) {
      this.panelType = '';
    } else {
      this.editPanel.clearForm();
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

  shareContact(): void {
    this.dialog
      .open(TeamContactShareComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          team: this.team
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.data?.length) {
          for (const contact of res.data) {
            this.pageContacts.push(new ContactActivity().deserialize(contact));
            this.contactCount++;
          }
        }
      });
  }

  isSharedByMe(contact): any {
    if (contact && contact.user && contact.user.length > 0) {
      const index = contact.user.findIndex((item) => item._id === this.userId);
      if (index < 0) {
        return true;
      }
    }
    return false;
  }

  getSharedMembers(contact): any {
    return _.uniqBy(contact.shared_members, '_id');
  }

  getSharedUsers(contact): any {
    return _.uniqBy(contact.user, '_id');
  }

  userAvatarName(user_name): string {
    const names = user_name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    } else {
      return names[0][0];
    }
  }

  clearAllFilters(): void {
    this.isShareWith = false;
    this.isShareBy = false;
    this.selectedMembers = [];
    this.advancedFilter();
  }

  toggleShareOption(option: string): void {
    if (option === 'share_with') {
      this.isShareWith = !this.isShareWith;
    } else {
      this.isShareBy = !this.isShareBy;
    }
    this.advancedFilter();
  }

  changeTeamMemberOptions(members): void {
    if (members && members.length > 0) {
      this.selectedMembers = members;
      // .map((member) => member._id);
    } else {
      this.selectedMembers = [];
    }
    this.advancedFilter();
  }

  advancedFilter(): void {
    const searchStr = {
      search: '',
      team: this.team._id,
      share_by: {
        flag: 1,
        members: []
      },
      share_with: {
        flag: 1,
        members: []
      }
    };

    if (this.searchStr !== '') {
      searchStr.search = this.searchStr;
    }

    if (!this.isShareWith && !this.isShareBy) {
      if (this.selectedMembers.length > 0) {
        if (this.selectedMembers.length === this.teamMembers.length) {
          searchStr.share_with.flag = 1;
          searchStr.share_by.flag = 1;
        } else {
          searchStr.share_with.flag = 0;
          searchStr.share_by.flag = 0;
        }
        searchStr.share_with.members = this.selectedMembers.map(
          (member) => member._id
        );
        searchStr.share_by.members = this.selectedMembers.map(
          (member) => member._id
        );
      }
    } else {
      if (this.isShareWith) {
        searchStr.share_with.members = this.selectedMembers.map(
          (member) => member._id
        );
        if (this.selectedMembers.length > 0) {
          if (this.selectedMembers.length !== this.teamMembers.length) {
            searchStr.share_with.flag = 0;
          }
        }
      } else {
        if (this.isShareBy) {
          searchStr.share_with.flag = -1;
        }
      }
      if (this.isShareBy) {
        searchStr.share_by.members = this.selectedMembers.map(
          (member) => member._id
        );
        if (this.selectedMembers.length > 0) {
          if (this.selectedMembers.length !== this.teamMembers.length) {
            searchStr.share_by.flag = 0;
          }
        }
      } else {
        if (this.isShareWith) {
          searchStr.share_by.flag = -1;
        }
      }
    }

    this.searchSubscription && this.searchSubscription.unsubscribe();
    this.searchSubscription = this.teamService
      .searchContact(searchStr)
      .subscribe((res) => {
        if (res) {
          this.pageContacts = [];
          for (const contact of res['contacts']) {
            this.pageContacts.push(new ContactActivity().deserialize(contact));
          }
          this.contactCount = res['contacts'].length;
        }
      });
    this.page = 1;
  }

  bulkStopShare(): void {
    if (this.selection && this.selection.length > 0) {
      const members = [];
      for (const contact of this.selection) {
        const contactMembers = this.getSharedMembers(contact);
        if (contactMembers.length > 0) {
          for (const member of contactMembers) {
            const index = members.findIndex((item) => item._id === member._id);
            if (index < 0) {
              members.push(member);
            }
          }
        }
      }
      const dialog = this.dialog.open(StopShareContactComponent, {
        width: '100vw',
        maxWidth: '400px',
        data: {
          contacts: this.selection,
          members
        }
      });

      dialog.afterClosed().subscribe((res) => {
        if (res && res.status) {
          this.loadContact(this.page);
        }
      });
    }
  }

  stopShare($event, contact): void {
    if (contact) {
      const members = this.getSharedMembers(contact);
      if (contact.shared_all_member) {
        this.dialog
          .open(ConfirmComponent, {
            data: {
              title: 'Stop share contact over a community',
              message:
                'Are you sure you want to stop share this contact over a community?',
              cancelLabel: 'No',
              confirmLabel: 'Stop'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.stopShareContactSubscription &&
                this.stopShareContactSubscription.unsubscribe();
              this.stopShareContactSubscription = this.contactService
                .stopShareContacts([contact._id], this.userId, this.team._id)
                .subscribe((res) => {
                  if (this.page == 0) {
                    this.loadContact(0);
                  } else {
                    this.loadContact(this.page - 1);
                  }
                });
            }
          });
      } else {
        const dialog = this.dialog.open(StopShareContactComponent, {
          width: '100vw',
          maxWidth: '400px',
          data: {
            contacts: [contact],
            members,
            team: this.team._id
          }
        });

        dialog.afterClosed().subscribe((res) => {
          if (res && res.status) {
            if (this.page == 0) {
              this.loadContact(0);
            } else {
              this.loadContact(this.page - 1);
            }
          }
        });
      }
    }
  }

  showProfile(member): void {
    this.dialog.open(TeamMemberProfileComponent, {
      data: {
        title: 'Community member',
        member
      }
    });
  }
}
