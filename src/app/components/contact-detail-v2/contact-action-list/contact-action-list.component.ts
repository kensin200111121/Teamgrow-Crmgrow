import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subscription, throttleTime } from 'rxjs';
import moment from 'moment-timezone';
import _ from 'lodash';
import {
  Contact,
  ContactActivityActionV2,
  ContactDetailActionType
} from '@app/models/contact.model';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';
import { AppointmentService } from '@services/appointment.service';
import { StoreService } from '@services/store.service';
import { UserService } from '@app/services/user.service';
import { ContactActionService } from '@app/services/contact-action.service';
import { DealCreateComponent } from '@app/components/deal-create/deal-create.component';
import { DialogSettings } from '@app/constants/variable.constants';

@Component({
  selector: 'app-contact-action-list',
  templateUrl: './contact-action-list.component.html',
  styleUrls: ['./contact-action-list.component.scss']
})
export class ContactActionListComponent implements OnInit {
  _type: ContactDetailActionType;
  dataSource;
  @ViewChild('viewport') viewport: CdkVirtualScrollViewport;
  contactId;
  @Input() set type(val) {
    this._type = val;
    this._initDataSource();
  }

  @Input()
  public set setContactId(val: string) {
    if (val) {
      const originalContactId = this.contactId;
      this.contactId = val;
      this._initLoadInfo(
        this.contactId,
        originalContactId && originalContactId !== this.contactId
      );
    }
  }

  contactMainInfo: Contact = new Contact(); // contact main informations
  contactMainInfoReadSubscription: Subscription;
  profileSubscription: Subscription;

  showingDetails = [];
  sharedMembers = [];
  newNote = false;
  userId = '';
  // Contact Id Route & Additional Field
  routeChangeSubscription: Subscription;

  private loadedTextCount = 0;
  private textLoadTwice = false;

  isPackageText = true;
  textUnsubscribed = false;

  timeSorts = [
    { label: 'All', id: 'all' },
    { label: 'Overdue', id: 'overdue' },
    { label: 'Today', id: 'today' },
    { label: 'Tomorrow', id: 'tomorrow' },
    { label: 'This week', id: 'this_week' },
    { label: 'Next Week', id: 'next_week' },
    { label: 'Future', id: 'future' }
  ];
  selectedTimeSort =
    this.contactDetailInfoService.lastSelectedTaskSortType ?? this.timeSorts[0];

  constructor(
    private dialog: MatDialog,
    public contactDetailInfoService: ContactDetailInfoService,
    private appointmentService: AppointmentService,
    private storeService: StoreService,
    public userService: UserService,
    private contactActionService: ContactActionService,
    private cdr: ChangeDetectorRef
  ) {
    this.appointmentService.loadCalendars(true, false);
  }
  ngOnInit(): void {}

