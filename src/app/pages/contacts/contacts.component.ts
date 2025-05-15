import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import * as Storm from '@wavv/dialer';
import { UploadContactsComponent } from '@components/upload-contacts/upload-contacts.component';
import { DownloadContactsProgressBarComponent } from '@components/contact-download-progress-bar/contact-download-progress-bar.component';
import {
  BulkActions,
  CONTACT_SORT_OPTIONS,
  DialogSettings,
  STATUS,
  MIN_ROW_COUNT,
  CONTACT_LIST_TYPE,
  DEFAULT_LIST_TYPE_IDS,
  DEFAULT_CONTACT_LIST_DESCRIPTION
} from '@constants/variable.constants';
import { Contact, ContactActivity, Contact2I } from '@models/contact.model';
import { ContactService } from '@services/contact.service';
import { StoreService } from '@services/store.service';
import { SearchOption } from '@models/searchOption.model';
import { UserService } from '@services/user.service';
import { DealsService } from '@services/deals.service';
import * as _ from 'lodash';
import { saveAs } from 'file-saver';
import { MatDrawer } from '@angular/material/sidenav';
import { Subscription, Subject } from 'rxjs';
import { ContactBulkComponent } from '@components/contact-bulk/contact-bulk.component';
import { NoteCreateComponent } from '@components/note-create/note-create.component';
import { TaskCreateComponent } from '@components/task-create/task-create.component';
import { HandlerService } from '@services/handler.service';
import { ContactAssignAutomationComponent } from '@components/contact-assign-automation/contact-assign-automation.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { SendEmailComponent } from '@components/send-email/send-email.component';
import { AssignmentDialogComponent } from '@app/components/assignment-dialog/assignment-dialog.component';

import { ToastrService } from 'ngx-toastr';
import { SendTextComponent } from '@components/send-text/send-text.component';
import { ContactDeleteComponent } from '@components/contact-delete/contact-delete.component';
import { ContactShareComponent } from '@components/contact-share/contact-share.component';
import { DealCreateComponent } from '@components/deal-create/deal-create.component';
//import { User } from '@models/user.model';
import { CalendarEventDialogComponent } from '@components/calendar-event-dialog/calendar-event-dialog.component';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  takeUntil
} from 'rxjs/operators';
//import { Overlay } from '@angular/cdk/overlay';
import { FilterService } from '@services/filter.service';

import { AdvancedFilterOptionComponent } from '@components/advanced-filter-option/advanced-filter-option.component';

import { FilterAddComponent } from '@components/filter-add/filter-add.component';
import { NotifyComponent } from '@components/notify/notify.component';

