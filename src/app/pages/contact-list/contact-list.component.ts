import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {
  BulkActions,
  MIN_ROW_COUNT,
  STATUS,
  CONTACT_SORT_OPTIONS
} from '@app/constants/variable.constants';
import { Contact, Contact2I, ContactActivity } from '@app/models/contact.model';
import * as _ from 'lodash';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { MovePendingContactsService } from '@app/services/contacts/move-pending-contact.service';
import { SharePendingContactsService } from '@app/services/contacts/share-pending-contacts.service';
import { SharedContactsService } from '@app/services/contacts/shared-contacts.service';
import { DealsService } from '@app/services/deals.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { DialogSettings } from '@constants/variable.constants';
import { Router } from '@angular/router';
import { CustomFieldMatchComponent } from '@app/components/custom-field-match/custom-field-match.component';
import { checkDuplicatedContact } from '@app/utils/contact';
import { ContactService } from '@app/services/contact.service';
import { HandlerService } from '@app/services/handler.service';
import { TaskCreateComponent } from '@components/task-create/task-create.component';
import { SendEmailComponent } from '@app/components/send-email/send-email.component';
import { SendTextComponent } from '@app/components/send-text/send-text.component';
import { NoteCreateComponent } from '@app/components/note-create/note-create.component';
import { ContactAssignAutomationComponent } from '@app/components/contact-assign-automation/contact-assign-automation.component';
import { DealCreateComponent } from '@app/components/deal-create/deal-create.component';
import { CalendarEventDialogComponent } from '@app/components/calendar-event-dialog/calendar-event-dialog.component';
import { DownloadContactsProgressBarComponent } from '@app/components/contact-download-progress-bar/contact-download-progress-bar.component';
import { SearchOption } from '@models/searchOption.model';
import { ConfirmMoveContactsComponent } from '@app/components/confirm-move-contacts/confirm-move-contacts.component';
import { DialerService } from '@app/services/dialer.service';
import { ContactListType } from '@app/utils/enum';

enum SortTypes {
  ALPHA_UP = 'alpha_up',
  ALPHA_DOWN = 'alpha_down',
  LAST_ADDED = 'last_added',
  LAST_ACTIVITY = 'last_activity'
}
@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})
export class ContactListComponent implements OnInit {
  readonly STATUS = STATUS;
  readonly PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  readonly MIN_ROW_COUNT = MIN_ROW_COUNT;

  _listType: ContactListType;
  @Input()
  set listType(type: ContactListType) {
    this.newCheckAllId = 'check-all-' + type + '-contacts';
    this._listType = type;
    switch (type) {
      case ContactListType.MOVE_PENDING:
        this.service = this.movePendingService;
        this.actions = BulkActions.MoveContacts;
        return;
      case ContactListType.SHARE_PENDING:
        this.service = this.sharePendingService;
        this.actions = BulkActions.MoveContacts;
        return;
      case ContactListType.SHARED:
        this.service = this.sharedService;
        this.actions = BulkActions.SharedContacts;
    }
  }
  _sortType: SortTypes;
  @Input()
  set sortType(type: SortTypes) {
    this._sortType = type;
    this.service.sort.next({
      ...CONTACT_SORT_OPTIONS[type],
      page: this.page
    });
  }
  @Input()
  set columns(val: string[]) {
    this._columns = [...val];
    this._columns.push('contact_actions');
  }
  get columns(): string[] {
    return this._columns;
  }
  @Input() customColumns = [];
  @Input() actions = []; //BulkActions.Contacts;
  @Input() userId = '';
  @Output() reload = new EventEmitter();

  private _columns: string[] = [];
  pageSize = this.PAGE_COUNTS[3];
  page = 1;

  selecting = false;
  selectSubscription: Subscription;
  selection: Contact[] = [];
  pageSelection: Contact[] = [];
  pageContacts: ContactActivity[] = [];
  totalCount = 0;

  acceptContactId = '';
  declineContactId = '';
  loading = false;
  isAccepting = false;
  isDeclining = false;

  stageContacts = {};
  disableActions = [];
  newCheckAllId = '';
  service:
    | MovePendingContactsService
    | SharedContactsService
    | SharePendingContactsService;

  protected _onDestroy = new Subject<void>();

  // Variables for Label Update
  isUpdating = false;

  selectSource = '';
  CUSTOM_COLUMNS = [];