  _initLoadInfo(contactId, forceReload = false) {
    this._initDataSource(forceReload);
    this.contactDetailInfoService.oldParentFollowUps = [];
    this.contactMainInfoReadSubscription &&
      this.contactMainInfoReadSubscription.unsubscribe();
    this.contactMainInfoReadSubscription =
      this.storeService.selectedContactMainInfo$.subscribe((contact) => {
        if (!contact?._id) {
          return;
        }
        this.contactMainInfo = new Contact().deserialize({ ...contact });
        if (this.contactMainInfo['shared_members']) {
          this.sharedMembers = this.contactMainInfo['shared_members'].map(
            (e) => e._id
          );
        }
        this.textUnsubscribed =
          this.contactMainInfo.unsubscribed?.text || false;
      });

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile?._id) {
          this.userId = profile._id;
          this.isPackageText = profile.text_info?.is_enabled;
        }
      }
    );
  }

  _initDataSource(forceReload = false) {
    if (!forceReload && (!this._type || !this.contactId)) {
      return;
    }
    this.loadedTextCount = 0;
    this.textLoadTwice = false;
    this.dataSource = new ContactListSource(
      this.contactDetailInfoService,
      this._type,
      this.contactId
    );
    this.dataSource._dataStream.subscribe((data) => {
      if (this._type === 'text') {
        if (data?.length === 0) {
          return;
        }
        if (this.loadedTextCount === 0) {
          this.callBackLoadText();
        }

        this.loadedTextCount = data?.length ?? 0;
      }
    });
    this.contactDetailInfoService.newTextIsAdd$.subscribe((res) => {
      if (res) {
        this.callBackLoadText();
        this.contactDetailInfoService.newTextIsAdd.next(false);
      }
    });
  }

  callBackLoadText() {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.scrollToBottom();
    }, 500);
  }

  onScrolledIndexChange(index: number): void {
    if (!this.viewport) {
      return;
    }
    if (this._type === 'text') {
      if (index === 0 && !this.dataSource.hasNoMoreData && this.textLoadTwice) {
        throttleTime(250);
        this.dataSource.loadNextPage();
      }
    } else {
      const end = this.viewport.getRenderedRange().end;
      const total = this.viewport.getDataLength();
      const bottomOffset = this.viewport.measureScrollOffset('bottom');

      if (
        end === total &&
        bottomOffset < 100 &&
        !this.dataSource.hasNoMoreData
      ) {
        throttleTime(250);
        this.dataSource.loadNextPage();
      }
    }
  }

  trackByIdx(i: number, item: ContactActivityActionV2) {
    return item.actionId;
  }

  // Check my contact
  get isPending(): boolean {
    const contact = this.contactMainInfo;
    if (!contact) {
      return false;
    }
    const pending_users = contact.pending_users || [];
    const sharedMembers = this.sharedMembers || [];
    const contactUser = contact.user || [];
    if (
      pending_users.includes(this.userId) ||
      (!contactUser.includes(this.userId) &&
        !sharedMembers.includes(this.userId))
    ) {
      return true;
    } else {
      return false;
    }
  }

  openCreateNoteForm(): void {
    this.newNote = true;
  }

  closeCreateNoteForm(): void {
    this.newNote = false;
  }

  onCreateNote(): void {
    this.newNote = false;
    this.contactDetailInfoService.callbackForAddContactAction(
      this.contactId,
      'note'
    );
  }

  openSendEmail(): void {
    this.contactActionService.openSendEmail();
  }

  openSendText(): void {
    this.contactActionService.openSendText();
  }

  openTaskDlg(): void {
    this.contactActionService.openTaskDlg();
  }

  openDealDlg(): void {
    const contact = new Contact().deserialize({
      _id: this.contactMainInfo._id,
      first_name: this.contactMainInfo.first_name,
      last_name: this.contactMainInfo.last_name,
      email: this.contactMainInfo.email,
      cell_phone: this.contactMainInfo.cell_phone
    });

    this.dialog
      .open(DealCreateComponent, {
        ...DialogSettings.DEAL,
        data: {
          contacts: [contact]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.contactDetailInfoService.callbackForAddContactAction(
            this.contactId,
            'deal'
          );
        }
      });
  }

  openAppointmentDlg(): void {
    this.contactActionService.openAppointmentDlg();
  }

  openCall(): void {
    this.contactActionService.openCall();
  }

  changeSort(timeSort: any): void {
    this.selectedTimeSort = timeSort;
    this.contactDetailInfoService.lastSelectedTaskSortType = timeSort;
    this.dataSource.changeSort(timeSort.id);
  }

  scrollToBottom() {
    if (this.viewport) {
      const top = this.viewport.measureScrollOffset('bottom');
      this.viewport.elementRef.nativeElement.scrollTo({
        top,
        behavior: 'smooth'
      });
      this.textLoadTwice = true;
    }
  }
}

export class ContactListSource extends DataSource<
  ContactActivityActionV2 | undefined