import { ColumnEditComponent } from '@components/column-edit/column-edit.component';
import { JSONParser, areAllStringFieldsNullOrEmpty } from '@utils/functions';
import { Location } from '@angular/common';
import { TeamService } from '@app/services/team.service';
import { ContactMoveComponent } from '@app/components/contact-move/contact-move.component';
import { StopShareContactComponent } from '@components/stop-share-contact/stop-share-contact.component';
import { environment } from '@environments/environment';
import { DialerService } from '@app/services/dialer.service';
import { RouterService } from '@app/services/router.service';
import { ContactCreateEditComponent } from '@app/components/contact-create-edit/contact-create-edit.component';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { CustomFieldMatchComponent } from '@app/components/custom-field-match/custom-field-match.component';
import { ConfirmMoveContactsComponent } from '@app/components/confirm-move-contacts/confirm-move-contacts.component';
import { checkDuplicatedContact } from '@app/utils/contact';
import { CustomFieldService } from '@app/services/custom-field.service';
@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit, OnDestroy {
  readonly USER_FEATURES = USER_FEATURES;
  protected KEY_LAST_SORT_TYPE = 'contact.last_used_sort_type';
  protected FILTER = 'contact.last_used_filter';
  readonly isSspa = environment.isSspa;
  destroy$ = new Subject();

  MIN_ROW_COUNT = MIN_ROW_COUNT;
  STATUS = STATUS;
  ACTIONS = [];

  SHARED_WITH_ACTIONS = [];
  PENDING_ACTIONS = BulkActions.ContactsPending;

  DEFAULT_ALL_COLUMNS = [
    {
      id: 'contact_name',
      name: 'Contact Name',
      selected: true,
      additional_field: false,
      order: 0
    },
    {
      id: 'contact_label',
      name: 'Status',
      selected: true,
      additional_field: false,
      order: 1
    },

    {
      id: 'contact_phone',
      name: 'Phone Number',
      selected: true,
      additional_field: false,
      order: 2
    },
    {
      id: 'contact_email',
      name: 'Email Address',
      selected: true,
      additional_field: false,
      order: 3
    },

    {
      id: 'activity',
      name: 'Last Activity',
      selected: true,
      additional_field: false,
      order: 4
    },
    {
      id: 'contact_tags',
      name: 'Tags',
      selected: true,
      additional_field: false,
      order: 5
    },

    {
      id: 'contact_address',
      name: 'Address',
      selected: true,
      additional_field: false,
      order: 6
    },

    {
      id: 'shared_with',
      name: 'Shared With',
      selected: false,
      additional_field: false,
      order: 7
    },

    {
      id: 'contact_stages',
      name: 'Stages',
      selected: false,
      additional_field: false,
      order: 8,
      feature: USER_FEATURES.PIPELINE
    },

    {
      id: 'source',
      name: 'Source',
      selected: false,
      additional_field: false,
      order: 9
    },
    {
      id: 'website',
      name: 'Website',
      selected: false,
      additional_field: false,
      order: 10
    },
    {
      id: 'company',
      name: 'Company',
      selected: false,
      additional_field: false,
      order: 11
    },
    {
      id: 'city',
      name: 'City',
      selected: false,
      additional_field: false,
      order: 12
    },
    {
      id: 'country',
      name: 'Country',
      selected: false,
      additional_field: false,
      order: 13
    },
    {
      id: 'state',
      name: 'State',
      selected: false,
      additional_field: false,
      order: 14
    },
    {
      id: 'zipcode',
      name: 'Zipcode',
      selected: false,
      additional_field: false,
      order: 15
    },
    {
      id: 'secondary_email',
      name: 'Secondary Email',
      selected: false,
      additional_field: false,
      order: 16
    },
    {
      id: 'secondary_phone',
      name: 'Secondary Phone',
      selected: false,
      additional_field: false,
      order: 17
    },
    {
      id: 'assignee',
      name: 'Assignee',
      selected: false,
      additional_field: false,
      order: 18,
      feature: USER_FEATURES.ASSIGNEE
    }
  ];
  CUSTOM_COLUMNS = [];
  DISPLAY_COLUMNS = [];
  SHARE_CONTACT_COLUMNS = [];

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

  //Update by ZY
  FILTERS = [
    { id: 'label', label: 'Status' },
    { id: 'tag', label: 'Tag' },
    { id: 'country', label: 'Country' },
    { id: 'state', label: 'State' },
    { id: 'city', label: 'City' },
    { id: 'zipcode', label: 'Zipcode' },
    { id: 'source', label: 'Source' },
    { id: 'company', label: 'Company' },
    { id: 'stage', label: 'Stage', feature: USER_FEATURES.PIPELINE },
    { id: 'activity', label: 'Activity' },
    { id: 'assignee', label: 'Assigned To', feature: USER_FEATURES.ASSIGNEE },
    {
      id: 'community',
      label: 'Community',
      feature: USER_FEATURES.CONTACT_SEARCH_BY_COMMUNITY
    },
    { id: 'unsubscribed', label: 'Unsubscribed' },
    {
      id: 'automation',
      label: 'Automation',
      feature: USER_FEATURES.AUTOMATION
    }
  ];

  SHARED_FILTERS = [
    { id: 'label', label: 'Status' },
    { id: 'tag', label: 'Tag' },
    { id: 'country', label: 'Country' },
    { id: 'state', label: 'State' },
    { id: 'city', label: 'City' },
    { id: 'zipcode', label: 'Zipcode' }
  ];

  pageFilters = [];

  customColumnFilter = false;

  userId = '';
  loading = true;

  // Controls whether ownership-related icons (e.g., shared-with / owner indicators) are shown in the UI
  showOwnershipIcon = false;

  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('editPanel') editPanel: ContactBulkComponent;
  panelType = '';

  sortType = this.SORT_TYPES[1];
  pageSize = this.PAGE_COUNTS[3];
  page = 1;
  searchOption: SearchOption = new SearchOption();
  searchStr = '';

  all_ids = [];
  deleteDlgRef;
  deletePercent = 0;
  deleteChunk = 0;
  DELETE_ONCE = 100;
  constListTypeOptions: Array<{
    _id: string;
    label: string;
    description: string;
  }> = [];

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
  queryParamSubscription: Subscription;
  disableActions = [];
  isPackageGroupEmail = true;
  isPackageText = true;
  isPackageAutomation = true;
  isPackageDialer = true;
  isPurchasedDialer = false;
  indexOfFile = 0;

  deals = [];

  stageContacts = {};
  stageLoadSubscription: Subscription;
  garbageSubscription: Subscription; //sniper88t
  customFieldSubscription: Subscription; //sniper88t
  searchOptionChangeSubscription: Subscription;

  selectedFilter = {};
  currentFilterId = '';

  materialActions = [];
  selectedMaterialActions = '';
  selectedMaterial = [];

  assignee_editable = false;
  internalTeamCount = 0;
  communityCount = 0;
  teamSubscription: Subscription;

  bulkStopSharable = true;
  stopShareAction = {
    label: 'Stop Share',
    type: 'button',
    icon: 'i-share-off',
    command: 'unshare',
    loading: false,
    loadingLabel: 'Unsharing'
  };
  isSharedAllMembers = true;
  sharedMembers = [];
  stopShareContactSubscription: Subscription;

  private listTypeOption: 'own' | 'team' = 'own'; // used for filter option (only we need 2 case)

  overallContacts = 0;
  downloadedContactsCount = 0;
  downloadPercent = 0;
  changeSearchStr = new Subject<string>();

  get contactListTitle(): string {
    if (this.currentFilterId === 'own') {
      return 'Contacts';
    }
    const label =
      this.constListTypeOptions.find(
        (item) => item._id === this.currentFilterId
      )?.label ?? 'Contacts';
    return label;
  }

  get contactListDescription(): string {
    if (this.currentFilterId === 'own') {
      return DEFAULT_CONTACT_LIST_DESCRIPTION;
    }
    const label =
      this.constListTypeOptions.find(
        (item) => item._id === this.currentFilterId
      )?.description ?? DEFAULT_CONTACT_LIST_DESCRIPTION;
    return label;
  }

  showSideFilterOptions = true;
  acceptContactId = '';
  declineContactId = '';
  isAccepting = false;
  isDeclining = false;
  teamMemberAvatarColors = {};

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private dialerService: DialerService,
    public storeService: StoreService,
    public contactService: ContactService,
    public userService: UserService,
    public dealsService: DealsService,
    private handlerService: HandlerService,
    private dialog: MatDialog,
    private toast: ToastrService,
    public filterService: FilterService,
    private location: Location,
    public sspaService: SspaService,
    public teamService: TeamService,
    private routerService: RouterService,
    private customFieldService: CustomFieldService
  ) {
    this.loading = true;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        const sspaExcludedCommands = ['share', 'move', 'unshare'];
        const vortexFreeExcludedCommands = ['message', ...sspaExcludedCommands];
        this.ACTIONS =
          this.isSspa && res.package_level === 'VORTEX_FREE'
            ? BulkActions.Contacts.filter(
                (action) => !vortexFreeExcludedCommands.includes(action.command)
              )
            : this.isSspa
            ? BulkActions.Contacts.filter(
                (action) => !sspaExcludedCommands.includes(action.command)
              )
            : BulkActions.Contacts;
        this.SHARED_WITH_ACTIONS = this.isSspa
          ? BulkActions.ContactSharedWith.filter(
              (action) => !sspaExcludedCommands.includes(action.command)
            )
          : BulkActions.ContactSharedWith;
        this.isPackageAutomation = res.automation_info?.is_enabled;
        this.isPackageGroupEmail = res.email_info?.mass_enable;
        this.isPackageText = res.text_info?.is_enabled;
        this.isPackageDialer = res.dialer_info?.is_enabled || false;

        if (this.isSspa) {
          [this.ACTIONS, this.SHARED_WITH_ACTIONS].forEach((actions) => {
            actions
              .filter((action) => action.command === 'download')
              .forEach((downloadAction) => {
                downloadAction.label = 'Export';
                if (downloadAction.loadingLabel) {
                  downloadAction.loadingLabel = 'Exporting';
                }
              });
          });
        }

        this.userId = res._id;
        this.loading = false;

        this.disableActions = [];
        if (!this.isPackageAutomation) {
          this.disableActions.push({
            label: 'New automation',
            type: 'button',
            icon: 'i-automation',
            command: 'automation',
            loading: false
          });
        }
        if (!this.isPackageGroupEmail) {
          this.disableActions.push({
            label: 'Send email',
            type: 'button',
            icon: 'i-message',
            command: 'message',
            loading: false
          });
        }

        if (res.dialer_info && res.dialer_info.is_enabled) {
          this.isPurchasedDialer = true;
        } else if (
          !res.is_primary &&
          (res['dialer'] ||
            res['parent_company'] === 'EVO' ||
            res.company === 'EVO')
        ) {
          this.isPurchasedDialer = true;
        } else {
          this.isPurchasedDialer = false;
        }

        this.assignee_editable = res?.assignee_info?.is_editable;
        if (!this.assignee_editable) {
          this.FILTERS = this.FILTERS.filter((e) => e.id !== 'assignee');
        } else {
          const index = _.findIndex(this.FILTERS, {
            id: 'assignee'
          });
          if (index === -1) {
            this.FILTERS.push({
              id: 'assignee',
              label: 'Assignee',
              feature: USER_FEATURES.ASSIGNEE
            });
          }
        }
      }
    });
    this.stageLoadSubscription && this.stageLoadSubscription.unsubscribe();
    this.stageLoadSubscription = this.dealsService.stageContacts$.subscribe(
      (data) => {
        this.stageContacts = data || {};
      }
    );

    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        this.location.replaceState('/contacts');
        this.userService
          .authorizeGoogleContact(params['code'])
          .subscribe((res) => {
            if (res?.status) {
              if (!areAllStringFieldsNullOrEmpty(res?.data)) {
                const columns = Object.keys(res.data);
                const lines = [];
                columns.forEach((column) => {
                  res.data[column].forEach((e, index) => {
                    if (!lines[index]) {
                      lines[index] = {};
                    }
                    lines[index][column] = e;
                  });
                });
                this.handlerService.saveCSVFileData$(columns, lines);
                this.router.navigate(['/contacts/prepare-import-csv']);
              } else {
                this.dialog.open(NotifyComponent, {
                  width: '100vw',
                  maxWidth: '360px',
                  data: {
                    message:
                      'There are not contacts are stored in your google account. Please try to import from the account that has contacts.'
                  }
                });
              }
            }
          });
      }
    });
    this.changeSearchStr
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((value) => {
        const searchOption = this.contactService.searchOption.getValue();
        searchOption.searchStr = this.searchStr;
        this.contactService.searchOption.next(
          new SearchOption().deserialize(searchOption)
        );
        this.page = 1;
        this.changePage(this.page);
      });

    this.teamService.loadAll(true);
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.stageLoadSubscription && this.stageLoadSubscription.unsubscribe();
    this.searchOptionChangeSubscription &&
      this.searchOptionChangeSubscription.unsubscribe();
    this.handlerService.pageName.next('');
  }

  ngOnInit(): void {
    this.filterService.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters) => {
        this.constListTypeOptions = [
          ...CONTACT_LIST_TYPE,
          ...filters.map((filter) => ({
            _id: filter._id,
            label: filter.title,
            description: filter.description
          }))
        ] as Array<{ _id: string; label: string; description: string }>;

        const filterId = localStorage.getCrmItem(this.FILTER);
        if (!filterId) {
          this.currentFilterId = 'own';
        } else {
          const filter = this.constListTypeOptions.find(
            (item) => item._id === filterId
          );

          if (!filter) this.currentFilterId = 'own';
          else this.currentFilterId = filterId;
          localStorage.setCrmItem(this.FILTER, this.currentFilterId);
        }
      });
    this.customFieldSubscription = this.customFieldService.fields$.subscribe(
      (_fields) => {
        const additional_fields = _fields;
        const uniqueAdditionalFields = additional_fields.filter(
          (value, index, self) =>
            index === self.findIndex((t) => t.name === value.name)
        );
        this.CUSTOM_COLUMNS = uniqueAdditionalFields;
        this.initColumns('contact_columns');
        this.initColumns('contact_share_columns');
      }
    );

    this.userService.teamInfo$.subscribe((teamInfo) => {
      this.teamMemberAvatarColors = {};

      if (teamInfo?.data?.organization?.members) {
        this.teamMemberAvatarColors = teamInfo.data.organization.members.reduce(
          (acc, member) => {
            if (member?.user && member.avatar_color) {
              acc[member.user] = member.avatar_color;
            }
            return acc;
          },
          {}
        );
      }
    });

    this.handlerService.pageName.next('contacts');
    const pageSize = this.contactService.pageSize.getValue();
    this.pageSize = { id: pageSize, label: pageSize + '' };
    this.dealsService.getStageWithContact();
    this.storeService.pageContacts$.subscribe((contacts) => {
      this.pageContacts = contacts;
      this.pageSelection = _.intersectionBy(
        this.selection,
        this.pageContacts,
        '_id'
      );
    });

    const storedSortType = localStorage.getCrmItem(this.KEY_LAST_SORT_TYPE);
    if (!storedSortType) {
      localStorage.setCrmItem(this.KEY_LAST_SORT_TYPE, this.sortType.id);
    } else {
      this.sortType = this.SORT_TYPES.find(
        (item) => item.id === storedSortType
      );
    }

    const forceReload = this.contactService.forceReload.getValue();
    if (forceReload) {
      this.contactService.reloadPage();
      this.contactService.forceReload.next(false);
    }

    const path = this.route.snapshot.routeConfig['path'];
    if (path.includes('import-csv')) {
      this.importContacts('csv');
    }

    if (!this.storeService.contactPage.getValue()) {
      this.storeService.contactPage.next(1);
    }

    this.searchOptionChangeSubscription =
      this.contactService.searchOption$.subscribe((option: SearchOption) => {
        this.searchOption = option;
        if (this.searchOption.searchStr) {
          this.searchStr = this.searchOption.searchStr;
        }
        this.pageSelection = [];
        this.selection = [];
        this.initColumns('contact_columns');
      });

    let page = 1;
    if (this.routerService.previousUrl) {
      const urlArr = this.routerService.previousUrl.split('/');
      if (urlArr[1] == 'contacts') {
        page = this.storeService.contactPage.getValue();
      }
    }

    //Get Teams
    this.teamSubscription && this.teamSubscription.unsubscribe();
    this.teamSubscription = this.teamService.teams$.subscribe((res) => {
      const teams = res;
      const internalTeam = teams.filter((e) => e.is_internal);
      if (internalTeam.length) {
        this.internalTeamCount = internalTeam.length;
        this.communityCount = teams.length - internalTeam.length;
      } else {
        this.communityCount = teams.length;
      }
    });
    this.teamService.loadAll(false);
    this.changePage(page);

    this.contactService.listTypeOption$.subscribe((listType) => {
      if (DEFAULT_LIST_TYPE_IDS.includes(this.currentFilterId)) {
        // when change the default list type with other options & remove the list type only,
        // the filter list type should changed (reset the currentFilterId)
        this.currentFilterId = listType || 'own';
      }
      this.listTypeOption = listType === 'team' ? listType : 'own';
      if (listType === 'team') {
        this.pageFilters = this.SHARED_FILTERS;
      } else {
        this.pageFilters = this.FILTERS;
      }
      this.initColumns('contact_columns');
    });
  }

  initColumns(storedKeyName: string) {
    const columns = localStorage.getCrmItem(storedKeyName);

    let displayColumns;
    if (columns && JSONParser(columns)) {
      const storedColumns = JSONParser(columns);
      const allColumnIds = [
        ...this.DEFAULT_ALL_COLUMNS,
        ...this.CUSTOM_COLUMNS
      ].map((e) => e.id);
      displayColumns = _.intersection(storedColumns, allColumnIds);
    }
    if (!displayColumns?.length) {
      displayColumns = this.DEFAULT_ALL_COLUMNS.filter((e) => e.selected).map(
        (e) => e.id
      );
    }
    localStorage.setCrmItem(storedKeyName, JSON.stringify(displayColumns));
    if (
      this.currentFilterId === 'pending' ||
      this.searchOption.listType === 'pending'
    ) {
      displayColumns.push('contact_actions');
    }
    this.setDisplayColumns(displayColumns, storedKeyName);
  }

  /**
   * Load the page contacts
   * @param page : Page Number to load
   */
  reload() {
    this.changePage(this.page);
  }

  changePage(page: number): void {
    this.page = page;
    this.storeService.contactPage.next(page);
    this.contactService.pageIndex.next(page);
    if (this.searchOption.isEmpty()) {
      // Normal Load by Page
      let skip = (page - 1) * this.pageSize.id;
      skip = skip < 0 ? 0 : skip;
      this.contactService.load(skip);
    } else {
      this.contactService.advancedSearch(page);
    }
  }
  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    this.contactService.pageSize.next(this.pageSize.id);
    // Check with the Prev Page Size
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

  /**
   * Change the sort column and dir
   * @param type: Sort Type
   */
  changeSort(type: any): void {
    this.sortType = type;
    localStorage.setCrmItem(this.KEY_LAST_SORT_TYPE, type.id);

    this.contactService.sort.next({
      ...CONTACT_SORT_OPTIONS[type.id],
      page: this.page
    });
    if (type.id === 'last_added') {
      // replace the activity with activity_added
      const pos = this.DISPLAY_COLUMNS.indexOf('activity');
      if (pos !== -1) {
        this.DISPLAY_COLUMNS.splice(pos, 1, 'activity_added');
      }
    } else {
      // replace the activty_added with activity
      const pos = this.DISPLAY_COLUMNS.indexOf('activity_added');
      if (pos !== -1) {
        this.DISPLAY_COLUMNS.splice(pos, 1, 'activity');
      }
    }
  }

  clearSearchStr(): void {
    this.searchStr = '';
    const searchOption = this.contactService.searchOption.getValue();
    searchOption.searchStr = '';
    this.contactService.searchOption.next(
      new SearchOption().deserialize(searchOption)
    );
    // this.contactService.searchStr.next('');
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
      if (this.selection.length > 10) {
        this.disableActions.push({
          label: 'New Text',
          type: 'button',
          icon: 'i-sms-sent',
          command: 'text',
          loading: false
        });
        // if (!this.isPackageDialer) {
        //   this.disableActions.push({
        //     label: 'New Call',
        //     type: 'button',
        //     icon: 'i-phone',
        //     command: 'call',
        //     loading: false
        //   });
        // }
      } else {
        this.disableActions = [];
      }
      return;
    }
    this.pageContacts.forEach((e) => {
      if (!this.isSelected(e)) {
        if (
          this.currentFilterId === 'pending' ||
          this.searchOption.listType === 'pending'
        ) {
          if (e.mainInfo.type === 'share') {
            this.pageSelection.push(e.mainInfo);
            this.selection.push(e.mainInfo);
          }
        } else {
          this.pageSelection.push(e.mainInfo);
          this.selection.push(e.mainInfo);
        }
      }
    });
    if (this.selection.length > 10) {
      this.disableActions.push({
        label: 'New Text',
        type: 'button',
        icon: 'i-sms-sent',
        command: 'text',
        loading: false
      });
      // if (!this.isPackageDialer) {
      //   this.disableActions.push({
      //     label: 'New Call',
      //     type: 'button',
      //     icon: 'i-phone',
      //     command: 'call',
      //     loading: false
      //   });
      // }
    } else {
      this.disableActions = [];
    }
    this.checkEnableStopShare();
  }
  /**
   * Toggle Element
   * @param contact : Contact
   */
  toggle(contact: ContactActivity): void {
    const selectedContact = contact.mainInfo;
    const type = selectedContact.type;
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
    if (this.selection.length > 10) {
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

    this.checkEnableStopShare();
    // if (!this.isPackageDialer) {
    //   this.disableActions.push({
    //     label: 'New Call',
    //     type: 'button',
    //     icon: 'i-phone',
    //     command: 'call',
    //     loading: false
    //   });
    // }
  }

  isDisabled(element) {
    if (
      this.selection.length &&
      (this.currentFilterId === 'pending' ||
        this.searchOption.listType === 'pending')
    ) {
      const type = this.selection[0].type;
      if (type !== element.type) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  /**
   * Check contact is selected.
   * @param contact : ContactActivity
   */
  isSelected(contact: ContactActivity): boolean {
    const index = this.pageSelection.findIndex((e) => {
      return e._id === contact.mainInfo._id;
    });
    return index !== -1;
  }
  /**
   * Check all contacts in page are selected.
   */
  isAllSelected(): boolean {
    if (this.selection.length === this.contactService.total.getValue()) {
      this.updateSelectActionStatus(false);
    } else {
      this.updateSelectActionStatus(true);
    }
    return this.pageSelection.length === this.pageContacts.length;
  }

  openFilter(): void {}

  createContact(): void {
    //sniper88t
    this.dialog
      .open(ContactCreateEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          contact: {}
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.created) {
          this.handlerService.reload$();
        }
        if (res && res.redirect && !environment.isSspa) {
          this.router.navigate(['/settings/sms']);
        }
      });
  }

  importContacts(type: string): void {
    if (type == 'csv') {
      this.dialog
        .open(UploadContactsComponent, DialogSettings.UPLOAD)
        .afterClosed()
        .subscribe((res) => {
          if (res && res.created) {
          }
        });
    } else {
      this.userService.syncGoogleContact().subscribe((res) => {
        if (res) {
          location.href = res;
        }
      });
    }
  }

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
      case 'deal':
        this.openDealDlg();
        break;
      case 'appointment':
        this.openAppointmentDlg();
        break;
      case 'call':
        this.call();
        break;
      case 'text':
        this.openTextDlg();
        break;
      case 'share':
        this.shareContacts();
        break;
      case 'move':
        this.moveContacts();
        break;
      case 'unshare':
        this.stopShareContacts();
        break;
      case 'assign':
        this.assign();
        break;
      case 'sphere_sort':
        this.sphereSort();
        break;
      case 'accept':
        this.accept();
        break;
      case 'decline':
        this.decline();
        break;
    }
  }

  /**
   * Update the Command Status
   * @param command :Command String
   * @param loading :Whether current action is running
   */
  updateActionsStatus(command: string, loading: boolean): void {
    if (
      this.currentFilterId === 'pending' ||
      this.searchOption.listType === 'pending'
    ) {
      this.PENDING_ACTIONS.some((e) => {
        if (e.command === command) {
          e.loading = loading;
          return true;
        }
      });
    } else {
      this.ACTIONS.some((e) => {
        if (e.command === command) {
          e.loading = loading;
          return true;
        }
      });
    }
  }

  updateSelectActionStatus(status: boolean): void {
    this.ACTIONS.some((e) => {
      if (e.command === 'select') {
        e.spliter = status;
      }
    });
  }

  call(): void {
    // if (this.isPackageDialer) {
    // } else {
    //   this.dialog.open(DialPlanComponent, {
    //     width: '100vw',
    //     maxWidth: '800px'
    //   });
    // }
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

  purchaseDialer(): void {
    Storm.purchaseDialer();
  }

  shareContacts(): void {
    if (this.selection.length > 50) {
      this.toast.warning(
        'Please select less or equal than 50 contacts to share contacts',
        'Too many contacts'
      );
      return;
    }
    this.dialog
      .open(ContactShareComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          contacts: this.selection
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.data) {
          this.selection.forEach((contact) => {
            const e = new ContactActivity().deserialize(contact);
            this.toggle(e);
          });
          this.handlerService.reload$();
        }
      });
  }

  moveContacts(): void {
    if (this.selection.length > 50) {
      this.toast.warning(
        'Please select less or equal than 50 contacts to move contacts',
        'Too many contacts'
      );
      return;
    }
    this.dialog
      .open(ContactMoveComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          contacts: this.selection
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.data) {
          this.selection.forEach((contact) => {
            const e = new ContactActivity().deserialize(contact);
            this.toggle(e);
          });
          this.handlerService.reload$();
        }
      });
  }

  stopShareContacts(): void {
    const selections = _.filter(
      this.selection,
      (item) => item?.['type'] === 'share'
    );

    if (selections.length) {
      if (this.isSharedAllMembers) {
        const contactIds = selections.map((e) => e._id);
        this.dialog
          .open(ConfirmComponent, {
            data: {
              title: 'Stop Share of Contact System-Wide',
              message:
                'WARNING: This action will stop sharing the contact with all Teams and Community members it is shared with.',
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
                .stopShareContacts(contactIds, this.userId)
                .subscribe((res) => {
                  selections.forEach((contact) => {
                    const e = new ContactActivity().deserialize(contact);
                    this.toggle(e);
                  });
                  this.handlerService.reload$();
                });
            }
          });
      } else {
        this.dialog
          .open(ConfirmComponent, {
            data: {
              title: 'Stop Share of Contact System-Wide',
              message:
                'WARNING: This action will stop sharing the contact with all Teams and Community members it is shared with.',
              cancelLabel: 'No',
              confirmLabel: 'Stop'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              const teamId = selections[0]['shared_team'][0];
              const members = _.uniqBy(this.sharedMembers);
              const dialog = this.dialog.open(StopShareContactComponent, {
                width: '100vw',
                maxWidth: '400px',
                data: {
                  contacts: selections,
                  members,
                  team: teamId
                }
              });
              dialog.afterClosed().subscribe((res) => {
                if (res && res.status) {
                  this.selection.forEach((contact) => {
                    const e = new ContactActivity().deserialize(contact);
                    this.toggle(e);
                  });
                  this.handlerService.reload$();
                }
              });
            }
          });
      }
    }
  }

  assign(): void {
    this.dialog
      .open(AssignmentDialogComponent, {
        width: '377px',
        height: '260px',
        disableClose: false,
        data: {
          title: 'Lead Assignment',
          label: 'Team Member',
          targetType: 'contact',
          targets: this.selection
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res?.status) {
          console.error(res?.message ?? `Error occur when assign contact`);
        }
      });
  }

  /**
   * Download CSV
   */
  csvEngin(contacts: any): void {
    this.indexOfFile += 1;
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
    const date = new Date();
    const fileName = `crmgrow Contacts-${this.indexOfFile}(${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()} ${date.getHours()}-${date.getMinutes()})`;
    saveAs(blob, fileName + '.csv');
  }

  downloadCSV(): void {
    this.updateActionsStatus('download', true);
    this.dialog
      .open(DownloadContactsProgressBarComponent, {
        width: '90vw',
        maxWidth: '800px',
        data: {
          selection: this.selection,
          custom_columns: this.CUSTOM_COLUMNS.map((e) => e.name)
        }
      })
      .afterClosed()
      .subscribe(() => {
        this.updateActionsStatus('download', false);
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
    if (this.searchOption.isEmpty()) {
      this.selecting = true;
      this.selectSubscription && this.selectSubscription.unsubscribe();
      this.selectSubscription = this.contactService
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
      this.selectSubscription = this.contactService
        .advancedSelectAll(this.searchOption)
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

  deselectAll(): void {
    this.pageSelection = [];
    this.selection = [];
    this.updateSelectActionStatus(true);
  }

  /**
   * Delete Selected Contacts
   */
  deleteConfirm(): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Delete contacts',
        message: 'Are you sure you want to delete selected contacts?',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        if (this.selection.length > 50) {
          this.all_ids = [];
          this.selection.forEach((e) => {
            this.all_ids.push(e._id);
          });
          this.deleteDlgRef = this.dialog.open(ContactDeleteComponent, {
            width: '98vw',
            maxWidth: '840px',
            disableClose: true
          });
          this.deleteDlgRef.componentInstance.allCount = this.all_ids.length;
          this.delete();
        } else {
          const ids = [];
          this.selection.forEach((e) => {
            ids.push(e._id);
          });
          this.contactService.bulkDelete(ids).subscribe((status) => {
            if (!status) {
              return;
            }
            this.handlerService.readMessageContact.next(ids);
            this.pageSelection = [];
            const { total, page } = this.contactService.delete$([
              ...this.selection
            ]);
            this.selection = [];
            if (page) {
              this.handlerService.reload$();
            }
            const maxPage =
              total % this.pageSize.id
                ? Math.floor(total / this.pageSize.id) + 1
                : total / this.pageSize.id;
            if (maxPage >= this.page) {
              this.changePage(this.page);
            }
            // this.toast.success('Seleted contacts are deleted successfully.');
          });
        }
      }
    });
  }

  delete(): void {
    const all = [...this.all_ids];
    const ids = all.splice(
      this.deleteChunk,
      this.deleteChunk + this.DELETE_ONCE
    );
    if (this.deleteChunk + this.DELETE_ONCE > this.all_ids.length) {
      this.deleteChunk = this.all_ids.length;
      this.DELETE_ONCE = this.all_ids.length % this.DELETE_ONCE;
    } else {
      this.deleteChunk += this.DELETE_ONCE;
    }
    this.deleteImpl(ids);
  }

  deleteImpl(ids: any): void {
    this.contactService.bulkDelete(ids).subscribe((status) => {
      if (!status) {
        return;
      }
      this.handlerService.readMessageContact.next(ids);
      if (this.searchStr || !this.searchOption.isEmpty()) {
        // Searched Contacts
        const selection = [...this.selection.splice(0, this.DELETE_ONCE)];
        this.pageSelection = [];
        this.contactService.delete$([...selection]);
      } else {
        // Pages Contacts
        const selection = this.selection.splice(0, this.DELETE_ONCE);
        this.pageSelection = [];
        const { total, page } = this.contactService.delete$([...selection]);
        if (page) {
          this.handlerService.reload$();
        }
        const maxPage =
          total % this.pageSize.id
            ? Math.floor(total / this.pageSize.id) + 1
            : total / this.pageSize.id;
        if (maxPage >= this.page) {
          this.changePage(this.page);
        }
      }

      this.deletePercent = Math.round(
        (this.deleteChunk / this.all_ids.length) * 100
      );
      this.deleteDlgRef.componentInstance.deletePercent = this.deletePercent;
      this.deleteDlgRef.componentInstance.deletedCount = this.deleteChunk;
      if (this.deleteChunk !== this.all_ids.length) {
        this.delete();
      } else {
        this.deleteChunk = 0;
        this.deletePercent = 0;
        this.DELETE_ONCE = 100;
        this.deleteDlgRef.componentInstance.dialogRef.close();
        // this.toast.success('Seleted contacts are deleted successfully.');
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

  openTextDlg(): void {
    const contacts = this.selection.filter((e) => e.cell_phone);
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
        type: 'multi',
        contacts
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
    this.dialog.open(ContactAssignAutomationComponent, {
      ...DialogSettings.AUTOMATION,
      data: {
        contacts: this.selection
      }
    });
  }

  openDealDlg(): void {
    // if (this.selection.length > 10) {
    //   this.toast.warning(
    //     'Please select less or equal than 10 contacts to create a new deal with them.',
    //     'Too many contacts'
    //   );
    //   return;
    // }
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
      this.editPanel.clearForm();
    }
  }

  getSharedMembers(contact): any {
    //_.remove(contact.shared_members, { _id: this.userId });
    const element = contact;
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

  /*
  Filter
  */
  toggleSideFilters(show: boolean): void {
    this.showSideFilterOptions = show;
  }
  changeFilter(evt): void {
    this.contactService.searchOption.next(evt);
    this.page = 1;
    this.changePage(this.page);
    this.initColumns('contact_columns');
  }

  selectFilter(filter): void {
    this.selectedFilter = filter;
    this.dialog
      .open(AdvancedFilterOptionComponent, {
        width: 'auto',
        minWidth: '360px',
        data: {
          filter_id: filter.id,
          title: filter.label,
          selectedTab: this.listTypeOption
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.searchOption = new SearchOption().deserialize(
            JSON.parse(
              JSON.stringify(this.contactService.searchOption.getValue())
            )
          );
          this.page = 1;
          this.changePage(this.page);
        }
      });
  }

  deletedCurrentFilter(filter: any): void {
    if (filter._id === this.currentFilterId) {
      this.currentFilterId = 'own';
      localStorage.setCrmItem(this.FILTER, this.currentFilterId);
    }
  }

  changeCurrentFilter(filter: any): void {
    this.contactService.listTypeOption.next(filter._id);
    if (DEFAULT_LIST_TYPE_IDS.includes(filter._id)) {
      this.contactService.searchOption.next(
        new SearchOption().deserialize({
          listType: filter._id
        })
      );
    } else {
      const filterData = this.filterService.filters.getValue();
      const selectedFilter = filterData.find((item) => item._id === filter._id);
      if (selectedFilter) {
        this.contactService.searchOption.next(
          new SearchOption().deserialize({
            ...selectedFilter.content
          })
        );
      }
    }
    this.selectedFilter = filter;
    this.currentFilterId = filter._id;
    localStorage.setCrmItem(this.FILTER, this.currentFilterId);
    this.initColumns('contact_columns');
  }

  clearAllFilters(): void {
    this.currentFilterId = 'own';
    localStorage.setCrmItem(this.FILTER, this.currentFilterId);
    this.selectedMaterial = [];
    this.selectedMaterialActions = '';
    this.materialActions.forEach((action) => {
      action.count = 0;
    });
    this.searchStr = '';
    this.searchOption = new SearchOption();
    this.contactService.searchOption.next(this.searchOption);
    this.contactService.listTypeOption.next('own');
  }

  saveFilters(addNew = false): void {
    const searchOption = this.searchOption;
    if (!searchOption.getActiveOptions()) {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          title: 'Advanced Filter',
          message: 'Please set the filter option at least one.',
          cancelLabel: 'Close'
        }
      });
      return;
    }

    if (this.isCustomFilter() && !addNew) {
      this.dialog
        .open(FilterAddComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '600px',
          data: {
            searchOption: this.searchOption,
            material: this.selectedMaterial,
            _id: this.currentFilterId
          }
        })
        .afterClosed()
        .subscribe((res) => {
          // this.getSavedFilters();
        });
    } else {
      this.dialog
        .open(FilterAddComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '600px',
          data: {
            searchOption: this.searchOption,
            material: this.selectedMaterial,
            type: this.listTypeOption
          }
        })
        .afterClosed()
        .subscribe((res) => {
          // this.getSavedFilters();
        });
    }
  }

  // Reset the Selection without current Contact page to fix when merge
  // this.selection = _.differenceBy(this.selection, this.pageContacts, '_id');
  // Merge the All Selection with page Selection
  // this.selection = _.unionBy(this.selection, this.pageSelection, '_id');

  /* Column Edit Part */
  setDisplayColumns(columns, storedKeyName): void {
    const sortInfo = this.contactService.sort.getValue();
    if (storedKeyName === 'contact_columns') {
      this.DISPLAY_COLUMNS = ['select', ...columns];
    } else {
      this.SHARE_CONTACT_COLUMNS = ['select', ...columns];
    }
  }

  openColumnEdit(): void {
    const columnsTarget =
      this.listTypeOption === 'own'
        ? 'contact_columns'
        : 'contact_share_columns';
    this.dialog
      .open(ColumnEditComponent, {
        position: { top: '100px' },
        width: '150vw',
        maxWidth: '1000px',
        data: {
          defaultColumns: this.DEFAULT_ALL_COLUMNS,
          customColumns: this.CUSTOM_COLUMNS,
          columnsTarget
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.selectedColumns) {
          this.setDisplayColumns(res.selectedColumns, columnsTarget);
        }
      });
  }

  getAdditionalFieldVal(element: any, column: string): string {
    let value = '';
    if (element.additional_field && element.additional_field[column]) {
      value = element.additional_field[column];
    }
    return value;
  }

  toggleCustomColumnFilter(): void {
    this.customColumnFilter = !this.customColumnFilter;
  }

  selectCustomColumnFilter(column: string) {
    this.dialog
      .open(AdvancedFilterOptionComponent, {
        width: 'auto',
        minWidth: '360px',
        data: {
          filter_id: 'custom_field',
          title: column
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.searchOption = new SearchOption().deserialize(
            JSON.parse(
              JSON.stringify(this.contactService.searchOption.getValue())
            )
          );
          this.page = 1;
          this.changePage(this.page);
        }
      });
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

  getAssigneeAvatarName(element: any): string {
    const user_name = this.getAssigneeName(element) || '';
    const names = user_name.trim().split(' ');

    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    } else if (names.length === 1 && names[0].length >= 2) {
      return names[0].substring(0, 2).toUpperCase();
    } else if (names[0].length === 1) {
      return names[0][0].toUpperCase();
    }

    return 'UN';
  }

  getAssigneeAvatarColor(element: any): string {
    let assigneeId = '';

    if (element.owner) {
      if (Array.isArray(element.owner) && element.owner.length) {
        assigneeId = element.owner[0]._id;
      } else {
        assigneeId = element.owner._id;
      }
    }

    return this.teamMemberAvatarColors[assigneeId] || '';
  }

  getAssignee(element: any): any {
    if (Array.isArray(element.owner)) {
      if (element.owner.length > 0) {
        return element.owner[0]._id;
      }
      return undefined;
    }

    return element.owner?._id;
  }

  changeAssignee(event: string, element: ContactActivity): void {
    const assignee = event ? event : null;
    if (!element?._id || this.getAssignee(element) === event) {
      return;
    }
    if (event) {
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.contactService
        .bulkUpdate([element._id], { owner: assignee }, {})
        .subscribe((status) => {
          if (status) {
            this.handlerService.bulkContactUpdate$(
              [element._id],
              { owner: assignee },
              {}
            );
          }
        });
    }
  }

  checkEnableStopShare(): void {
    this.sharedMembers = [];
    this.isSharedAllMembers = false;
    let bulkStopSharable = false;

    const selections = _.filter(
      this.selection,
      (item) => item?.['type'] === 'share'
    );

    if (selections.length > 1) {
      // if multi contact is selected then it will be "all stop share"
      bulkStopSharable = true;
      this.isSharedAllMembers = true;
    } else if (selections.length === 1) {
      const selectedContact = selections[0];
      if (selectedContact?.shared_all_member) {
        // all team member are shared
        bulkStopSharable = true;
        this.isSharedAllMembers = true;
      } else {
        // individual team member is shared
        this.sharedMembers = [
          ...(selectedContact['shared_members'] ?? []),
          ...(selectedContact['pending_users'] ?? [])
        ];
        if (this.sharedMembers.length > 0) {
          bulkStopSharable = true;
        }
      }
    }
    const index = this.disableActions.findIndex(
      (e) => e.label === 'Stop Share'
    );
    if (!bulkStopSharable) {
      if (index === -1) {
        this.disableActions.push(this.stopShareAction);
      }
    } else {
      if (index !== -1) {
        this.disableActions.splice(index, 1);
      }
    }
  }

  sphereSort(): void {
    this.contactService.contactsToSort.next(this.selection);
    this.router.navigate(['/contacts/sorting']);
  }

  resetListType(): void {
    this.contactService.listTypeOption.next('own');
  }

  gotoPreference(): void {
    this.router.navigate(['/contacts/contact-manager/tag-manager']);
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
      this.updateActionsStatus('accept', true);
      selectedElements = this.pageContacts.filter((e) => this.isSelected(e));
    }
    const type = selectedElements[0].type;
    if (type === 'share') {
      const share_ids = selectedElements.map((e) => e._id);
      if (!share_ids.length) {
        this.deselectAll();
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
          this.contactService.acceptSharing(data).subscribe((res) => {
            this.deselectAll();
            if (res) {
              this.changePage(this.page);
              this.handlerService.reload$();
            }
          });
        });
    } else {
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
              });
            } else {
              this.deselectAll();
            }
          });
      } else {
        this.acceptImpl(selectedElements).then(() => {
          this.handlerService.reload$();
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
        this.deselectAll();
        reject();
        return;
      }

      const data = { acceptLists, customFields };
      this.contactService.moveAcceptRequest(data).subscribe((res) => {
        if (!res) {
          this.deselectAll();
          resolve();
        } else if (res.status) {
          this.deselectAll();
          this.changePage(this.page);
          resolve();
        } else {
          this.deselectAll();
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
      this.updateActionsStatus('decline', true);
      selectedElements = this.selection;
    }
    const type = selectedElements[0].type;
    if (type === 'share') {
      const share_ids = selectedElements.map((e) => e._id);
      if (!share_ids.length) {
        this.deselectAll();
        return;
      }

      const data = share_ids;
      this.contactService.declineSharing(data).subscribe((res) => {
        this.deselectAll();
        if (res) {
          this.changePage(this.page);
        }
      });
    } else {
      const declineLists = selectedElements.map((e) => ({
        type: e.type,
        id: e._id
      }));
      if (!declineLists.length) {
        this.deselectAll();
        return;
      }

      const data = { declineLists };
      this.contactService.moveDeclineRequest(data).subscribe((res) => {
        this.deselectAll();
        if (res) {
          this.changePage(this.page);
        }
      });
    }
  }

  sharedWithContactSelected() {
    if (this.selection?.length === 0) {
      return false;
    }
    let result = false;

    for (let index = this.selection.length - 1; index >= 0; index--) {
      const element: any = this.selection[index];
      if (
        (element.shared_members && element.shared_members.length > 0) ||
        element.shared_all_member
      ) {
        if (
          this.userId !== element.user &&
          this.userId !== element.user?.[0]?._id
        ) {
          result = true;
          break;
        }
      }
    }
    return result;
  }
  isEditableFilter() {
    return (
      this.currentFilterId &&
      !DEFAULT_LIST_TYPE_IDS.includes(this.currentFilterId)
    );
  }
  editFilter() {
    this.dialog
      .open(FilterAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        data: {
          saveOption: 'save_as',
          searchOption: this.searchOption,
          _id: this.currentFilterId
        }
      })
      .afterClosed()
      .subscribe((res) => {});
  }
  isCustomFilter() {
    return ![
      'own',
      'team',
      'private',
      'prospect',
      'assigned',
      'pending'
    ].includes(this.currentFilterId);
  }
}