  _searchOption: SearchOption = new SearchOption();
  @Input()
  set searchOption(search_options: SearchOption) {
    this._searchOption = search_options;
    this.service.searchOption.next(
      new SearchOption().deserialize(this._searchOption)
    );
  }
  constructor(
    private movePendingService: MovePendingContactsService,
    private sharePendingService: SharePendingContactsService,
    private sharedService: SharedContactsService,
    private dealsService: DealsService,
    private dialerService: DialerService,
    private dialog: MatDialog,
    public router: Router,
    public contactService: ContactService,
    private handlerService: HandlerService
  ) {
    this.dealsService.stageContacts$.subscribe((data) => {
      this.stageContacts = data || {};
    });
  }

  ngOnInit(): void {
    this.initSubscribers();
    const pageSize = this.service.pageSize.getValue();
    this.pageSize = { id: pageSize, label: pageSize + '' };
    const page = this.service.pageIndex.getValue();
    this.changePage(page);
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private initSubscribers() {
    this.service.contacts
      .pipe(takeUntil(this._onDestroy))
      .subscribe((contacts) => {
        this.pageContacts = contacts;
        this.pageSelection = _.intersectionBy(
          this.selection,
          this.pageContacts,
          '_id'
        );
      });
    this.service.total.pipe(takeUntil(this._onDestroy)).subscribe((total) => {
      this.totalCount = total;
    });
  }

  changePageSize(type: any) {
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    this.service.pageSize.next(this.pageSize.id);
    if (currentSize < this.pageSize.id) {
      // If page size get bigger
      const loaded = this.page * currentSize;
      let newPage = Math.floor(loaded / this.pageSize.id);
      newPage = newPage > 0 ? newPage : 1;
      this.changePage(newPage);
    } else {
      this.changePage(this.page);
    }
  }

  changePage(page: number) {
    this.page = page;
    this.service.pageIndex.next(page);
    if (this._searchOption.isEmpty()) {
      // Normal Load by Page
      let skip = (page - 1) * this.pageSize.id;
      skip = skip < 0 ? 0 : skip;
      this.service.load(skip);
    } else {
      this.service.advancedSearch(page);
    }
  }

  isAllSelected(): boolean {
    if (this.selection.length === this.totalCount) {
      this.updateSelectActionStatus(false);
    } else {
      this.updateSelectActionStatus(true);
    }
    return this.pageSelection.length === this.pageContacts.length;
  }

  isSelected(contact: ContactActivity): boolean {
    //return _.findIndex(this.pageSelection, contact.mainInfo, '_id') !== -1;
    const index = this.pageSelection.findIndex((e) => {
      return e._id === contact.mainInfo._id;
    });
    return index !== -1;
  }

  updateSelectActionStatus(status: boolean): void {
    this.actions.some((e) => {
      if (e.command === 'select') {
        e.spliter = status;
      }
    });
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
        this.pageSelection.push(e.mainInfo);
        this.selection.push(e.mainInfo);
      }
    });
    if (this.selection.length > 1) {
      this.disableActions.push({
        label: 'New Text',
        type: 'button',
        icon: 'i-sms-sent',
        command: 'text',
        loading: false
      });
    } else {
      this.disableActions = [];
    }
  }
  /**
   * Toggle Element
   * @param contact : Contact
   */
  toggle(contact: ContactActivity): void {
    const selectedContact = contact.mainInfo;
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
    if (this.selection.length > 1) {
      this.disableActions.push({
        label: 'New Text',
        type: 'button',
        icon: 'i-sms-sent',
        command: 'text',
        loading: false
      });
    } else {
      this.disableActions = [];
    }
  }

  deselectAll(): void {
    this.pageSelection = [];
    this.selection = [];
    this.updateSelectActionStatus(true);
  }

  getSharedMembers(contact): any {
    //_.remove(contact.shared_members, { _id: this.userId });
    const element = contact;
    if (element.type === 'clone') {
      return element.original_user;
    } else if (element.type === 'transfer') {
      return element.user;
    }

    if (this.userId !== element.user?.[0]?._id) {
      return element.user;
    } else {
      return _.uniqBy(element.shared_members, '_id');
    }
  }

  getSharedUsers(contact): any {
    return _.uniqBy(contact.user, '_id');
  }

  userAvatarName(user_name = ''): string {
    const names = user_name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    } else {
      return names[0][0];
    }
  }

  doAction(event: any): void {
    switch (event.command) {
      case 'accept':
        this.accept();
        break;
      case 'decline':
        this.decline();
        break;
      case 'accept_sharing':
        this.accept();
        break;
      case 'decline-sharing':
        this.decline();
        break;
      case 'add_task':
        this.openTaskDlg();
        break;
      case 'message':
        this.openMessageDlg();
        break;
      case 'text':
        this.openTextDlg();
        break;
      case 'call':
        this.call();
        break;
      case 'add_note':
        this.openNoteDlg();
        break;
      case 'automation':
        this.openAutomationDlg();
        break;
      case 'deal':
        this.openDealDlg();
        break;
      case 'appointment':
        this.openAppointmentDlg();
        break;
      case 'download':
        this.downloadCSV();
        break;
    }
  }

  accept(element?: any): void {
    let selectedElements = [];
    if (element) {
      if (Array.isArray(element)) {
        selectedElements = element;
      } else {
        selectedElements.push(element);
        this.acceptContactId = element._id;
        this.isAccepting = true;
      }
    } else {
      this.updateActionStatus('accept', true);
      selectedElements = this.pageContacts.filter((e) => this.isSelected(e));
    }

    if (this._listType === 'share-pending') {
      const share_ids = selectedElements.map((e) => e._id);
      if (!share_ids.length) {
        this.resetStatus();
        return;
      }

      const data = { contacts: share_ids };
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            message:
              'Do you want to create a custom contact field for not existing ones?',
            title: 'Create Custom Fields',
            confirmLabel: 'Agree'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            data['aggree_custom_fields'] = true;
          } else {
            data['aggree_custom_fields'] = false;
          }
          this.service.acceptSharing(data).subscribe((res) => {
            this.resetStatus();
            if (res) {
              this.changePage(this.page);
              this.handlerService.reload$();
              this.sharedService.load(0);
            }
          });
        });
    } else if (this._listType === 'move-pending') {
      const checkDuplicateData = selectedElements.map((e) =>
        new Contact2I().deserialize(e)
      );
      const response = checkDuplicatedContact(checkDuplicateData);

      const customFields = [];
      response.contacts.forEach((e) => {
        if (Object.keys(e?.additional_field || []).length) {
          Object.keys(e.additional_field).forEach((field) => {
            if (!customFields.includes(field)) {
              customFields.push(field);
            }
          });
        }
      });
      response.groups.forEach((e) => {
        if (Object.keys(e.result?.additional_field || []).length) {
          Object.keys(e.result.additional_field).forEach((field) => {
            if (!customFields.includes(field)) {
              customFields.push(field);
            }
          });
        }
      });

      if (response.groups.length || customFields.length) {
        this.dialog
          .open(CustomFieldMatchComponent, {
            width: '98vw',
            maxWidth: '800px',
            disableClose: true,
            data: {
              duplicateData: response
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.acceptImpl(
                response.contacts,
                res.fieldData,
                res.mergeData
              ).then(() => {
                this.handlerService.reload$();
                this.sharedService.load(0);
              });
            } else {
              this.resetStatus();
            }
          });
      } else {
        this.acceptImpl(selectedElements).then(() => {
          this.handlerService.reload$();
          this.sharedService.load(0);
        });
      }
    }
  }

  acceptImpl(elements: any, customFields = [], contacts = []): Promise<void> {
    return new Promise((resolve, reject) => {
      const acceptIds = elements.map((e) => ({ type: e.type, id: e._id }));
      const acceptLists = {
        ids: acceptIds,
        contacts
      };
      if (!acceptIds.length && !contacts.length) {
        this.resetStatus();
        reject();
        return;
      }

      const data = { acceptLists, customFields };
      this.service.moveAcceptRequest(data).subscribe((res) => {
        if (!res) {
          this.resetStatus();
          resolve();
        } else if (res.status) {
          this.resetStatus();
          this.changePage(this.page);
          resolve();
        } else {
          this.resetStatus();
          if (res.acceptedContacts > 0) {
            this.changePage(this.page);
          }
          this.dialog
            .open(ConfirmMoveContactsComponent, { data: res })
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                this.accept(res.duplicatedContacts);
                resolve();
              }
            });
        }
      });
    });
  }

  decline(element?: any): void {
    let selectedElements = [];
    if (element) {
      selectedElements.push(element);
      this.declineContactId = element._id;
      this.isDeclining = true;
    } else {
      this.updateActionStatus('decline', true);
      selectedElements = this.selection;
    }

    if (this._listType === 'share-pending') {
      const share_ids = selectedElements.map((e) => e._id);
      if (!share_ids.length) {
        this.resetStatus();
        return;
      }

      const data = share_ids;
      this.service.declineSharing(data).subscribe((res) => {
        this.resetStatus();
        if (res) {
          this.changePage(this.page);
        }
      });
    } else if (this._listType === 'move-pending') {
      const declineLists = selectedElements.map((e) => ({
        type: e.type,
        id: e._id
      }));
      if (!declineLists.length) {
        this.resetStatus();
        return;
      }

      const data = { declineLists };
      this.service.moveDeclineRequest(data).subscribe((res) => {
        this.resetStatus();
        if (res) {
          this.changePage(this.page);
        }
      });
    }
  }

  updateActionStatus(command: string, status: boolean): void {
    this.actions.forEach((e) => {
      if (e.command === command) {
        e.loading = status;
      }
    });
  }
  openContact(contact: ContactActivity): void {
    // TO-DO integrate contact list type on storage lixueying
    this.handlerService.selectedContactListType = this._listType;
    this.router.navigate([`contacts/${contact._id}`]);
  }

  resetStatus(): void {
    this.updateActionStatus('accept', false);
    this.updateActionStatus('decline', false);
    this.pageSelection = [];
    this.selection = [];
    this.acceptContactId = '';
    this.declineContactId = '';
    this.isAccepting = false;
    this.isDeclining = false;
  }

  getAssigneeName(element: any): string {
    let user_name = '';
    if (element.owner) {
      if (Array.isArray(element.owner) && element.owner.length) {
        user_name = element.owner[0].user_name;
      } else {
        user_name = element.owner.user_name;
      }
    }
    return user_name;
  }

  /**
   * Update the Label of the current contact or selected contacts.
   * @param label : Label to update
   * @param _id : id of contact to update
   */
  updateLabel(label: string, _id: string): void {
    if (this._listType === 'shared') {
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
            this.handlerService.bulkContactUpdate$(
              ids,
              { label: newLabel },
              {}
            );
          }
        });
    }
  }

  openTaskDlg(): void {
    this.dialog.open(TaskCreateComponent, {
      ...DialogSettings.TASK,
      data: {
        contacts: this.selection
      }
    });
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

  openTextDlg(): void {
    const contact = this.pageContacts.filter(
      (e) => e._id == this.selection[0]._id
    )[0];
    this.dialog.open(SendTextComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        type: 'single',
        contact: contact
      }
    });
  }

  call(): void {
    const contacts = [];
    this.selection.forEach((e) => {
      const contactObj = new Contact().deserialize(e);
      const contact = {
        contactId: contactObj._id,
        numbers: [contactObj.cell_phone],
        name: contactObj.fullName
      };
      contacts.push(contact);
    });
    this.dialerService.makeCalls(contacts);
  }

  openNoteDlg(): void {
    this.dialog.open(NoteCreateComponent, {
      ...DialogSettings.NOTE,
      data: {
        contacts: this.selection
      }
    });
  }

  openAutomationDlg(): void {
    this.dialog.open(ContactAssignAutomationComponent, {
      ...DialogSettings.AUTOMATION,
      data: {
        contacts: this.selection
      }
    });
  }

  openDealDlg(): void {
    this.dialog
      .open(DealCreateComponent, {
        ...DialogSettings.DEAL,
        data: {
          contacts: this.selection
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // Response Handler
        }
      });
  }

  openAppointmentDlg(): void {
    this.dialog.open(CalendarEventDialogComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '600px',
      maxHeight: '700px',
      data: {
        mode: 'dialog',
        contacts: this.selection
      }
    });
  }

  downloadCSV(): void {
    this.updateActionsStatus('download', true);
    this.dialog
      .open(DownloadContactsProgressBarComponent, {
        width: '90vw',
        maxWidth: '800px',
        data: {
          selection: this.selection,
          custom_columns: this.CUSTOM_COLUMNS
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.updateActionsStatus('download', false);
      });
  }

  /**
   * Update the Command Status
   * @param command :Command String
   * @param loading :Whether current action is running
   */
  updateActionsStatus(command: string, loading: boolean): void {
    this.actions.some((e) => {
      if (e.command === command) {
        e.loading = loading;
        return true;
      }
    });
  }

  /**
   * Select All Contacts
   */
  selectAll(source = false): void {
    if (source) {
      this.updateActionsStatus('select', true);
      this.selectSource = 'header';
    } else {
      this.selectSource = 'page';
    }
    if (this._searchOption.isEmpty()) {
      this.selecting = true;
      this.selectSubscription && this.selectSubscription.unsubscribe();
      this.selectSubscription = this.service
        .selectAll()
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
    } else {
      this.selecting = true;
      this.selectSubscription && this.selectSubscription.unsubscribe();
      this.selectSubscription = this.service
        .advancedSelectAll(this._searchOption)
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
  }

  getAdditionalFieldVal(element: any, column: string): string {
    let value = '';
    if (element.additional_field && element.additional_field[column]) {
      value = element.additional_field[column];
    }
    return value;
  }
}