> {
  private _type;
  private _contactId;
  private _pageSize = 15;
  private keepConnect = false;

  isLoading = false;
  firstLoading = false;
  isEmptyData = true;
  isRefreshing = false;
  hasNoMoreData = false;

  readonly _dataStream = new BehaviorSubject<
    (ContactActivityActionV2 | undefined)[]
  >([]);
  actionsSubscription: Subscription;

  constructor(
    private contactDetailInfoService: ContactDetailInfoService,
    type: ContactDetailActionType,
    contactId: string
  ) {
    super();
    this._type = type;
    this._contactId = contactId;
    this._init();
  }

  connect(
    collectionViewer: CollectionViewer
  ): Observable<(ContactActivityActionV2 | undefined)[]> {
    return this._dataStream;
  }

  disconnect(): void {
    if (!this.keepConnect) {
      return this._dataStream.complete();
    }
    this.keepConnect = false;
  }

  private _init() {
    this.contactDetailInfoService.resetContactDetailInfo(this._contactId);
    this._initObserve();
    const storedValue =
      this.contactDetailInfoService.actions[this._type]?.getValue() || [];
    if (storedValue?.length == 0 && !this.hasNoMoreData && !this.firstLoading) {
      // call API if there is no stored list (when first rendering)
      this.initFetch();
    }
  }

  private initFetch() {
    this.firstLoading = true;
    this.isEmptyData = true;
    this.hasNoMoreData = false;
    this._fetchPage(0);
  }

  loadNextPage() {
    const offset = this._dataStream.getValue().length;
    if (
      this.isLoading ||
      this.contactDetailInfoService.actionListOffset[this._type] >= offset
    ) {
      return;
    }

    this._fetchPage(offset);
  }

  private _initObserve() {
    this.actionsSubscription?.unsubscribe();
    this.actionsSubscription = this.contactDetailInfoService.actions$[
      this._type
    ].subscribe((data) => {
      if (data.length > 0) {
        if (data.length === this._dataStream.getValue().length) {
          this.hasNoMoreData = true;
        } else {
          this.hasNoMoreData = false;
        }
        this.isEmptyData = false;
      } else {
        this.keepConnect = true;
        if (this.firstLoading) {
          this.hasNoMoreData = true;
        }
        this.isEmptyData = true;
      }
      this.isRefreshing = false;
      this.isLoading = false;
      this.firstLoading = false;
      const cloneData = _.clone(data);

      if (this._type === 'text') {
        _.reverse(cloneData);
        const updatedData =
          this.contactDetailInfoService.setFirstTextOfDayFlag(cloneData);
        this._dataStream.next(updatedData);
      } else {
        this._dataStream.next(data);
      }
    });
  }

  private _fetchPage(offset: number) {
    this.isLoading = true;
    this.contactDetailInfoService.actionListOffset[this._type] = offset;
    if (
      this._type === 'follow_up' &&
      !this.contactDetailInfoService.lastSelectedTaskSortQuery
    ) {
      const sortQuery = {
        startDate: null,
        endDate: null,
        sort: null,
        dateOption: 'all'
      };
      this.contactDetailInfoService.lastSelectedTaskSortQuery = sortQuery;
    }
    this.contactDetailInfoService.loadActionsWithType(
      this._contactId,
      this._type,
      {
        skip: offset,
        limit: this._pageSize
      },
      this.contactDetailInfoService.lastSelectedTaskSortQuery
    );
  }

  changeSort(timeSort: any): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const today = moment().startOf('day');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const weekDay = moment().startOf('week');

    let start_date = null;
    let end_date = null;
    let ascSort = 1;

    switch (timeSort) {
      case 'all':
        ascSort = null;
        break;
      case 'future':
        start_date = weekDay.clone().add(2, 'week').toDate();
        break;
      case 'overdue':
        end_date = today.clone().toDate();
        ascSort = -1;
        break;
      case 'today':
        start_date = today.clone().toDate();
        end_date = today.clone().add(1, 'day').toDate();
        break;
      case 'tomorrow':
        start_date = today.clone().add(1, 'day').toDate();
        end_date = today.clone().add(2, 'day').toDate();
        break;
      case 'this_week':
        start_date = weekDay.clone().toDate();
        end_date = weekDay.clone().add(1, 'week').toDate();
        break;
      case 'next_week':
        start_date = weekDay.clone().add(1, 'week').toDate();
        end_date = weekDay.clone().add(2, 'week').toDate();
        break;
      default:
        break;
    }
    const sortQuery = {
      startDate: start_date,
      endDate: end_date,
      sort: ascSort,
      dateOption: timeSort
    };
    this.contactDetailInfoService.lastSelectedTaskSortQuery = sortQuery;
    this.contactDetailInfoService.oldParentFollowUps = [];
    this._fetchPage(0);
  }

  refresh() {
    this.keepConnect = true;
    this.isRefreshing = true;
    this.contactDetailInfoService.refetchContactActionOnType(
      this._contactId,
      this._type
    );
  }

  removeCallBack(actionId) {
    this.contactDetailInfoService.callbackForRemoveContactAction(
      actionId,
      this._type
    );
  }
}
