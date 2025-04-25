import { SspaService } from '../../services/sspa.service';
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ViewContainerRef,
  ChangeDetectorRef
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { DagreNodesOnlyLayout } from '@variables/customDagreNodesOnly';
import { stepRound } from '@variables/customStepCurved';
import { Layout, GraphComponent } from '@swimlane/ngx-graph';
import { MatDialog } from '@angular/material/dialog';
import {
  ACTION_CAT,
  ACTION_METHOD,
  AUTOMATION_ICONS,
  TRIGGER_ICON_DICS,
  BulkActions,
  CONTACT_PROPERTIES,
  DialogSettings,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { CaseConfirmComponent } from '@components/case-confirm/case-confirm.component';
import { AutomationService } from '@services/automation.service';
import { LabelService } from '@services/label.service';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { PageCanDeactivate } from '@variables/abstractors';
import { UserService } from '@services/user.service';
import { TabItem } from '@utils/data.types';
import { SelectionModel } from '@angular/cdk/collections';
import { AutomationAssignComponent } from '@components/automation-assign/automation-assign.component';
import { Contact, ContactActivity } from '@models/contact.model';
import { ContactService } from '@services/contact.service';
import { HandlerService } from '@services/handler.service';
import { SendEmailComponent } from '@components/send-email/send-email.component';
import { NoteCreateComponent } from '@components/note-create/note-create.component';
import { ContactAssignAutomationComponent } from '@components/contact-assign-automation/contact-assign-automation.component';
import { NotifyComponent } from '@components/notify/notify.component';
import { MatDrawer } from '@angular/material/sidenav';
import { Automation } from '@models/automation.model';
import { OverlayService } from '@services/overlay.service';
import { TeamMaterialShareComponent } from '@components/team-material-share/team-material-share.component';
import { CaseMaterialConfirmComponent } from '@components/case-material-confirm/case-material-confirm.component';
import { environment } from '@environments/environment';
import { AddActionComponent } from '@components/add-action/add-action.component';
import { StoreService } from '@services/store.service';
import { EditActionComponent } from '@components/edit-action/edit-action.component';
import { SelectBranchComponent } from '@components/select-branch/select-branch.component';
import { CaseConfirmPercentComponent } from '@components/case-confirm-percent/case-confirm-percent.component';
import { User } from '@models/user.model';
import { ConfirmRemoveAutomationComponent } from '@components/confirm-remove-automation/confirm-remove-automation.component';
import { MaterialService } from '@services/material.service';
import { CaseConfirmKeepComponent } from '@components/case-confirm-keep/case-confirm-keep.component';
import { DealsService } from '@services/deals.service';
import { UnassignBulkAutomation } from '@components/unassign-bulk-automation/unassign-bulk-automation.component';
import { Deal } from '@models/deal.model';
import { DialerService } from '@services/dialer.service';
import { RemoveActionComponent } from '@components/remove-action/remove-action.component';
import { SelectContactConditionComponent } from '@components/select-contact-condition/select-contact-condition.component';
import moment from 'moment-timezone';
import { validateDateTime } from '@utils/functions';
import {
  CheckRequestItem,
  DownloadRequest
} from '@core/interfaces/resources.interface';
import { DownloadContactsProgreeBarComponent } from '@app/components/contact-download-progress-bar/contact-download-progress-bar.component';
import { TaskCreateComponent } from '@app/components/task-create/task-create.component';
import { SendTextComponent } from '@app/components/send-text/send-text.component';
import { DealCreateComponent } from '@app/components/deal-create/deal-create.component';
import { CalendarEventDialogComponent } from '@app/components/calendar-event-dialog/calendar-event-dialog.component';
import { ContactBulkComponent } from '@app/components/contact-bulk/contact-bulk.component';
import { ContactShareComponent } from '@app/components/contact-share/contact-share.component';
import { AutomationHeaderUpdateComponent } from '@app/components/automation-header-update/automation-header-update.component';
import { sortEdges } from '@app/helper';
import { v4 as uuidv4 } from 'uuid';
import { ITrigger } from '@app/types/trigger';
import { LeadFormService } from '@app/services/lead-form.service';
@Component({
  selector: 'app-autoflow',
  templateUrl: './autoflow.component.html',
  styleUrls: ['./autoflow.component.scss']
})
export class AutoflowComponent
  extends PageCanDeactivate
  implements OnInit, OnDestroy, AfterViewInit
{
  readonly isSspa = environment.isSspa;
  readonly TRIGGER_ICONS = TRIGGER_ICON_DICS;
  layoutSettings = {
    orientation: 'TB'
  };
  center$: Subject<boolean> = new Subject();
  panToNode$: Subject<string> = new Subject();
  curve = stepRound;
  public layout: Layout = new DagreNodesOnlyLayout();
  initEdges = [];
  initNodes = [{ id: 'start', label: '' }];
  TYPES = [
    { id: 'contact', label: 'Contact' },
    { id: 'deal', label: 'Pipeline Deal' },
    { id: 'deal stage', label: 'Pipeline Stage' },
    { id: 'lead capture', label: 'Lead Form' },
    { id: 'scheduler', label: 'Scheduler' },
    { id: 'smart code', label: 'Smart Code' },
    { id: 'modular', label: 'Modular' }
  ];
  contactTypes = [
    { id: 'contact', label: 'Contact' },
    { id: 'lead capture', label: 'Lead Form' },
    { id: 'scheduler', label: 'Scheduler' },
    { id: 'smart code', label: 'Smart Code' },
    { id: 'modular', label: 'Modular' }
  ];
  dealTypes = [
    { id: 'deal', label: 'Pipeline Deal' },
    { id: 'deal stage', label: 'Pipeline Stage' },
    { id: 'modular', label: 'Modular' }
  ];
  type;
  edges = [];
  nodes = [];
  automations: Automation[] = [];
  _id;
  automation;
  label = 'contact';
  automation_id;
  team_id;
  automation_title = '';
  automation_description: string;
  automation_type = 'any';
  isSaving = false;
  user_id;
  owner_id;
  auth;
  created_at;
  identity = 1;
  submitted = false;
  saved = true;
  autoZoom = true;
  zoomLevel = 1;
  autoCenter = true;
  editMode = 'new';
  contacts = 0;
  activeCount = 0;
  selectedContacts = new SelectionModel<any>(true, []);
  labels = [];
  assignedContactLoading = false;
  deleting = false;
  loadSubscription: Subscription;
  automationsSubscription: Subscription;
  lastUpdatedAction = null;
  lastUpdatedLink = null;
  libraries: Automation[] = [];
  isMine = false;
  is_sharable = true;
  is_active = false;

  tabs: TabItem[] = [{ icon: '', label: 'Builder', id: 'activity' }];

  selectedTab: TabItem = this.tabs[0];

  CONTACT_ACTIONS = BulkActions.AssignAutomations;
  DISPLAY_COLUMNS = [
    'select',
    'contact_name',
    'contact_label',
    'contact_tags',
    'contact_email',
    'contact_phone',
    'contact_address'
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[0];
  page = 1;
  searchStr = '';
  selecting = false;
  selectSubscription: Subscription;
  selectSource = '';
  selection: Contact[] = [];
  pageSelection: Contact[] = [];
  pageContacts: ContactActivity[] = [];
  user: User = new User();
  // Variables for Label Update
  isUpdating = false;
  updateSubscription: Subscription;
  searchSubscription: Subscription;

  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('graphWrapper') graphWrapper: GraphComponent;
  panelType = '';
  @ViewChild('wrapper') wrapper: ElementRef;
  wrapperWidth = 0;
  wrapperHeight = 0;
  offsetX = 0;
  offsetY = 0;
  profileSubscription: Subscription;
  routeSubscription: Subscription;
  disableActions = [];
  isPackageGroupEmail = true;
  isPackageAutomation = true;
  prevNode;

  loadingAutomation = false;

  deals = [];

  DEAL_ACTIONS = BulkActions.AssignDealAutomations;
  DEAL_DISPLAY_COLUMNS = [
    'select',
    'deal_title',
    'pipeline',
    'deal_stage',
    'deal_contacts'
  ];
  DEAL_PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  moveOptions = [
    {
      id: 1,
      value: 'Transfer',
      comment:
        'Transfer contacts help, Would you transfer contacts? Yes, please'
    },
    {
      id: 2,
      value: 'Clone',
      comment: 'Clone contacts help, Would you clone contacts? Yes, please'
    }
  ];
  dealPageSize = this.DEAL_PAGE_COUNTS[0];
  dealPage = 1;
  dealSearchStr = '';
  dealSelecting = false;
  dealSelectSubscription: Subscription;
  dealSearchSubscription: Subscription;
  dealSelectSource = '';
  dealSelection: Deal[] = [];
  dealPageSelection: Deal[] = [];
  loadingDeals = false;

  totalDeals = 0;
  assignedDealLoading = false;
  pageDeals = [];
  isSafari = false;

  COUNTRIES: { code: string; name: string }[] = [];
  COUNTRY_REGIONS: any[] = [];

  @ViewChild('addDrawer') addDrawer: MatDrawer;
  @ViewChild('addPanel') addPanel: AddActionComponent;
  @ViewChild('editDrawer') editDrawer: MatDrawer;
  @ViewChild('editPanel') editPanel: EditActionComponent;
  @ViewChild('removeDrawer') removeDrawer: MatDrawer;
  @ViewChild('removePanel') removePanel: RemoveActionComponent;
  @ViewChild('contactDrawer') contactDrawer: MatDrawer;
  @ViewChild('editContactPanel') editContactPanel: ContactBulkComponent;
  @ViewChild('triggerDrawer') triggerDrawer: MatDrawer;

  receiveActionSubscription: Subscription;
  actionMethod = '';
  actionParam;
  isFullScreen = false;

  casePercentConfirmDialog = null;
  caseViewConfirmDialog = null;

  materials = [];
  updateTimelineOption = 'update';
  isEditTitleMode = false;
  actionTimelines = [];
  stages = [];
  lead_fields: any[] = [];
  garbageSubscription: Subscription;
  minRowCount = MIN_ROW_COUNT;
  customTokens = [];
  actionCount = 0;
  actions = [];
  automationTrigger: ITrigger | null;

  constructor(
    private dialog: MatDialog,
    private automationService: AutomationService,
    public labelService: LabelService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private userService: UserService,
    public contactService: ContactService,
    private overlayService: OverlayService,
    private handlerService: HandlerService,
    private viewContainerRef: ViewContainerRef,
    public storeService: StoreService,
    public materialService: MaterialService,
    private dealsService: DealsService,
    private dialerService: DialerService,
    private leadFormService: LeadFormService,
    public sspaService: SspaService,
    private cdr: ChangeDetectorRef
  ) {
    super();
    this.leadFormService.loadList();
    this.receiveActionSubscription &&
      this.receiveActionSubscription.unsubscribe();
    this.receiveActionSubscription =
      this.storeService.actionOutputData$.subscribe((res) => {
        if (res) {
          this.runAction(res);
        }
      });

    // this.automationService.loadAll(true);
    this.automationService.loadOwn(true);

    this.handlerService.pageName.next('detail');
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.lead_fields = _garbage.additional_fields.map((e) => e);
        this.customTokens = _garbage.template_tokens;
      }
    );
  }

  ngOnInit(): void {
    this.type = undefined;
    this.materialService.loadOwn(true);
    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });

    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      this.isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );
      this.profileSubscription && this.profileSubscription.unsubscribe();
      this.profileSubscription = this.userService.profile$.subscribe((res) => {
        this.user = res;
        this.user_id = res._id;
        this.isPackageGroupEmail = res.email_info?.mass_enable;
        this.isPackageAutomation = res.automation_info?.is_enabled;
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
            label: 'Add automation',
            type: 'button',
            icon: 'i-automation',
            command: 'automation',
            loading: false
          });
        }
        this.arrangeAutomationData();
      });
      this.automationsSubscription &&
        this.automationsSubscription.unsubscribe();
      this.automationsSubscription =
        this.automationService.automations$.subscribe((res) => {
          this.automations = res;
        });
      this.automation_id = params['id'];
      this.team_id = params['team'];
      const title = params['title'];
      const mode = params['mode'] || 'new';
      this.editMode = mode;
      let page = '';

      if (this.editMode !== 'new') {
        page = localStorage.getCrmItem('automation') || '';
      }

      this.COUNTRIES = this.contactService.COUNTRIES;
      this.COUNTRY_REGIONS = this.contactService.COUNTRY_REGIONS;

      this.labelService.allLabels$.subscribe((res) => {
        this.labels = res;
      });
      if (title) {
        this.automation_title = title;
      } else {
        this.automation_title = `Automation ${moment().format('ll')}`;
      }
      if (this.automation_id) {
        this.automationService
          .get(this.automation_id, this.pageSize.id, 0)
          .subscribe((res) => {
            if (res) {
              this.automationTrigger = res.trigger;
              this.is_active = res.is_active;
              this.automation_type = res['type'] || 'any';
              this.storeService.automationType.next(this.automation_type); // Conflicted
              this.label = res['label'] || 'contact';
              this.contacts = res['contacts'].count || 0;
              this.totalDeals = res['deals']?.count || 0;
              this.afterCheckAutomationType();

              if (this.editMode === 'edit') {
                const filterTabs = this.tabs.filter((e) => e.id === page);
                if (filterTabs.length == 0) {
                  this.selectedTab = this.tabs[0];
                  page = 'activity';
                } else this.selectedTab = filterTabs[0];
              }
              if (
                page === 'activity' ||
                page === '' ||
                (this.automation_type === 'contact' && page === 'deals') ||
                (this.automation_type === 'deal' && page === 'contacts')
              ) {
                this.loadAutomation(
                  this.automation_id,
                  this.pageSize.id,
                  0,
                  undefined,
                  res
                );
              } else {
                if (this.automation_type === 'deal') {
                  this.loadDeals(this.automation_id, this.dealPageSize.id, 0);
                } else if (this.automation_type === 'contact') {
                  this.loadContacts(
                    this.automation_id,
                    this.pageSize.id,
                    0,
                    res
                  );
                } else {
                  this.loadAutomation(
                    this.automation_id,
                    this.pageSize.id,
                    0,
                    undefined,
                    res
                  );
                }
              }
            } else {
              this.router.navigate(['/automations/own/root']);
            }
          });
      } else {
        this.auth = 'owner';
        const curDate = new Date();
        this.created_at = curDate.toISOString();

        // insert start action
        this.nodes.push({
          category: ACTION_CAT.TRIGGER,
          id: 'a_10000',
          index: 10000,
          label: 'TRIGGER',
          leaf: true,
          type: 'trigger'
        });
      }

      window['confirmReload'] = true;

      // disable auto center for flipping issue when add action.
      setTimeout(() => {
        this.autoCenter = false;
        this.autoZoom = false;
        this.center$.next(false);
      }, 500);
    });
  }

  ngOnDestroy(): void {
    // this.storeData();
    this.receiveActionSubscription &&
      this.receiveActionSubscription.unsubscribe();
    this.routeSubscription && this.routeSubscription.unsubscribe();
    window['confirmReload'] = false;
  }

  ngAfterViewInit(): void {
    this.onResize(null);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {
    if (this.wrapper) {
      this.wrapperWidth = this.wrapper.nativeElement.offsetWidth;
      this.wrapperHeight = this.wrapper.nativeElement.offsetHeight;
    }
  }

  loadAutomation(
    id: string,
    count: number,
    page: number,
    tabItem?: TabItem | undefined,
    resAutomation?: Automation
  ): void {
    const tab = tabItem || this.tabs[0];
    if (this.editMode === 'edit') {
      if (this.automation_type === 'contact') {
        this.TYPES = this.contactTypes;
      } else {
        this.TYPES = this.dealTypes;
      }
    }
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadingAutomation = true;
    this.loadingDeals = true;
    this.loadSubscription = this.automationService.libraries$.subscribe(
      (libraries) => {
        this.libraries = libraries;
      }
    );
    if (resAutomation) {
      this.afterLoadAutomation(resAutomation, tabItem);
    } else {
      this.loadSubscription = this.automationService
        .get(id, count, page)
        .subscribe(
          (res) => {
            this.afterLoadAutomation(res, tabItem);
          },
          (err) => {
            this.loadingAutomation = false;
          }
        );
    }
  }
  afterLoadAutomation = (res: Automation, tabItem?: TabItem) => {
    const tab = tabItem || this.tabs[0];
    if (res) {
      this.automation = res;
      this.is_sharable = this.automation?.is_sharable;
      this.automation_type = this.automation?.type;
      this.storeService.automationType.next(this.automation_type); // conflicted
      this.label = this.automation.label;
      const mode = this.editMode;
      if (mode === 'edit') {
        this.automation_id = res['_id'];
      }
      this.automation_title = mode === 'edit' ? res['title'] : '';
      this.automation_description = mode === 'edit' ? res['description'] : '';
      this.arrangeAutomationData();
      this.owner_id = this.automation.user;
      this.activeCount =
        (this.automation.contacts?.count || 0) +
        (this.automation.deals?.count || 0);
      if (
        this.automation_type !== 'deal' ||
        this.automation.contacts?.count > 0
      ) {
        this.contacts = this.automation.contacts
          ? this.automation.contacts.count
          : null;

        if (this.automation.contacts.contacts.length) {
          this.assignedContactLoading = true;
          this.automationService
            .getStatus(this.automation._id, this.automation.contacts.contacts)
            .subscribe((contacts) => {
              this.assignedContactLoading = false;
              this.pageContacts = [];
              if (this.editMode !== 'new') {
                for (let i = 0; i < contacts.length; i++) {
                  const newContact = new ContactActivity().deserialize(
                    contacts[i]
                  );
                  this.pageContacts.push(newContact);
                }
              }
            });
        }
      }
      if (
        this.automation_type !== 'contact' ||
        this.automation.deals?.count > 0
      ) {
        this.afterLoadDeals(res);
      }
      this.actions = res['automations'];
      this.actionCount = (this.actions || []).length;
      this.composeGraph(this.actions);
      this.selectedTab = tab;
    } else {
      this.loadingAutomation = false;
    }
  };
  loadContacts(
    id: string,
    count: number,
    page: number,
    resAutomation?: Automation
  ): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    if (resAutomation) {
      this.afterLoadContacts(resAutomation);
    } else {
      this.loadSubscription = this.automationService
        .get(id, count, page)
        .subscribe(
          (res) => {
            this.afterLoadContacts(res);
          },
          (err) => {}
        );
    }
  }
  afterLoadContacts = (res: Automation) => {
    this.automation = res;
    this.contacts = this.automation.contacts.count;
    this.totalDeals = this.automation.deals?.count || 0;
    this.activeCount =
      (this.automation.contacts?.count || 0) +
      (this.automation.deals?.count || 0);
    this.owner_id = this.automation.user;
    const mode = this.route.snapshot.params['mode'];
    if (this.automation.contacts.contacts.length) {
      this.assignedContactLoading = true;
      this.automationService
        .getStatus(this.automation._id, this.automation.contacts.contacts)
        .subscribe((contacts) => {
          this.assignedContactLoading = false;
          this.pageContacts = [];
          for (let i = 0; i < contacts.length; i++) {
            const newContact = new ContactActivity().deserialize(contacts[i]);
            this.pageContacts.push(newContact);
          }
          this.pageSelection = _.intersectionBy(
            this.selection,
            this.pageContacts,
            '_id'
          );
        });
    } else {
      this.pageContacts = [];
      this.pageSelection = _.intersectionBy(
        this.selection,
        this.pageContacts,
        '_id'
      );
    }

    if (mode === 'edit') {
      this.automation_id = res['_id'];
    }
    this.automation_title = res['title'];
  };

  availableLabel(label): boolean {
    if (this.label === label) {
      return true;
    }
    if (label === 'modular') {
      return true;
    }
    if (label === 'deal' || label === 'deal stage') {
      let hasNoSwitchableActions = false;
      for (const node of this.nodes) {
        if (this.NoSwitchableActions.indexOf(node.type) >= 0) {
          hasNoSwitchableActions = true;
          break;
        }
      }
      if (hasNoSwitchableActions) {
        const dealNode = this.nodes.findIndex((item) => item.type === 'deal');
        if (dealNode >= 0) {
          return false;
        }
      }
      for (const node of this.nodes) {
        if (node.type === 'automation') {
          hasNoSwitchableActions = true;
          break;
        }
      }
      if (hasNoSwitchableActions) return false;
    } else {
      let hasMultipleBranch = false;
      for (const edge of this.edges) {
        if (!edge.category) {
          const index = this.edges.findIndex(
            (item) => item.source === edge.source && item.id !== edge.id
          );
          if (index >= 0) {
            hasMultipleBranch = true;
            break;
          }
        }
      }
      if (hasMultipleBranch) {
        return false;
      }
      let hasNoSwitchableActions = false;
      for (const node of this.nodes) {
        if (node.type === 'automation' || node.type === 'move_deal') {
          hasNoSwitchableActions = true;
          break;
        }
        if (!this.isAvailableAssignAt('contact', node)) {
          node.group = undefined;
        }
      }
      if (hasNoSwitchableActions) {
        return false;
      }
    }
    return true;
  }

  onChange(value): void {
    if (value === 'modular') {
      this.isEditTitleMode = true;
      return;
    }
    if (value === 'deal' || value === 'deal stage') {
      let hasNoSwitchableActions = false;
      for (const node of this.nodes) {
        if (this.NoSwitchableActions.indexOf(node.type) >= 0) {
          hasNoSwitchableActions = true;
          break;
        }
      }
      if (hasNoSwitchableActions) {
        const dealNode = this.nodes.findIndex((item) => item.type === 'deal');
        if (dealNode >= 0) {
          this.dialog.open(NotifyComponent, {
            maxWidth: '400px',
            width: '96vw',
            data: {
              message: `Automation type cannot be changed because it contains "New Deal", "Move Deal" or "Automation" actions. Please remove these actions and try again or create a new automation instead.`
            }
          });
          return;
        }
      }
      // this.automation_type = 'deal';
      this.storeService.automationType.next('deal');
    } else {
      let hasMultipleBranch = false;
      for (const edge of this.edges) {
        if (!edge.category) {
          const index = this.edges.findIndex(
            (item) => item.source === edge.source && item.id !== edge.id
          );
          if (index >= 0) {
            hasMultipleBranch = true;
            break;
          }
        }
      }
      if (hasMultipleBranch) {
        this.dialog.open(NotifyComponent, {
          maxWidth: '400px',
          width: '96vw',
          data: {
            message:
              'Automation type cannot be changed when there are branches saved in the automation. Please remove all branches and try again or create a new automation instead.'
          }
        });
        return;
      }
      let hasNoSwitchableActions = false;
      for (const node of this.nodes) {
        if (node.type === 'automation' || node.type === 'move_deal') {
          hasNoSwitchableActions = true;
          break;
        }
        if (!this.isAvailableAssignAt('contact', node)) {
          node.group = undefined;
        }
      }
      if (hasNoSwitchableActions) {
        this.dialog.open(NotifyComponent, {
          maxWidth: '400px',
          width: '96vw',
          data: {
            message: `Automation type cannot be changed because it contains "New Deal", "Move Deal" or "Automation" actions. Please remove these actions and try again or create a new automation instead.`
          }
        });
        return;
      }
      // this.automation_type = 'contact';
      this.storeService.automationType.next('contact');
    }
    this.isEditTitleMode = true;
    this.label = value;
    // if (this.editMode !== 'new' && this.isEditable()) {
    //   this.storeData();
    // }
  }

  afterLoadDeals(auto_res: Automation): void {
    this.loadingDeals = true;
    this.automation = auto_res;
    this.owner_id = this.automation.user;
    this.totalDeals = this.automation?.deals?.count || 0;
    this.activeCount =
      (this.automation.contacts?.count || 0) +
      (this.automation.deals?.count || 0);
    const newPageDeals = [];
    this.deals = [];
    const mode = this.route.snapshot.params['mode'];
    if (this.automation?.deals?.deals?.length > 0) {
      const deals = this.automation?.deals?.deals;
      this.dealsService.getDeals({ dealIds: deals }).subscribe((res) => {
        this.loadingDeals = false;
        if (res?.deals?.length > 0) {
          const pipelines = this.dealsService.pipelines.getValue() || [];
          for (const deal of res.deals) {
            let pipeline;
            if (deal.deal.deal_stage && deal.deal.deal_stage.pipe_line) {
              const index = pipelines.findIndex(
                (_pipeline) => _pipeline._id == deal.deal.deal_stage.pipe_line
              );
              if (index >= 0) {
                pipeline = pipelines[index];
              }
            }
            newPageDeals.push({
              ...deal,
              pipeline
            });
            this.deals.push(deal.deal);
          }
        }
        this.pageDeals = newPageDeals;
        this.cdr.detectChanges();
        this.dealPageSelection = _.intersectionBy(
          this.dealSelection,
          this.deals,
          '_id'
        );

        if (mode === 'edit') {
          this.automation_id = auto_res['_id'];
        }
        this.automation_title = auto_res['title'];
      });
    } else {
      this.pageDeals = [];
      this.loadingDeals = false;
    }
  }
  loadDeals(id: string, count: number, page: number): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadingDeals = true;
    this.loadSubscription = this.automationService
      .get(id, count, page)
      .subscribe((res) => {
        this.afterLoadDeals(res);
      });
  }
  loadBoth(id: string, count: number, page: number): void {}

  arrangeAutomationData(): void {
    if (this.automation) {
      if (this.automation.role === 'admin') {
        this.auth = 'admin';
      } else if (this.automation.role === 'team') {
        if (this.automation.user === this.user_id) {
          this.auth = 'team';
        } else {
          this.auth = 'shared';
        }
      }
      this.created_at = this.automation.created_at;
    } else {
      this.auth = 'owner';
      const curDate = new Date();
      this.created_at = curDate.toISOString();
    }
  }

  composeGraph(actions): void {
    this.autoZoom = true;
    const ids = [];
    const nodes = [];
    const edges = [];
    const caseNodes = {}; // Case nodes pair : Parent -> Sub case actions
    const edgesBranches = []; // Edge Branches
    if (actions) {
      nodes.push({
        category: ACTION_CAT.TRIGGER,
        id: 'a_10000',
        index: 10000,
        label: 'TRIGGER',
        leaf: true,
        type: 'trigger'
      });
    }
    if (actions) {
      actions.forEach((e) => {
        const node = {
          id: e.id,
          index: this.genIndex(e.id),
          period: e.period
        };
        if (e.condition) {
          if (e.action) {
            if (
              e.type === 'deal' &&
              e.action.type !== 'deal' &&
              this.automation_type !== 'deal'
            ) {
              node['parent_type'] = 'deal';
            }
            let type = e.action.type;
            const videos = e.action.videos ? e.action.videos : [];
            const pdfs = e.action.pdfs ? e.action.pdfs : [];
            const images = e.action.images ? e.action.images : [];
            const materials = [...videos, ...pdfs, ...images];

            if (e.action.type === 'text') {
              if (materials.length === 0) {
                type = 'text';
              } else {
                if (materials.length === 1) {
                  if (videos.length > 0) {
                    type = 'send_text_video';
                  }
                  if (pdfs.length > 0) {
                    type = 'send_text_pdf';
                  }
                  if (images.length > 0) {
                    type = 'send_text_image';
                  }
                } else if (materials.length > 1) {
                  type = 'send_text_material';
                }
              }
            } else if (e.action.type === 'email') {
              if (materials.length === 0) {
                type = 'email';
              } else {
                if (materials.length === 1) {
                  if (videos.length > 0) {
                    type = 'send_email_video';
                  }
                  if (pdfs.length > 0) {
                    type = 'send_email_pdf';
                  }
                  if (images.length > 0) {
                    type = 'send_email_image';
                  }
                } else if (materials.length > 1) {
                  type = 'send_email_material';
                }
              }
            }

            node['type'] = type;
            node['task_type'] = e.action.task_type;
            node['content'] = e.action.content;
            node['subject'] = e.action.subject;
            node['deal_name'] = e.action.deal_name;
            node['deal_stage'] = e.action.deal_stage;
            node['voicemail'] = e.action.voicemail;
            node['automation_id'] = e.action.automation_id;
            node['appointment'] = e.action.appointment;
            node['due_date'] = e.action.due_date;
            node['timezone'] = e.action.timezone;
            node['due_duration'] = e.action.due_duration;
            node['videos'] = e.action.videos || [];
            node['pdfs'] = e.action.pdfs || [];
            node['images'] = e.action.images || [];
            node['label'] = this.ACTIONS[type];
            node['category'] = ACTION_CAT.NORMAL;
            if (e.action.commands) {
              node['commands'] = e.action.commands;
            } else {
              node['command'] = e.action.command;
            }
            node['ref_id'] = e.action.ref_id;
            node['group'] = e.action.group;
            node['attachments'] = e.action.attachments;
            node['audio'] = e.action.audio;
            node['condition_field'] = e.action.condition_field;
            node['contact_conditions'] = e.action.contact_conditions;
            node['share_users'] = e.action.share_users;
            node['share_all_member'] = e.action.share_all_member;
            node['round_robin'] = e.action.round_robin;
            node['share_type'] = e.action.share_type;
            node['share_team'] = e.action.share_team;
            node['description'] = e.action.description;
          }
          nodes.push(node);

          const parentNodeIndex = nodes.findIndex(
            (item) => item.id === e.parent
          );
          const parentNode = nodes[parentNodeIndex];

          if (parentNode && parentNode.type === 'contact_condition') {
            const index = nodes.findIndex(
              (node) =>
                node.parentId === e.parent &&
                JSON.stringify(node.condition.case) ===
                  JSON.stringify(e.condition.case)
            );
            const caseNodeIndex = uuidv4();
            const nodeId = 'a_' + caseNodeIndex;
            const caseNode = {
              type: 'contact_condition',
              condition_field: parentNode.condition_field,
              id: nodeId,
              index: caseNodeIndex,
              label: e.condition.case,
              leaf: true,
              category: ACTION_CAT.CONDITION,
              condition: { case: e.condition.case }
            };
            if (index === -1) nodes.push(caseNode);
            const bSource = e.parent;
            const bTarget = index !== -1 ? nodes[index].id : nodeId;
            const target = e.id;
            const contactConditionNodeIndex = nodes.findIndex(
              (item) => item.id === bSource
            );
            const contactConditionNode = nodes[contactConditionNodeIndex];
            if (index === -1)
              edges.push({
                id: bSource + '_' + bTarget,
                source: bSource,
                target: bTarget,
                category: 'case',
                answer: e.condition.case,
                data: {}
              });
            edges.push({
              id: bTarget + '_' + target,
              source: bTarget,
              target: target,
              data: {}
            });
            edgesBranches.push(bSource);
            edgesBranches.push(bTarget);
            if (index === -1) {
              if (caseNodes[bSource]) {
                caseNodes[bSource].push(caseNode);
              } else {
                caseNodes[bSource] = [caseNode];
              }
            }
          } else {
            if (e.condition.answer) {
              const actionCondition = {
                case: e.condition.case,
                answer: true,
                percent: e.condition.percent
              };
              if (e.condition.type) {
                actionCondition['type'] = e.condition.type;
              }
              const yesNodeIndex = uuidv4();
              const yesNodeId = 'a_' + yesNodeIndex;
              const yesNode = {
                id: yesNodeId,
                index: yesNodeIndex,
                label: 'YES',
                leaf: false,
                category: ACTION_CAT.CONDITION,
                condition: actionCondition
              };
              nodes.push(yesNode);
              const bSource = e.parent;
              const bTarget = yesNodeId;
              const target = e.id;
              edges.push({
                id: bSource + '_' + bTarget,
                source: bSource,
                target: bTarget,
                category: 'case',
                answer: 'yes',
                data: {
                  category: 'case',
                  answer: 'yes'
                }
              });
              edges.push({
                id: bTarget + '_' + target,
                source: bTarget,
                target: target,
                data: {}
              });
              edgesBranches.push(bSource);
              edgesBranches.push(bTarget);
              if (caseNodes[bSource]) {
                caseNodes[bSource].push(yesNode);
              } else {
                caseNodes[bSource] = [yesNode];
              }
            }
            if (!e.condition.answer) {
              const actionCondition = {
                case: e.condition.case,
                answer: false,
                percent: e.condition.percent
              };
              if (e.condition.type) {
                actionCondition['type'] = e.condition.type;
              }
              const noNodeIndex = uuidv4();
              const noNodeId = 'a_' + noNodeIndex;
              const noNode = {
                id: noNodeId,
                index: noNodeIndex,
                label: 'NO',
                leaf: false,
                category: ACTION_CAT.CONDITION,
                condition: actionCondition
              };
              nodes.push(noNode);
              const bSource = e.parent;
              const bTarget = noNodeId;
              const target = e.id;
              edges.push({
                id: bSource + '_' + bTarget,
                source: bSource,
                target: bTarget,
                category: 'case',
                answer: 'no',
                hasLabel: true,
                type: actionCondition.case,
                percent: e.condition.percent,
                data: {
                  category: 'case',
                  answer: 'no',
                  hasLabel: true,
                  type: actionCondition.case,
                  percent: e.condition.percent
                }
              });
              edges.push({
                id: bTarget + '_' + target,
                source: bTarget,
                target: target,
                data: {}
              });
              edgesBranches.push(bSource);
              edgesBranches.push(bTarget);
              if (caseNodes[bSource]) {
                caseNodes[bSource].push(noNode);
              } else {
                caseNodes[bSource] = [noNode];
              }
            }
          }
        } else {
          if (
            e.type === 'deal' &&
            e.action.type !== 'deal' &&
            this.automation_type !== 'deal'
          ) {
            node['parent_type'] = 'deal';
          }

          let type = e.action.type;
          const videos = e.action.videos ? e.action.videos : [];
          const pdfs = e.action.pdfs ? e.action.pdfs : [];
          const images = e.action.images ? e.action.images : [];
          const materials = [...videos, ...pdfs, ...images];

          if (e.action.type === 'text') {
            if (materials.length === 0) {
              type = 'text';
            } else {
              if (materials.length === 1) {
                if (videos.length > 0) {
                  type = 'send_text_video';
                }
                if (pdfs.length > 0) {
                  type = 'send_text_pdf';
                }
                if (images.length > 0) {
                  type = 'send_text_image';
                }
              } else if (materials.length > 1) {
                type = 'send_text_material';
              }
            }
          } else if (e.action.type === 'email') {
            if (materials.length === 0) {
              type = 'email';
            } else {
              if (materials.length === 1) {
                if (videos.length > 0) {
                  type = 'send_email_video';
                }
                if (pdfs.length > 0) {
                  type = 'send_email_pdf';
                }
                if (images.length > 0) {
                  type = 'send_email_image';
                }
              } else if (materials.length > 1) {
                type = 'send_email_material';
              }
            }
          }

          if (e.action) {
            node['type'] = type;
            node['task_type'] = e.action.task_type;
            node['content'] = e.action.content;
            node['subject'] = e.action.subject;
            node['deal_name'] = e.action.deal_name;
            node['deal_stage'] = e.action.deal_stage;
            node['voicemail'] = e.action.voicemail;
            node['automation_id'] = e.action.automation_id;
            node['appointment'] = e.action.appointment;
            node['due_date'] = e.action.due_date;
            node['timezone'] = e.action.timezone;
            node['due_duration'] = e.action.due_duration;
            node['videos'] = e.action.videos || [];
            node['pdfs'] = e.action.pdfs || [];
            node['images'] = e.action.images || [];
            node['label'] = this.ACTIONS[type];
            node['category'] = ACTION_CAT.NORMAL;
            if (e.action.commands) {
              node['commands'] = e.action.commands;
            } else {
              node['command'] = e.action.command;
            }
            node['ref_id'] = e.action.ref_id;
            node['group'] = e.action.group;
            node['attachments'] = e.action.attachments;
            node['audio'] = e.action.audio;
            node['condition_field'] = e.action.condition_field;
            node['contact_conditions'] = e.action.contact_conditions;
            node['share_users'] = e.action.share_users;
            node['share_all_member'] = e.action.share_all_member;
            node['round_robin'] = e.action.round_robin;
            node['share_type'] = e.action.share_type;
            node['share_team'] = e.action.share_team;
            node['description'] = e.action.description;
          }
          nodes.push(node);

          if (e.parent !== '0') {
            const source = e.parent;
            const target = e.id;
            edges.push({ id: source + '_' + target, source, target, data: {} });
            edgesBranches.push(source);
          }
        }

        if (node['type'] === 'contact_condition') {
          this.identity = node['index'];
          let lastIndex = this.identity;
          this.lastUpdatedAction = node;

          //make condition branches.
          const contactConditions = node['contact_conditions'];
          for (const condition of contactConditions) {
            const newId = 'a_' + uuidv4();
            const data = {
              ...node,
              parentId: node['id'],
              id: newId,
              index: lastIndex,
              category: ACTION_CAT.CONDITION,
              label: condition,
              leaf: true,
              condition: { case: condition }
            };
            nodes.push(data);
            edges.push({
              id: node['id'] + '_' + newId,
              source: node['id'],
              target: newId,
              category: 'case',
              answer: condition,
              data: {}
            });
            this.identity = uuidv4();
            lastIndex = this.identity;
          }

          //make else contact condition action
          const newId = 'a_' + uuidv4();
          const elseData = {
            ...node,
            parentId: node['id'],
            id: newId,
            index: lastIndex,
            category: ACTION_CAT.CONDITION,
            label: 'else',
            leaf: true,
            condition: { case: 'else' }
          };
          nodes.push(elseData);
          edges.push({
            id: node['id'] + '_' + newId,
            source: node['id'],
            target: newId,
            category: 'case',
            answer: 'else',
            data: {}
          });
        }
      });
    }

    // Uncompleted Case Branch Make
    for (const branch in caseNodes) {
      let branchType;
      const nodeIndex = nodes.findIndex((item) => item.id === branch);
      if (nodeIndex >= 0) {
        branchType = nodes[nodeIndex].type;
      }

      if (branchType === 'contact_condition') {
        // uncompleted contact condition branch
        const branchNode = nodes[nodeIndex];
        const uncompletedConditions = [];
        if (caseNodes?.[branch]?.length > 0) {
          for (const condition of branchNode.contact_conditions) {
            const index = caseNodes[branch].findIndex(
              (item) => item.condition?.case === condition
            );
            if (index < 0) {
              uncompletedConditions.push(condition);
            }
          }

          if (
            caseNodes[branch].findIndex(
              (item) => item.condition && item.condition.case === 'else'
            ) < 0
          ) {
            uncompletedConditions.push('else');
          }
        }

        for (const condition of uncompletedConditions) {
          const caseNodeIndex = uuidv4();
          const nodeId = 'a_' + caseNodeIndex;
          const caseNode = {
            type: 'contact_condition',
            condition_field: branchNode.condition_field,
            id: nodeId,
            index: caseNodeIndex,
            label: condition,
            leaf: true,
            category: ACTION_CAT.CONDITION,
            condition: { case: condition }
          };
          nodes.push(caseNode);
          const bSource = branch;
          const bTarget = nodeId;
          edges.push({
            id: bSource + '_' + bTarget,
            source: bSource,
            target: bTarget,
            category: 'case',
            answer: condition,
            data: {}
          });
        }
      } else {
        // uncompleted case branch
        if (caseNodes[branch].length === 1) {
          const newNodeIndex = uuidv4();
          const newNodeId = 'a_' + newNodeIndex;
          const conditionType = caseNodes[branch][0].condition.case;
          if (caseNodes[branch][0].condition.answer) {
            // Insert False case
            const noNode = {
              id: newNodeId,
              index: newNodeIndex,
              label: 'NO',
              leaf: true,
              condition: {
                case: conditionType,
                answer: false
              },
              category: ACTION_CAT.CONDITION
            };
            nodes.push(noNode);
            const bSource = branch;
            const bTarget = newNodeId;
            edges.push({
              id: bSource + '_' + bTarget,
              source: bSource,
              target: bTarget,
              category: 'case',
              answer: 'no',
              hasLabel: true,
              type: conditionType,
              data: {
                category: 'case',
                answer: 'no',
                hasLabel: true,
                type: conditionType,
                percent: caseNodes[branch][0].condition.percent
              }
            });
          } else {
            // Insert true case
            const yesNode = {
              id: newNodeId,
              index: newNodeIndex,
              label: 'YES',
              leaf: false,
              condition: { case: conditionType, answer: true },
              category: ACTION_CAT.CONDITION
            };
            nodes.push(yesNode);
            const bSource = branch;
            const bTarget = newNodeId;
            edges.push({
              id: bSource + '_' + bTarget,
              source: bSource,
              target: bTarget,
              category: 'case',
              answer: 'yes',
              data: {
                category: 'case',
                answer: 'yes',
                hasLabel: true,
                type: conditionType,
                percent: caseNodes[branch][0].condition.percent
              }
            });
          }
        }
      }
    }

    // Leaf Setting
    nodes.forEach((e) => {
      if (
        edgesBranches.indexOf(e.id) !== -1 ||
        this.isLeafAction(e) ||
        e.type === 'automation' ||
        (e.type === 'contact_condition' && e.category === 'NORMAL')
      ) {
        e.leaf = false;
      } else {
        e.leaf = true;
      }
    });
    //this.identity = maxId;
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.loadingAutomation = false;

    // disable auto center for flipping issue when add action.
    setTimeout(() => {
      this.autoCenter = false;
      this.autoZoom = false;
      this.center$.next(false);
    }, 500);
  }

  genIndex(id): any {
    const idStr = (id + '').replace('a_', '');
    return idStr;
  }

  insertAction(link = null): void {
    if (link) {
      this.closeEditAction();

      this.lastUpdatedLink = link;
      const source = link.source;
      const target = link.target;
      //const lastIndex = this.identity;
      const newId = 'a_' + uuidv4();

      const parents = this.getParents(source);
      const prevFollowUps = [];
      this.nodes.forEach((e) => {
        if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
          prevFollowUps.push(e);
        }
      });
      const prevAppointments = [];
      this.nodes.forEach((e) => {
        if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
          prevAppointments.push(e);
        }
      });

      //has new deal node in automation
      let isNewDeal = false;
      let isContactCondition = true;
      if (this.automation_type === 'deal') {
        isNewDeal = true;
        isContactCondition = false;
      } else {
        const targetParents = this.getParents(target);
        const index = targetParents.findIndex((item) => item.type === 'deal');
        if (index >= 0) {
          isNewDeal = true;
          isContactCondition = false;
        }
      }

      //is insertable move deal
      let isMoveDeal = false;
      if (this.automation_type != 'contact') {
        isMoveDeal = true;
      } else {
        for (const nodeId of parents) {
          const dealIndex = this.nodes.findIndex(
            (item) => item.id === nodeId && item.type === 'deal'
          );
          if (dealIndex >= 0) {
            isMoveDeal = true;
          }
        }
      }

      // get node from link
      let node = null;
      const nodeIndex = this.nodes.findIndex((item) => item.id === source);
      if (nodeIndex >= 0) {
        node = this.nodes[nodeIndex];
      }

      // CONDITION ACTION HANDLER
      let conditionHandler = '';
      if (node?.condition) {
        if (node?.type === 'contact_condition') {
          conditionHandler = 'trueCase';
        } else {
          conditionHandler = node.condition?.answer ? 'trueCase' : 'falseCase';
        }
      }

      if (node) {
        const data = {
          currentAction: node.type,
          parentAction: node,
          childRef: target,
          conditionHandler,
          follows: prevFollowUps,
          appointments: prevAppointments,
          hasNewDeal: isNewDeal,
          moveDeal: isMoveDeal,
          isContactCondition,
          automation: this.automation,
          automation_type: this.automation_type
        };

        // prevent show condition handler when has 2 branches
        const childNodes =
          this.edges.filter((item) => item.source == node.id) || [];
        if (childNodes.length >= 2) {
          delete data.conditionHandler;
          delete data.currentAction;
        }

        this.storeService.actionInputData.next(data);
        this.actionMethod = ACTION_METHOD.ADD_INSERT_ACTION;
        this.actionParam = link;
        this.addDrawer.open();
      }
    }
  }

  addAction(node = null): void {
    if (!node) return;
    if (this.isSaving) {
      return;
    }
    this.closeEditAction();

    this.actionParam = node;
    this.lastUpdatedLink = null;

    if (node) {
      const parents = this.getParents(node.id);
      const parentTypes = this.getParentTypes(parents);

      let hasDeal = false;
      let isContactCondition = true;
      if (this.automation_type === 'deal') {
        hasDeal = true;
        isContactCondition = false;
      } else {
        if (parentTypes.length > 0) {
          const index = parentTypes.indexOf('deal');
          if (index >= 0) {
            hasDeal = true;
            isContactCondition = false;
          } else {
            const index = parentTypes.indexOf('contact_condition');
            if (index >= 0) {
              this.automation_type = 'contact';
            }
          }
        }
      }

      //is insertable move deal
      let isMoveDeal = false;
      if (this.automation_type != 'contact') {
        isMoveDeal = true;
      } else {
        for (const nodeId of parents) {
          const dealIndex = this.nodes.findIndex(
            (item) => item.id === nodeId && item.type !== 'contact'
          );
          if (dealIndex >= 0) {
            isMoveDeal = true;
          }
        }
      }

      const prevFollowUps = [];
      this.nodes.forEach((e) => {
        if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
          prevFollowUps.push(e);
        }
      });

      const prevAppointments = [];
      this.nodes.forEach((e) => {
        if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
          prevAppointments.push(e);
        }
      });

      // const currentId = node.id;
      // const lastIndex = this.identity;
      // const newId = 'a_' + (lastIndex + 1);
      // CONDITION ACTION HANDLER
      let conditionHandler = '';
      if (node?.condition) {
        if (node?.type === 'contact_condition') {
          conditionHandler = 'trueCase';
        } else {
          conditionHandler = node.condition?.answer ? 'trueCase' : 'falseCase';
        }
      }

      let realParentAction = node;
      if (node.category === ACTION_CAT.CONDITION) {
        const edgeIndex = this.edges.findIndex(
          (item) => item.target === node.id
        );
        if (edgeIndex >= 0) {
          const nodeIndex = this.nodes.findIndex(
            (item) => item.id === this.edges[edgeIndex].source
          );
          if (nodeIndex >= 0) {
            realParentAction = this.nodes[nodeIndex];
          }
        }
      }

      const data = {
        currentAction: node.type,
        parentAction: realParentAction,
        conditionHandler,
        follows: prevFollowUps,
        appointments: prevAppointments,
        hasNewDeal: hasDeal,
        moveDeal: isMoveDeal,
        isContactCondition,
        automation: this.automation,
        automation_type: this.automation_type,
        automation_label: this.label
      };

      this.storeService.actionInputData.next(data);
      this.actionMethod = ACTION_METHOD.ADD_ACTION;
      this.addDrawer.open();

      // const actionDlg = this.dialog
      //   .open(ActionDialogComponent, {
      //     ...DialogSettings.AUTOMATION_ACTION,
      //     data: {
      //       currentAction: node.type,
      //       parentAction: node,
      //       conditionHandler,
      //       follows: prevFollowUps,
      //       appointments: prevAppointments,
      //       hasNewDeal: hasDeal,
      //       moveDeal: isMoveDeal,
      //       automation: this.automation,
      //       automation_type: this.automation_type
      //     }
      //   })
      //   .afterClosed()
      //   .subscribe((res) => {
      //     if (res) {
      //       if (res.category === ACTION_CAT.NORMAL) {
      //         node.leaf = false;
      //         const nodes = this.nodes;
      //         const data = {
      //           ...res,
      //           id: newId,
      //           index: lastIndex + 1,
      //           label: this.ACTIONS[res.type],
      //           leaf: res.type === 'automation' ? false : true
      //         };
      //         if (hasDeal) {
      //           data['parent_type'] = 'deal';
      //         }
      //         nodes.push(data);
      //         const edges = this.edges;
      //         edges.push({
      //           id: currentId + '_' + newId,
      //           source: currentId,
      //           target: newId
      //         });
      //         this.identity += 1;
      //         this.nodes = [...nodes];
      //         this.edges = [...edges];
      //         this.lastUpdatedAction = this.nodes[this.nodes.length - 1];
      //       } else {
      //         node.leaf = false;
      //         const nodes = this.nodes;
      //         let data = {
      //           ...res,
      //           id: newId,
      //           index: lastIndex + 1,
      //           label: 'YES',
      //           leaf: true,
      //           condition: res.multipleReview
      //             ? { case: res.type, answer: true, condition_type: 1 }
      //             : { case: res.type, answer: true, primary: res.primary }
      //         };
      //         if (hasDeal) {
      //           data['parent_type'] = 'deal';
      //         }
      //         nodes.push(data);
      //         const edges = this.edges;
      //         edges.push({
      //           id: currentId + '_' + newId,
      //           source: currentId,
      //           target: newId,
      //           category: 'case',
      //           answer: 'yes'
      //         });
      //         newId = 'a_' + (lastIndex + 2);
      //         data = {
      //           ...res,
      //           id: newId,
      //           index: lastIndex + 2,
      //           label: 'NO',
      //           leaf: true,
      //           condition: res.multipleReview
      //             ? { case: res.type, answer: false, condition_type: 1 }
      //             : { case: res.type, answer: false, primary: res.primary }
      //         };
      //         if (hasDeal) {
      //           data['parent_type'] = 'deal';
      //         }
      //         nodes.push(data);
      //         edges.push({
      //           id: currentId + '_' + newId,
      //           source: currentId,
      //           target: newId,
      //           category: 'case',
      //           type: res.type,
      //           hasLabel: true,
      //           answer: 'no'
      //         });
      //         this.identity += 2;
      //         this.nodes = [...nodes];
      //         this.edges = [...edges];
      //         this.lastUpdatedAction = node;
      //       }
      //       this.saved = false;
      //       this.panToNode$.next(node.id);
      //     }
      //   });
    } else {
      const data = {
        automation: this.automation,
        automation_type: this.automation_type,
        automation_label: this.label
      };
      this.storeService.actionInputData.next(data);
      this.addDrawer.open();

      // const actionDlg = this.dialog
      //   .open(ActionDialogComponent, {
      //     ...DialogSettings.AUTOMATION_ACTION,
      //     data: {
      //       automation: this.automation,
      //       automation_type: this.automation_type
      //     }
      //   })
      //   .afterClosed()
      //   .subscribe((res) => {
      //     if (res) {
      //       this.nodes.push({
      //         ...res,
      //         id: 'a_' + this.identity,
      //         index: this.identity,
      //         label: this.ACTIONS[res.type],
      //         leaf: res.type === 'automation' ? false : true
      //       });
      //       this.saved = false;
      //       this.lastUpdatedAction = this.nodes[this.nodes.length - 1];
      //     }
      //   });
    }
  }
  editAction(event, node, activeTab = 'action'): void {
    if (this.isSaving) {
      return;
    }

    this.closeAddAction();

    if (
      event.target.classList.contains('v-leaf') ||
      event.target.classList.contains('remove-action')
    ) {
      return;
    }

    const parents = this.getParents(node.id);
    const edge = _.find(this.edges, { target: node.id });
    let conditionHandler = '';
    const parentAction = {};
    if (edge) {
      const parentNode = _.find(this.nodes, { id: edge.source });
      if (parentNode && parentNode?.condition) {
        if (parentNode?.type === 'contact_condition') {
          conditionHandler = 'trueCase';
        } else {
          conditionHandler = parentNode.condition?.answer
            ? 'trueCase'
            : 'falseCase';
        }
        parentAction['condition'] = parentNode.condition;
        if (parentNode?.condition.case === 'task_check') {
          const super_edge = _.find(this.edges, { target: parentNode.id });
          const super_parentNode = _.find(this.nodes, {
            id: super_edge.source
          });
          if (super_parentNode) {
            parentAction['due_date'] = super_parentNode.due_date;
            parentAction['due_duration'] = super_parentNode.due_duration;
          }
        }
      }
    }

    //has new deal node in automation
    let isNewDeal = false;
    let isContactCondition = true;
    if (this.automation_type === 'deal') {
      isNewDeal = true;
      isContactCondition = false;
    } else {
      const index = this.nodes.findIndex((item) => item.type === 'deal');
      if (index >= 0) {
        isNewDeal = true;
        isContactCondition = false;
      }
    }

    //is insertable move deal
    let isMoveDeal = false;
    if (this.automation_type === 'deal') {
      isMoveDeal = true;
    } else {
      for (const nodeId of parents) {
        const dealIndex = this.nodes.findIndex(
          (item) => item.id === nodeId && item.type === 'deal'
        );
        if (dealIndex >= 0) {
          isMoveDeal = true;
        }
      }
    }

    const prevFollowUps = [];
    this.nodes.forEach((e) => {
      if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
        prevFollowUps.push(e);
      }
    });
    this.prevNode = { ...node };

    const condition_refs = [];
    if (node.type === 'contact_condition') {
      for (const condition of node['contact_conditions']) {
        this.edges.forEach((e) => {
          var eAnswerArray = '';
          if (e.answer && Array.isArray(condition)) {
            if (Array.isArray(e.answer)) eAnswerArray = e.answer;
            else eAnswerArray = e.answer.split(',').map((item) => item.trim());
          } else if (e.answer) eAnswerArray = e.answer;
          if (
            e.source === node.id &&
            e.category === 'case' &&
            JSON.stringify(eAnswerArray) === JSON.stringify(condition)
          ) {
            condition_refs.push({ answer: condition, ref: e.target });
          }
        });
      }
    }

    const data = {
      action: node,
      conditionHandler,
      follows: prevFollowUps,
      nodes: this.nodes,
      edges: this.edges,
      hasNewDeal: isNewDeal,
      parentAction,
      moveDeal: isMoveDeal,
      isContactCondition,
      automation: this.automation,
      automation_type: this.automation_type,
      automation_label: this.label,
      activeTab,
      condition_refs
    };

    data['timelines'] = this.actionTimelines;

    this.storeService.actionInputData.next(data);
    this.actionMethod = ACTION_METHOD.EDIT_ACTION;
    this.actionParam = node;
    this.editDrawer.open();
  }

  removeAction(node): void {
    if (this.editMode !== 'new' && this.isEditable()) {
      this.isEditTitleMode = false;
    }
    if (this.actionTimelines.length > 0) {
      const data = {
        action: node,
        automation_type: this.automation_type,
        timelines: this.actionTimelines
      };
      this.storeService.actionInputData.next(data);
      this.actionMethod = ACTION_METHOD.REMOVE_ACTION;
      this.actionParam = node;
      this.removeDrawer.open();
    } else {
      this.actionParam = node;
      this.runRemoveAction(node);
    }
  }

  startTrigger(): void {
    this.triggerDrawer.open();
  }

  easyViewTrigger(event, origin, content): void {
    this.closeStartTrigger(null);
    event.stopPropagation();
    event.preventDefault();
    this.overlayService
      .open(origin, content, this.viewContainerRef, 'automation', {
        data: this.automationTrigger
      })
      .subscribe((res) => {
        if (res?.type === 'edit') {
          this.triggerDrawer.open();
        } else if (res?.type === 'remove') {
          this.automationTrigger = null;
          if (this.editMode !== 'new' && this.isEditable()) {
            this.storeData().then((res) => {
              this.toastr.success('Updating is saved!');
            });
          }
        }
      });
  }

  removeLeaf(node): void {
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          title: 'Delete Action',
          message: 'Are you sure you want to delete this action?',
          confirmLabel: 'Yes, Delete'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const nodes = this.nodes;
          nodes.some((e, index) => {
            if (e.id === node.id) {
              nodes.splice(index, 1);
              return true;
            }
          });
          const edges = sortEdges(this.edges);
          let newLeafId;
          edges.some((e, index) => {
            if (e.target === node.id) {
              newLeafId = e.source;
              edges.splice(index, 1);
              return true;
            }
          });
          nodes.some((e) => {
            if (e.id === newLeafId) {
              // when new leaf has not child
              const index = edges.findIndex(
                (item) => item.source === newLeafId
              );
              if (index < 0) {
                e.leaf = true;
              }
              return true;
            }
          });
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.saved = false;
          this.removeActionTimelines([node]);
        }
      });
  }
  removeRoot(node): void {
    const options = [
      {
        title: 'Remove only node',
        description: 'This option removes only current node.',
        id: 'only'
      },
      {
        title: 'Remove all nodes',
        description: 'This option removes all nodes.',
        id: 'child'
      }
    ];
    this.dialog
      .open(CaseConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message:
            'Are you sure to remove this item? If yes, please select the remove method.',
          cancelLabel: 'No',
          confirmLabel: 'Remove',
          cases: options
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.id === 'only') {
            const nodes = this.nodes;
            nodes.some((e, index) => {
              if (e.id === node.id) {
                nodes.splice(index, 1);
                return true;
              }
            });
            const edges = sortEdges(this.edges);
            edges.some((e, index) => {
              if (e.source === node.id) {
                edges.splice(index, 1);
                return true;
              }
            });
            this.nodes = [...nodes];
            this.edges = [...edges];

            this.removeActionTimelines([node]);
          } else {
            const deleteNodes = this.nodes
              .filter((nd) => nd.id != 'a_10000')
              .map((nd) => nd.id);
            const orgNode = this.nodes.filter((nd) => nd.id === 'a_10000');
            this.removeActionTimelines(deleteNodes);
            this.nodes = orgNode;
            this.edges = [];
          }
          this.saved = false;
        }
      });
  }
  removeMiddleNode(node, nSource, nTarget): void {
    const options = [
      {
        title: 'Remove child nodes',
        description: 'This option removes related child nodes as well.',
        id: 'child'
      }
    ];
    let message =
      'Are you sure to remove this item? If yes, please click the remove button.';
    if (node.type !== 'move_deal') {
      options.unshift({
        title: 'Remove only node',
        description: 'This option removes only current node.',
        id: 'only'
      });
      message =
        'Are you sure to remove this item? If yes, please select the remove method.';
    }
    this.dialog
      .open(CaseConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message,
          cancelLabel: 'No',
          confirmLabel: 'Remove',
          cases: options
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.id === 'only') {
            const nodes = this.nodes;
            nodes.some((e, index) => {
              if (e.id === node.id) {
                nodes.splice(index, 1);
                return true;
              }
            });
            const edges = sortEdges(this.edges);
            let newSource;
            let newTarget;
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (e.target === node.id) {
                newSource = e.source;
                edges.splice(i, 1);
              }
              if (e.source === node.id) {
                newTarget = e.target;
                edges.splice(i, 1);
              }
              if (newSource && newTarget) {
                break;
              }
            }
            edges.push({
              id: nSource + '_' + nTarget,
              source: nSource,
              target: nTarget
            });

            const nextNodeId = nodes.findIndex((e) => e.id === nTarget);
            if (nextNodeId >= 0) {
              const nextNode = nodes[nextNodeId];
              const prevEdgeId = edges.findIndex((e) => e.target === nSource);
              if (prevEdgeId >= 0) {
                const prevEdge = edges[prevEdgeId];
                if (prevEdge.answer === 'no' && nextNode.period === 0) {
                  nextNode.period = node.period;
                }
              }
            }
            this.nodes = [...nodes];
            this.edges = [...edges];
            this.saved = false;

            this.removeActionTimelines([node]);
          } else {
            this.removeChildNodes(node, nSource);
          }
        }
      });
  }

  removeContactCaseNode(node, nSource): void {
    const options = [];
    for (const condition of node['contact_conditions']) {
      options.push({
        title: `Remain "${this.getFormattedCondition(
          node,
          condition
        )}" case nodes`,
        description: '',
        id: this.getFormattedCondition(node, condition)
      });
    }
    options.push({
      title: 'Remove all child nodes',
      description: 'This option removes all related child nodes.',
      id: 'all-child-nodes'
    });

    this.dialog
      .open(CaseConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message:
            'Are you sure to remove this item? If yes, please select the remove method.',
          cancelLabel: 'No',
          confirmLabel: 'Remove',
          cases: options
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.id === 'all-child-nodes') {
            this.removeChildNodes(node, nSource);
          } else {
            const edges = sortEdges(this.edges);
            const nodes = this.nodes;
            const deleteNodes = [];
            let caseEdge, currentEdge, caseNextEdge;

            for (let i = 0; i < edges.length; i++) {
              const e = edges[i];
              if (e.source === node.id && e.answer !== res.id) {
                deleteNodes.push(e.target);
              } else if (e.source === node.id && e.answer === res.id) {
                caseEdge = e;
              } else if (e.target === node.id) {
                currentEdge = e;
              } else if (e.source === caseEdge?.target) {
                caseNextEdge = e;
              }
            }

            edges.forEach((e) => {
              if (deleteNodes.indexOf(e.source) !== -1) {
                deleteNodes.push(e.target);
              }
            });

            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (deleteNodes.indexOf(e.source) !== -1) {
                edges.splice(i, 1);
              } else if (deleteNodes.indexOf(e.target) !== -1) {
                edges.splice(i, 1);
              }
            }

            for (let i = nodes.length - 1; i >= 0; i--) {
              const e = nodes[i];
              if (deleteNodes.indexOf(e.id) !== -1) {
                nodes.splice(i, 1);
              }
            }
            if (caseNextEdge) {
              caseNextEdge.id = currentEdge.source + '_' + caseNextEdge.target;
              caseNextEdge.source = currentEdge.source;
            }

            deleteNodes.push(node.id);
            this.edges = edges.filter(
              (e) => !(e.target === node.id || e.source === node.id)
            );
            this.nodes = nodes.filter(
              (n) => !(n.id === node.id || n.id === caseEdge?.target)
            );
            this.nodes.some((e) => {
              // when new leaf has not child
              const index = this.edges.findIndex(
                (item) => item.source === e.id
              );
              if (index < 0) {
                e.leaf = true;
              }
            });
            this.saved = false;
            const option = {
              type: 'contact_condition',
              case: res.id
            };
            this.removeActionTimelines(deleteNodes, option);
          }
        }
      });
  }

  async removeBranchByEdit(node): Promise<void> {
    let branch = null;
    for (const edge of this.edges) {
      if (edge.source === node.id) {
        branch = edge;
        break;
      }
    }
    if (branch && branch.category === 'case') {
      const newSource = branch.source;
      let yesCase; // "Yes" node id
      let noCase; // "No" node id
      const edges = sortEdges(this.edges);
      const nodes = this.nodes;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === newSource && e.answer === 'yes') {
          yesCase = e.target;
        }
        if (e.source === newSource && e.answer === 'no') {
          noCase = e.target;
        }
        if (yesCase && noCase) {
          break;
        }
      }
      const deleteNodes = [yesCase, noCase];
      edges.forEach((e) => {
        if (deleteNodes.indexOf(e.source) !== -1) {
          deleteNodes.push(e.target);
        }
      });
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (deleteNodes.indexOf(e.source) !== -1) {
          edges.splice(i, 1);
        } else if (e.source === newSource) {
          edges.splice(i, 1);
        }
      }
      for (let i = nodes.length - 1; i >= 0; i--) {
        const e = nodes[i];
        if (deleteNodes.indexOf(e.id) !== -1) {
          nodes.splice(i, 1);
        }
      }
      node.leaf = true;
      this.nodes = [...nodes];
      this.edges = [...edges];

      if (this.automation_id) {
        const data = {
          automation: this.automation_id,
          ref: node.id
        };
        this.actionTimelines = await this.automationService
          .getActionTimelines(data)
          .toPromise();
      }

      this.removeActionTimelines(deleteNodes, { type: 'end' });
    }
  }

  keepBranchConfirmByEdit(node): void {
    let branch = null;
    for (const edge of this.edges) {
      if (edge.source === node.id) {
        branch = edge;
        break;
      }
    }
    if (branch && branch.category === 'case') {
      const newSource = branch.source;
      let yesCase; // "Yes" node id
      let noCase; // "No" node id
      let yesNextNode; // Node behind "Yes"
      let noNextNode; // Node behind "No"
      const edges = sortEdges(this.edges);
      const nodes = this.nodes;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === newSource && e.answer === 'yes') {
          yesCase = e.target;
        }
        if (e.source === newSource && e.answer === 'no') {
          noCase = e.target;
        }
        if (yesCase && noCase) {
          break;
        }
      }
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === yesCase) {
          yesNextNode = e.target;
        }
        if (e.source === noCase) {
          noNextNode = e.target;
        }
        if (yesNextNode && noNextNode) {
          break;
        }
      }
      const options = [
        {
          title: 'Keep Yes case nodes',
          description: 'This option keeps Yes case nodes.',
          id: 'trueNodes'
        },
        {
          title: 'Keep No case nodes',
          description: 'This option keeps No case nodes.',
          id: 'falseNodes'
        }
      ];
      this.dialog
        .open(CaseConfirmComponent, {
          maxWidth: '360px',
          width: '96vw',
          data: {
            message:
              'Are you sure to keep this item? If yes, please select the keep method.',
            confirmLabel: 'Keep',
            cases: options
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if ((res && res.id === 'trueNodes') || !res) {
            const deleteNodes = [noCase];
            edges.forEach((e) => {
              if (deleteNodes.indexOf(e.source) !== -1) {
                deleteNodes.push(e.target);
              }
            });
            deleteNodes.push(yesCase);
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (deleteNodes.indexOf(e.source) !== -1) {
                edges.splice(i, 1);
              } else if (deleteNodes.indexOf(e.target) !== -1) {
                edges.splice(i, 1);
              }
            }
            // const noCaseEdgeIndex = edges.findIndex(
            //   (item) => item.target === noCase
            // );
            // const yesCaseEdgeIndex = edges.findIndex(
            //   (item) => item.target === yesCase
            // );
            // const noCaseNodeIndex = nodes.findIndex(
            //   (item) => item.id === noCase
            // );
            // const yesCaseNodeIndex = nodes.findIndex(
            //   (item) => item.id === yesCase
            // );
            // if (noCaseEdgeIndex >= 0) {
            //   edges[noCaseEdgeIndex].type = 'opened_email';
            //   edges[noCaseEdgeIndex].percent = undefined;
            //   if (edges[noCaseEdgeIndex].data) {
            //     edges[noCaseEdgeIndex].data.type = 'opened_email';
            //     edges[noCaseEdgeIndex].data.percent = undefined;
            //   }
            // }
            // if (yesCaseEdgeIndex >= 0) {
            //   edges[yesCaseEdgeIndex].type = 'opened_email';
            //   edges[yesCaseEdgeIndex].percent = undefined;
            //   if (edges[yesCaseEdgeIndex].data) {
            //     edges[yesCaseEdgeIndex].data.type = 'opened_email';
            //     edges[yesCaseEdgeIndex].data.percent = undefined;
            //   }
            // }
            // if (noCaseNodeIndex >= 0) {
            //   nodes[noCaseNodeIndex].leaf = true;
            //   nodes[noCaseNodeIndex].condition.case = 'opened_email';
            //   nodes[noCaseNodeIndex].condition.percent = undefined;
            // }
            // if (yesCaseNodeIndex >= 0) {
            //   nodes[yesCaseNodeIndex].condition.case = 'opened_email';
            //   nodes[yesCaseNodeIndex].condition.percent = undefined;
            // }
            for (let i = nodes.length - 1; i >= 0; i--) {
              const e = nodes[i];
              if (deleteNodes.indexOf(e.id) !== -1) {
                nodes.splice(i, 1);
              }
            }
            if (yesNextNode) {
              edges.push({
                id: node.id + '_' + yesNextNode,
                source: node.id,
                target: yesNextNode
              });
            } else {
              // nodes.some((e) => {
              //   if (e.id === node.id) {
              //     if (this.automation_type === 'contact') {
              //       e.leaf = true;
              //     }
              //     return true;
              //   }
              // });
            }
            this.nodes = [...nodes];
            this.edges = [...edges];
          } else if (res.id === 'falseNodes') {
            const deleteNodes = [yesCase];
            edges.forEach((e) => {
              if (deleteNodes.indexOf(e.source) !== -1) {
                deleteNodes.push(e.target);
              }
            });
            deleteNodes.push(noCase);
            // deleteNodes.splice(0, 1);
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (deleteNodes.indexOf(e.source) !== -1) {
                edges.splice(i, 1);
              } else if (deleteNodes.indexOf(e.target) !== -1) {
                edges.splice(i, 1);
              }
            }
            // const noCaseEdgeIndex = edges.findIndex(
            //   (item) => item.target === noCase
            // );
            // const yesCaseEdgeIndex = edges.findIndex(
            //   (item) => item.target === yesCase
            // );
            // const noCaseNodeIndex = nodes.findIndex(
            //   (item) => item.id === noCase
            // );
            // const yesCaseNodeIndex = nodes.findIndex(
            //   (item) => item.id === yesCase
            // );
            // if (noCaseEdgeIndex >= 0) {
            //   edges[noCaseEdgeIndex].type = 'opened_email';
            //   edges[noCaseEdgeIndex].percent = undefined;
            //   if (edges[noCaseEdgeIndex].data) {
            //     edges[noCaseEdgeIndex].data.type = 'opened_email';
            //     edges[noCaseEdgeIndex].data.percent = undefined;
            //   }
            // }
            // if (yesCaseEdgeIndex >= 0) {
            //   edges[yesCaseEdgeIndex].type = 'opened_email';
            //   edges[yesCaseEdgeIndex].percent = undefined;
            //   if (edges[yesCaseEdgeIndex].data) {
            //     edges[yesCaseEdgeIndex].data.type = 'opened_email';
            //     edges[yesCaseEdgeIndex].data.percent = undefined;
            //   }
            // }
            // if (noCaseNodeIndex >= 0) {
            //   nodes[noCaseNodeIndex].condition.case = 'opened_email';
            //   nodes[noCaseNodeIndex].condition.percent = undefined;
            // }
            // if (yesCaseNodeIndex >= 0) {
            //   nodes[yesCaseNodeIndex].leaf = true;
            //   nodes[yesCaseNodeIndex].condition.case = 'opened_email';
            //   nodes[yesCaseNodeIndex].condition.percent = undefined;
            // }
            for (let i = nodes.length - 1; i >= 0; i--) {
              const e = nodes[i];
              if (deleteNodes.indexOf(e.id) !== -1) {
                nodes.splice(i, 1);
              }
            }
            if (noNextNode) {
              edges.push({
                id: node.id + '_' + noNextNode,
                source: node.id,
                target: noNextNode
              });
            } else {
              // nodes.some((e) => {
              //   if (e.id === node.id) {
              //     if (this.automation_type === 'contact') {
              //       e.leaf = true;
              //     }
              //     return true;
              //   }
              // });
            }
            this.nodes = [...nodes];
            this.edges = [...edges];
          }
        });
    }
  }

  setOpenedEmailCondition(node): void {
    let branch = null;
    for (const edge of this.edges) {
      if (edge.source === node.id) {
        branch = edge;
        break;
      }
    }
    if (branch && branch.category === 'case') {
      const newSource = branch.source;
      let yesCase; // "Yes" node id
      let noCase; // "No" node id
      const edges = sortEdges(this.edges);
      const nodes = this.nodes;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === newSource && e.answer === 'yes') {
          yesCase = e.target;
        }
        if (e.source === newSource && e.answer === 'no') {
          noCase = e.target;
        }
        if (yesCase && noCase) {
          break;
        }
      }

      const noCaseEdgeIndex = edges.findIndex((item) => item.target === noCase);
      const yesCaseEdgeIndex = edges.findIndex(
        (item) => item.target === yesCase
      );
      const noCaseNodeIndex = nodes.findIndex((item) => item.id === noCase);
      const yesCaseNodeIndex = nodes.findIndex((item) => item.id === yesCase);
      if (noCaseEdgeIndex >= 0) {
        edges[noCaseEdgeIndex].type = 'opened_email';
        edges[noCaseEdgeIndex].percent = undefined;
        if (edges[noCaseEdgeIndex].data) {
          edges[noCaseEdgeIndex].data.type = 'opened_email';
          edges[noCaseEdgeIndex].data.percent = undefined;
        }
      }
      if (yesCaseEdgeIndex >= 0) {
        edges[yesCaseEdgeIndex].type = 'opened_email';
        edges[yesCaseEdgeIndex].percent = undefined;
        if (edges[yesCaseEdgeIndex].data) {
          edges[yesCaseEdgeIndex].data.type = 'opened_email';
          edges[yesCaseEdgeIndex].data.percent = undefined;
        }
      }
      if (noCaseNodeIndex >= 0) {
        nodes[noCaseNodeIndex].condition.case = 'opened_email';
        nodes[noCaseNodeIndex].condition.percent = undefined;
      }
      if (yesCaseNodeIndex >= 0) {
        nodes[yesCaseNodeIndex].condition.case = 'opened_email';
        nodes[yesCaseNodeIndex].condition.percent = undefined;
      }
      this.nodes = [...nodes];
      this.edges = [...edges];
    }
  }

  setWatchedMaterialCondition(node): void {
    let branch = null;
    for (const edge of this.edges) {
      if (edge.source === node.id) {
        branch = edge;
        break;
      }
    }
    if (branch && branch.category === 'case') {
      const newSource = branch.source;
      let yesCase; // "Yes" node id
      let noCase; // "No" node id
      const edges = sortEdges(this.edges);
      const nodes = this.nodes;
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === newSource && e.answer === 'yes') {
          yesCase = e.target;
        }
        if (e.source === newSource && e.answer === 'no') {
          noCase = e.target;
        }
        if (yesCase && noCase) {
          break;
        }
      }

      const noCaseEdgeIndex = edges.findIndex((item) => item.target === noCase);
      const yesCaseEdgeIndex = edges.findIndex(
        (item) => item.target === yesCase
      );
      const noCaseNodeIndex = nodes.findIndex((item) => item.id === noCase);
      const yesCaseNodeIndex = nodes.findIndex((item) => item.id === yesCase);
      if (noCaseEdgeIndex >= 0) {
        edges[noCaseEdgeIndex].type = 'watched_material';
        edges[noCaseEdgeIndex].percent = undefined;
        if (edges[noCaseEdgeIndex].data) {
          edges[noCaseEdgeIndex].data.type = 'watched_material';
          edges[noCaseEdgeIndex].data.percent = undefined;
        }
      }
      if (yesCaseEdgeIndex >= 0) {
        edges[yesCaseEdgeIndex].type = 'watched_material';
        edges[yesCaseEdgeIndex].percent = undefined;
        if (edges[yesCaseEdgeIndex].data) {
          edges[yesCaseEdgeIndex].data.type = 'watched_material';
          edges[yesCaseEdgeIndex].data.percent = undefined;
        }
      }
      if (noCaseNodeIndex >= 0) {
        nodes[noCaseNodeIndex].condition.case = 'watched_material';
        nodes[noCaseNodeIndex].condition.percent = undefined;
      }
      if (yesCaseNodeIndex >= 0) {
        nodes[yesCaseNodeIndex].condition.case = 'watched_material';
        nodes[yesCaseNodeIndex].condition.percent = undefined;
      }
      this.nodes = [...nodes];
      this.edges = [...edges];
    }
    this.updateActionTimelines(node);
  }

  confirmContactCondition(node): void {
    const removeConditions = [];
    const addedConditions = [];
    const originConditions = [];
    for (let i = 0; i < node.mapConditions.length; i++) {
      if (node.mapConditions[i] === 'remove') {
        removeConditions.push(i);
      } else if (node.mapConditions[i] === 'add') {
        addedConditions.push(i);
      } else if (node.mapConditions[i] === 'origin') {
        originConditions.push(i);
      }
    }
    const update_refs = [];
    for (let i = 0; i < node.contact_conditions.length; i++) {
      for (const edge of this.edges) {
        if (edge.source === node.contact_conditions[i].ref) {
          //node.contact_conditions[i].ref = edge.target;
          update_refs.push({
            case: node.contact_conditions[i].answer,
            ref: edge.target
          });
          break;
        }
      }
    }

    // remove branches
    const edges = sortEdges(this.edges);
    const nodes = this.nodes;
    let conditionCase;
    let conditionNextNode;
    const remove_refs = [];
    for (let k = 0; k < removeConditions.length; k++) {
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (
          e.source === node.id &&
          e.answer === node.contact_conditions[removeConditions[k]].answer
        ) {
          conditionCase = e.target;
          break;
        }
      }
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.source === conditionCase) {
          conditionNextNode = e.target;
          break;
        }
      }
      remove_refs.push(conditionCase);
      edges.forEach((e) => {
        if (remove_refs.indexOf(e.source) !== -1) {
          remove_refs.push(e.target);
        }
      });
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (remove_refs.indexOf(e.source) !== -1) {
          edges.splice(i, 1);
        } else if (remove_refs.indexOf(e.target) !== -1) {
          edges.splice(i, 1);
        }
      }
      for (let i = nodes.length - 1; i >= 0; i--) {
        const e = nodes[i];
        if (remove_refs.indexOf(e.id) !== -1) {
          nodes.splice(i, 1);
        }
      }
    }

    //  add new branches
    const currentId = node.id;
    let lastIndex = this.identity;
    //let lastIndex = uuidv4();
    //let newId = 'a_' + lastIndex;
    let newId;
    for (let i = 0; i < addedConditions.length; i++) {
      newId = 'a_' + uuidv4();
      const data = {
        ...node,
        id: newId,
        index: lastIndex,
        category: ACTION_CAT.CONDITION,
        label: node.contact_conditions[addedConditions[i]].answer,
        leaf: true,
        condition: { case: node.contact_conditions[addedConditions[i]].answer }
      };
      nodes.push(data);
      edges.push({
        id: currentId + '_' + newId,
        source: currentId,
        target: newId,
        category: 'case',
        answer: node.contact_conditions[addedConditions[i]].answer,
        data: {}
      });
      this.identity = uuidv4();
      lastIndex = this.identity;
    }

    // update conditions for origin

    // change condition type for else node
    let elseCase;
    for (let i = edges.length - 1; i >= 0; i--) {
      const e = edges[i];
      if (e.source === node.id && e.answer === 'else') {
        elseCase = e.target;
        break;
      }
    }
    const elseNodeIndex = nodes.findIndex((item) => item.id === elseCase);
    if (elseNodeIndex >= 0) {
      nodes[elseNodeIndex].condition_field = node.condition_field;
    }

    const conditions = [];
    for (let i = 0; i < removeConditions.length; i++) {
      conditions.push(node.contact_conditions[removeConditions[i]].answer);
    }
    for (const condition of conditions) {
      for (let i = 0; i < node.contact_conditions.length; i++) {
        if (node.contact_conditions[i].answer === condition) {
          node.contact_conditions.splice(i, 1);
          break;
        }
      }
    }
    nodes.some((e, index) => {
      if (e.id === node.id) {
        nodes[index] = node;
      }
      node.contact_conditions.forEach((element) => {
        if (e.id === element.ref) {
          nodes[index].condition.case = element.answer;
          nodes[index].label = element.answer;
        }
      });
    });

    edges.some((e, index) => {
      node.contact_conditions.forEach((element) => {
        if (e.target === element.ref) {
          edges[index].answer = element.answer;
        }
      });
    });
    node.contact_conditions = node.contact_conditions.map((e) => e.answer);

    this.nodes = [...nodes];
    this.edges = [...edges];

    const option = {
      type: 'contact_condition',
      update_refs,
      remove_refs
    };
    this.updateActionTimelines(node, option);
  }

  removeCase(link, isRemoveParent = false): void {
    const options = [
      {
        title: 'Remove Yes case nodes',
        description:
          'This option removes Yes case nodes and connect parent node with No case nodes.',
        id: 'falseNodes'
      },
      {
        title: 'Remove No case nodes',
        description:
          'This option removes No case nodes and connect parent node with Yes case nodes.',
        id: 'trueNodes'
      },
      {
        title: 'Remove all child nodes',
        description: 'This option removes all related child nodes.',
        id: 'child'
      }
    ];
    this.dialog
      .open(CaseConfirmComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message:
            'Are you sure to remove this case? If yes, please select the remove method.',
          cancelLabel: 'No',
          confirmLabel: 'Remove',
          cases: options
        }
      })
      .afterClosed()
      .subscribe(async (res) => {
        if (res) {
          const newSource = link.source;
          let yesCase; // "Yes" node id
          let noCase; // "No" node id
          let yesNextNode; // Node behind "Yes"
          let noNextNode; // Node behind "No"
          const edges = sortEdges(this.edges);
          const nodes = this.nodes;

          for (let i = edges.length - 1; i >= 0; i--) {
            const e = edges[i];
            if (e.source === newSource && e.answer === 'yes') {
              yesCase = e.target;
            }
            if (e.source === newSource && e.answer === 'no') {
              noCase = e.target;
            }
            if (yesCase && noCase) {
              break;
            }
          }
          for (let i = edges.length - 1; i >= 0; i--) {
            const e = edges[i];
            if (e.source === yesCase) {
              yesNextNode = e.target;
            }
            if (e.source === noCase) {
              noNextNode = e.target;
            }
            if (yesNextNode && noNextNode) {
              break;
            }
          }

          let deleteNodes = [];
          if (res.id === 'child') {
            deleteNodes = [...[yesCase, noCase]];
            edges.forEach((e) => {
              if (deleteNodes.indexOf(e.source) !== -1) {
                deleteNodes.push(e.target);
              }
            });
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (deleteNodes.indexOf(e.source) !== -1) {
                edges.splice(i, 1);
              } else if (e.source === newSource) {
                edges.splice(i, 1);
              }
            }
            for (let i = nodes.length - 1; i >= 0; i--) {
              const e = nodes[i];
              if (deleteNodes.indexOf(e.id) !== -1) {
                nodes.splice(i, 1);
              }
            }
            nodes.some((e) => {
              if (e.id === newSource) {
                // if (this.automation_type === 'contact') {
                e.leaf = true;
                // }
                return true;
              }
            });
            this.nodes = [...nodes];
            this.edges = [...edges];
            this.saved = false;
          } else {
            if (res.id === 'trueNodes') {
              deleteNodes = [noCase];
              edges.forEach((e) => {
                if (deleteNodes.indexOf(e.source) !== -1) {
                  deleteNodes.push(e.target);
                }
              });
              deleteNodes.push(yesCase);
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (deleteNodes.indexOf(e.source) !== -1) {
                  edges.splice(i, 1);
                } else if (e.source === newSource) {
                  edges.splice(i, 1);
                }
              }

              for (let i = nodes.length - 1; i >= 0; i--) {
                const e = nodes[i];
                if (deleteNodes.indexOf(e.id) !== -1) {
                  nodes.splice(i, 1);
                }
              }
              if (yesNextNode) {
                edges.push({
                  id: newSource + '_' + yesNextNode,
                  source: newSource,
                  target: yesNextNode
                });
              } else {
                nodes.some((e) => {
                  if (e.id === newSource) {
                    // if (this.automation_type === 'contact') {
                    e.leaf = true;
                    // }
                    return true;
                  }
                });
              }
              this.nodes = [...nodes];
              this.edges = [...edges];
              this.saved = false;
            } else if (res.id === 'falseNodes') {
              deleteNodes = [yesCase];
              edges.forEach((e) => {
                if (deleteNodes.indexOf(e.source) !== -1) {
                  deleteNodes.push(e.target);
                }
              });
              deleteNodes.push(noCase);
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (deleteNodes.indexOf(e.source) !== -1) {
                  edges.splice(i, 1);
                } else if (e.source === newSource) {
                  edges.splice(i, 1);
                }
              }

              for (let i = nodes.length - 1; i >= 0; i--) {
                const e = nodes[i];
                if (deleteNodes.indexOf(e.id) !== -1) {
                  nodes.splice(i, 1);
                }
              }
              if (noNextNode) {
                edges.push({
                  id: newSource + '_' + noNextNode,
                  source: newSource,
                  target: noNextNode
                });
              } else {
                nodes.some((e) => {
                  if (e.id === newSource) {
                    // if (this.automation_type === 'contact') {
                    e.leaf = true;
                    // }
                    return true;
                  }
                });
              }
              this.nodes = [...nodes];
              this.edges = [...edges];
              this.saved = false;
            }
          }
          let nSource;
          if (isRemoveParent) {
            nodes.some((e, index) => {
              if (e.id === newSource) {
                nodes.splice(index, 1);
                return true;
              }
            });
            let nTarget;
            for (let i = edges.length - 1; i >= 0; i--) {
              const e = edges[i];
              if (e.target === newSource) {
                nSource = e.source;
                deleteNodes.push(e.target);
                edges.splice(i, 1);
              }
              if (e.source === newSource) {
                nTarget = e.target;
                edges.splice(i, 1);
              }
              if (nSource && nTarget) {
                break;
              }
            }
            if (nTarget) {
              edges.push({
                id: nSource + '_' + nTarget,
                source: nSource,
                target: nTarget
              });
            }

            this.nodes = [...nodes];
            this.edges = [...edges];
            this.saved = false;
          }
          if (this.automation_id) {
            const data = {
              automation: this.automation_id,
              ref: newSource
            };
            this.actionTimelines = await this.automationService
              .getActionTimelines(data)
              .toPromise();
          }
          const branchOption = isRemoveParent
            ? 'branch_condition_with_action'
            : 'branch_condition';
          const option = {
            type: res.id == 'child' ? 'end' : branchOption,
            answer: res.id == 'trueNodes' ? true : false,
            isRemoveCase: true
          };
          this.removeActionTimelines(deleteNodes, option);
        }
      });
  }

  removeChildNodes(node, nSource): void {
    const deleteNodes = [node.id];
    const nodes = this.nodes;
    const edges = sortEdges(this.edges);
    edges.forEach((e) => {
      if (deleteNodes.indexOf(e.source) !== -1) {
        deleteNodes.push(e.target);
      }
    });
    for (let i = nodes.length - 1; i >= 0; i--) {
      const e = nodes[i];
      if (deleteNodes.indexOf(e.id) !== -1) {
        nodes.splice(i, 1);
      }
      if (nSource === e.id) {
        e.leaf = true;
      }
    }
    for (let i = edges.length - 1; i >= 0; i--) {
      const e = edges[i];
      if (deleteNodes.indexOf(e.source) !== -1) {
        edges.splice(i, 1);
      } else if (e.target === node.id) {
        edges.splice(i, 1);
      }
    }
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.saved = false;

    this.removeActionTimelines(deleteNodes, { type: 'end' });
  }

  getConditionsById(parentId): any {
    const conditionNodes = [];
    const resultNodes = [];
    for (const node of this.nodes) {
      if (node.category === ACTION_CAT.CONDITION) {
        conditionNodes.push(node);
      }
    }
    for (const conditionNode of conditionNodes) {
      const index = this.edges.findIndex(
        (item) => item.target === conditionNode.id && item.source === parentId
      );
      if (index >= 0) {
        resultNodes.push(conditionNode);
      }
    }
    return resultNodes;
  }

  getMaterials(node): any {
    let materials = [];
    if (node['videos']) {
      if (Array.isArray(node['videos'])) {
        materials = [...node['videos']];
      } else {
        materials = [node['videos']];
      }
    }
    if (node['pdfs']) {
      if (Array.isArray(node['pdfs'])) {
        materials = [...materials, ...node['pdfs']];
      } else {
        materials = [...materials, node['pdfs']];
      }
    }
    if (node['images']) {
      if (Array.isArray(node['images'])) {
        materials = [...materials, ...node['images']];
      } else {
        materials = [...materials, node['images']];
      }
    }
    return materials;
  }

  getTypeMaterials(node): any {
    const videoIds = [];
    const pdfIds = [];
    const imageIds = [];

    const videoReg = new RegExp(
      environment.website + '/video[?]video=\\w+',
      'g'
    );
    const pdfReg = new RegExp(environment.website + '/pdf[?]pdf=\\w+', 'g');
    const imageReg = new RegExp(
      environment.website + '/image[?]image=\\w+',
      'g'
    );

    let matches = node['content'].match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video?video=', '');
        videoIds.push(videoId);
      });
    }
    matches = node['content'].match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const pdfId = e.replace(environment.website + '/pdf?pdf=', '');
        pdfIds.push(pdfId);
      });
    }
    matches = node['content'].match(imageReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const imageId = e.replace(environment.website + '/image?image=', '');
        imageIds.push(imageId);
      });
    }

    return {
      videoIds,
      imageIds,
      pdfIds
    };
  }

  isAssignable(node): boolean {
    if (node.type === 'deal' || node.type === 'move_deal') {
      const childNodes = this.getChildren(node);
      const index = childNodes.findIndex((item) => item.type === 'automation');
      if (index >= 0) {
        return false;
      }
    }
    return true;
  }
  getChildren(node): any {
    const childNodes = [];
    const childEdges = this.edges.filter((item) => item.source === node.id);
    for (const edge of childEdges) {
      const index = this.nodes.findIndex((item) => item.id === edge.target);
      if (index >= 0) {
        childNodes.push(this.nodes[index]);
      }
    }
    return childNodes;
  }

  getParents(id): any {
    const edgesObj = {};
    this.edges.forEach((e) => {
      edgesObj[e.target] = e.source;
    });
    let target = id;
    const parents = [target];
    while (edgesObj[target]) {
      parents.push(edgesObj[target]);
      target = edgesObj[target];
    }
    return parents;
  }

  getParentTypes(parents): any {
    const types = [];
    if (parents && parents.length > 0) {
      for (const parentId of parents) {
        const index = this.nodes.findIndex((item) => item.id === parentId);
        if (index >= 0) {
          if (this.nodes[index].type) {
            types.push(this.nodes[index].type);
          }
        }
      }
    }
    return types;
  }

  startDrop(event): void {
    console.log('START DROP', event);
  }
  allowStartDrop(event, node): void {
    event.preventDefault();
  }
  enableStartArea(event, node): void {
    if (event.dataTransfer && event.dataTransfer.type) {
      node.droppable = true;
    }
  }
  disableStartArea(event, node): any {
    if (
      event.target.closest('.drop-target') &&
      !event.target.classList.contains('drop-target')
    ) {
      return;
    }
    node.droppable = false;
  }
  dragAction(event, type): void {
    event.dataTransfer.setData('action', type);
  }

  storeData(): any {
    return new Promise((resolve, reject) => {
      if (this.automation_title === '') {
        this.toastr.error(
          `You've made edits to an automation provided to you, please add a title for this new automation`
        );
        reject(false);
        return;
      }
      if (this.nodes.length === 1) {
        this.toastr.error(
          'Automation must have one or more actions. Please add action.'
        );
        reject(false);
        return;
      }
      const parentsObj = {}; // Parent Ids of each node
      const caseActions = {}; // Case actions Object
      const nodesObj = {};
      const actions = [];

      // fix type error actions in old version
      for (const node of this.nodes) {
        if (!this.isAvailableAssignAt(this.automation_type, node)) {
          node.group = undefined;
        }
      }

      const saveNodes = [...this.nodes.filter((e) => e.id !== 'a_10000')];
      const saveEdges = [...this.edges];
      //remove start action.
      const index = saveNodes.findIndex(
        (item) => item.category === ACTION_CAT.START
      );
      if (index >= 0) {
        saveNodes.splice(index, 1);
      }

      saveEdges.forEach((e) => {
        parentsObj[e.target] = e.source;
      });
      saveNodes.forEach((e) => {
        if (e.category === ACTION_CAT.CONDITION) {
          caseActions[e.id] = e;
        }
        nodesObj[e.id] = e;
      });
      saveNodes.forEach((e) => {
        if (e.category !== ACTION_CAT.CONDITION) {
          const parentId = parentsObj[e.id] || '0';
          // Check if the parent action is case action
          if (caseActions[parentId]) {
            const caseAction = caseActions[parentId];
            const caseParentActionId = parentsObj[caseAction.id];
            const caseParentAction = nodesObj[caseParentActionId];
            if (caseParentAction) {
              let type = e.type;
              if (
                e.type === 'text' ||
                e.type === 'send_text_video' ||
                e.type === 'send_text_pdf' ||
                e.type === 'send_text_image' ||
                e.type === 'send_text_material'
              ) {
                if (e.type.indexOf('send_text') !== -1) {
                  const { videoIds, imageIds, pdfIds } =
                    this.getTypeMaterials(e);
                }

                type = 'text';
              }
              if (
                e.type === 'email' ||
                e.type === 'send_email_video' ||
                e.type === 'send_email_pdf' ||
                e.type === 'send_email_image' ||
                e.type === 'send_email_material'
              ) {
                type = 'email';
              }
              let action;

              if (e.commands) {
                action = {
                  parent: caseParentActionId,
                  id: e.id,
                  period: e.period,
                  condition: caseAction.condition,
                  status: 'pending',
                  action: {
                    type,
                    task_type: e.task_type,
                    content: e.content,
                    deal_name: e.deal_name,
                    deal_stage: e.deal_stage,
                    automation_id: e.automation_id,
                    appointment: e.appointment,
                    subject: e.subject,
                    due_date: e.due_date,
                    due_duration: e.due_duration,
                    videos: e.videos,
                    pdfs: e.pdfs,
                    images: e.images,
                    commands: e.commands,
                    ref_id: e.ref_id,
                    attachments: e.attachments,
                    timezone: e.timezone,
                    audio: e.audio,
                    condition_field: e.condition_field,
                    contact_conditions: e.contact_conditions,
                    share_users: e.share_users,
                    share_all_member: e.share_all_member,
                    round_robin: e.round_robin,
                    share_type: e.share_type,
                    share_team: e.share_team,
                    description: e.description
                  }
                };
              } else {
                action = {
                  parent: caseParentActionId,
                  id: e.id,
                  period: e.period,
                  condition: caseAction.condition,
                  status: 'pending',
                  action: {
                    type,
                    task_type: e.task_type,
                    content: e.content,
                    deal_name: e.deal_name,
                    deal_stage: e.deal_stage,
                    automation_id: e.automation_id,
                    appointment: e.appointment,
                    subject: e.subject,
                    due_date: e.due_date,
                    due_duration: e.due_duration,
                    videos: e.videos,
                    pdfs: e.pdfs,
                    images: e.images,
                    command: e.command,
                    ref_id: e.ref_id,
                    attachments: e.attachments,
                    timezone: e.timezone,
                    audio: e.audio,
                    condition_field: e.condition_field,
                    contact_conditions: e.contact_conditions,
                    share_users: e.share_users,
                    share_all_member: e.share_all_member,
                    round_robin: e.round_robin,
                    share_type: e.share_type,
                    share_team: e.share_team,
                    description: e.description
                  }
                };
              }
              if (e['parent_type'] && e['parent_type'] === 'deal') {
                action['type'] = 'deal';
              }
              action['watched_materials'] = [];
              if (caseAction.condition.primary) {
                action['watched_materials'] = [caseAction.condition.primary];
              } else {
                if (
                  caseParentAction['videos'] &&
                  caseParentAction['videos'].length > 0
                ) {
                  const watched_video = caseParentAction['videos'];
                  action['watched_materials'] = [
                    ...action['watched_materials'],
                    ...watched_video
                  ];
                }
                if (
                  caseParentAction['pdfs'] &&
                  caseParentAction['pdfs'].length > 0
                ) {
                  const watched_pdf = caseParentAction['pdfs'];
                  action['watched_materials'] = [
                    ...action['watched_materials'],
                    ...watched_pdf
                  ];
                }
                if (
                  caseParentAction['images'] &&
                  caseParentAction['images'].length > 0
                ) {
                  const watched_image = caseParentAction['images'];
                  action['watched_materials'] = [
                    ...action['watched_materials'],
                    ...watched_image
                  ];
                }
              }
              if (!this.isAssignable(e)) {
                action['action']['has_automation'] = true;
              }
              // if (action.condition && action.condition.primary) {
              //   delete action.condition.primary;
              // }
              actions.push(action);
            }
          } else {
            const action = {
              parent: parentId,
              id: e.id,
              period: e.period,
              status: 'pending'
            };
            if (parentId === 'a_10000') {
              action['status'] = 'active';
            }

            let type = e.type;
            if (
              e.type === 'text' ||
              e.type === 'send_text_video' ||
              e.type === 'send_text_pdf' ||
              e.type === 'send_text_image' ||
              e.type === 'send_text_material'
            ) {
              if (e.type.indexOf('send_text') !== -1) {
                const { videoIds, imageIds, pdfIds } = this.getTypeMaterials(e);
              }

              type = 'text';
            }
            if (
              e.type === 'email' ||
              e.type === 'send_email_video' ||
              e.type === 'send_email_pdf' ||
              e.type === 'send_email_image' ||
              e.type === 'send_email_material'
            ) {
              type = 'email';
            }
            if (e.commands) {
              action['action'] = {
                type,
                task_type: e.task_type,
                content: e.content,
                subject: e.subject,
                deal_name: e.deal_name,
                deal_stage: e.deal_stage,
                voicemail: e.voicemail,
                automation_id: e.automation_id,
                appointment: e.appointment,
                due_date: e.due_date,
                due_duration: e.due_duration,
                videos: e.videos,
                pdfs: e.pdfs,
                images: e.images,
                commands: e.commands,
                ref_id: e.ref_id,
                attachments: e.attachments,
                timezone: e.timezone,
                group: e.group,
                audio: e.audio,
                condition_field: e.condition_field,
                contact_conditions: e.contact_conditions,
                share_users: e.share_users,
                share_all_member: e.share_all_member,
                round_robin: e.round_robin,
                share_type: e.share_type,
                share_team: e.share_team,
                description: e.description
              };
            } else {
              action['action'] = {
                type,
                task_type: e.task_type,
                content: e.content,
                subject: e.subject,
                deal_name: e.deal_name,
                deal_stage: e.deal_stage,
                voicemail: e.voicemail,
                automation_id: e.automation_id,
                appointment: e.appointment,
                due_date: e.due_date,
                due_duration: e.due_duration,
                videos: e.videos,
                pdfs: e.pdfs,
                images: e.images,
                command: e.command,
                ref_id: e.ref_id,
                attachments: e.attachments,
                timezone: e.timezone,
                group: e.group,
                audio: e.audio,
                condition_field: e.condition_field,
                contact_conditions: e.contact_conditions,
                share_users: e.share_users,
                share_all_member: e.share_all_member,
                round_robin: e.round_robin,
                share_type: e.share_type,
                share_team: e.share_team,
                description: e.description
              };
            }
            // if (e.group) {
            //   action['action']['group'] = e.group;
            // }
            if (e['parent_type'] && e['parent_type'] === 'deal') {
              action['type'] = 'deal';
            }
            if (!this.isAssignable(e)) {
              action['action']['has_automation'] = true;
            }
            actions.push(action);
          }
        }
      });
      this.automation_type = 'any';
      // fix actions type for automation type and set root flag.
      this.actionCount = actions.length || 0;
      for (const action of actions) {
        if (action.action && action.action.type === 'move_deal') {
          action.type = 'deal';
          this.automation_type = 'deal';
        } else {
          if (action.action && action.action.type) {
            const aType = this.getActionType(action.action.type);
            if (aType != undefined) {
              this.automation_type = aType;
            }
          }
          // if (this.automation_type === 'contact') {
          //   if (action.action.type === 'deal') {
          //     delete action.type;
          //   } else if (
          //     action.action.group === '' ||
          //     (action.action.group && action.action.group.length > 0)
          //   ) {
          //     action.type = 'deal';
          //   } else {
          //     delete action.type;
          //   }
          // } else {
          //   // action.type = 'deal';
          // }
        }

        // set root flag.
        if (action.parent === 'a_10000') {
          action.action['is_root'] = true;
        } else {
          delete action.action['is_root'];
        }
      }
      if (this.editMode === 'edit') {
        if (this.auth === 'admin' || this.auth === 'shared') {
          if (this.automation.title === this.automation_title) {
            this.toastr.error(
              `Please input another title and save it as new automation`
            );
            reject(false);
          } else {
            this.isSaving = true;
            this.automationService
              .create({
                title: this.automation_title,
                description: this.automation_description,
                automations: actions,
                type: this.automation_type,
                label: this.label,
                is_sharable: this.is_sharable,
                trigger: this.automationTrigger?.type
                  ? this.automationTrigger
                  : null,
                is_active: this.is_active
              })
              .subscribe(
                (res) => {
                  if (res) {
                    this.isSaving = false;
                    this.saved = true;
                    // this.toastr.success('Automation created successfully');
                    const path = '/autoflow/edit/' + res['_id'];
                    this.router.navigate([path]);
                    this.editMode = 'edit';
                    this.auth = 'owner';
                    this.automation = res;
                    this.automation_id = res['_id'];
                    this.pageContacts = [];
                    this.automationService.reload();
                    resolve(true);
                  }
                },
                (err) => {
                  this.isSaving = false;
                  reject(false);
                }
              );
          }
        } else {
          this.isSaving = true;
          this.automationService
            .update(this.automation._id, {
              title: this.automation_title,
              description: this.automation_description,
              automations: actions,
              label: this.label,
              type: this.automation_type,
              is_sharable: this.is_sharable,
              trigger: this.automationTrigger?.type
                ? this.automationTrigger
                : null,
              is_active: this.is_active
            })
            .subscribe(
              (res) => {
                this.isSaving = false;
                this.saved = true;
                this.afterCheckAutomationType();
                // this.toastr.success('Automation saved successfully');
                this.automationService.reload();
                resolve(true);
              },
              (err) => {
                this.isSaving = false;
                reject(false);
              }
            );
        }
      } else {
        this.route.queryParams.subscribe((params) => {
          this.isSaving = true;
          const payload = {
            title: this.automation_title,
            type: this.automation_type,
            automations: actions,
            label: this.label,
            is_sharable: this.is_sharable,
            trigger: this.automationTrigger?.type
              ? this.automationTrigger
              : null,
            is_active: this.is_active
          };
          if (params['folder'] && params['folder'] !== 'root') {
            payload['folder'] = params['folder'];
          }
          this.automationService.create(payload).subscribe(
            (res) => {
              if (res) {
                this.isSaving = false;
                this.saved = true;
                // this.toastr.success('Automation created successfully');
                const path = '/autoflow/edit/' + res['_id'];
                this.router.navigate([path]);
                this.editMode = 'edit';
                this.auth = 'owner';
                this.automation = res;
                this.automation_id = res['_id'];
                this.pageContacts = [];
                this.automationService.reload();
                resolve(true);
              }
            },
            (err) => {
              this.isSaving = false;
              reject(false);
            }
          );
        });
      }
    });
  }

  setLayout(): void {
    setTimeout(() => {
      const rect = document.querySelector('.nodes').getClientRects()[0];
      const graphWidth = rect.width;
      this.offsetX = (this.wrapperWidth - graphWidth) / 2;
    }, 100);
  }
  afterCheckAutomationType(): void {
    this.tabs = [{ icon: '', label: 'Builder', id: 'activity' }];
    if (this.automation_type === 'deal' && this.contacts < 1) {
      this.tabs.push({
        icon: '',
        label: 'Assigned Deals',
        id: 'deals'
      });
    } else if (this.automation_type === 'contact' && this.totalDeals < 1) {
      this.tabs.push({
        icon: '',
        label: 'Assigned Contacts',
        id: 'contacts'
      });
    } else {
      this.tabs.push({
        icon: '',
        label: 'Assigned Contacts',
        id: 'contacts'
      });
      this.tabs.push({
        icon: '',
        label: 'Assigned Deals',
        id: 'deals'
      });
    }
    if (this.tabs.findIndex((item) => item.id == this.selectedTab?.id) === -1) {
      this.selectedTab = this.tabs[0];
    }
  }
  clearAllNodes(): void {
    this.nodes = [];
    this.edges = [];
    this.identity = uuidv4();
  }

  zoomIn(): void {
    if (this.zoomLevel < 1.5) {
      this.zoomLevel += 0.1;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.4) {
      this.zoomLevel -= 0.1;
    }
  }

  easyView(event: any, node: any, origin: any, content: any): void {
    this.closeAddAction();
    this.closeEditAction();
    event.stopPropagation();
    event.preventDefault();
    if (node.type === 'automation') {
      node['no_timelines'] = true;
    }
    node['automation'] = this.automation ? this.automation._id : null;
    node['automation_type'] = this.automation_type;
    if (this.automation) {
      node['automation'] = this.automation._id;
      node['automation_type'] = this.automation_type;
    }
    this.overlayService
      .open(origin, content, this.viewContainerRef, 'automation', {
        data: node
      })
      .subscribe((res) => {
        if (res) {
          this.actionTimelines = res.timelines;
          if (res.type === 'edit') {
            this.editAction(event, node, res.activeTab);
          } else if (res && res.type === 'remove') {
            this.removeAction(node);
          }
        }
      });
  }

  goToBack(): void {
    this.router.navigate(['/automations/own']);
  }

  stateChanged(): void {
    this.saved = false;
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    if (this.selectedTab !== this.tabs[1] && this.nodes.length < 1) {
      if (this.automation_id) {
        this.loadAutomation(this.automation_id, this.pageSize.id, 0);
      }
    }
    localStorage.setCrmItem('automation', tab.id);
  }

  assignContacts(): void {
    const selectTab =
      this.selectedTab.id === 'activity' ? this.tabs[1] : this.selectedTab;

    let type = selectTab.id === 'deals' ? 'deal' : 'contact';
    if (this.contacts > 0 && this.automation_type == 'deal') {
      type = 'deal';
    }
    if (this.totalDeals > 0 && this.automation_type == 'contact') {
      type = 'contact';
    }
    this.dialog
      .open(AutomationAssignComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          automation: this.automation,
          defaultTab: type,
          assignType: this.automation_type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.status) {
          this.loadAutomation(
            this.automation._id,
            this.pageSize.id,
            0,
            selectTab
          );
        }
      });
  }

  delete(): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete Automation',
        message: 'Are you sure to delete the automation?',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.deleting = true;
        // this.automationService.delete(this.automation_id).subscribe(
        //   (response) => {
        //     this.deleting = false;
        //     this.goToBack();
        //     this.automationService.reload();
        //   },
        //   (err) => {
        //     this.deleting = false;
        //   }
        // );

        this.route.queryParams.subscribe((params) => {
          const folder = params['folder'];
          this.automationService.delete(folder, this.automation_id).subscribe(
            (response) => {
              this.deleting = false;
              if (
                response.status &&
                response.error_message &&
                response.error_message.length > 0
              ) {
                const confirmBulkDialog = this.dialog.open(
                  ConfirmRemoveAutomationComponent,
                  {
                    position: { top: '100px' },
                    data: {
                      title: 'Delete Automation',
                      additional: response.error_message,
                      automation_id: this.automation_id,
                      message:
                        "You can't remove automation '" +
                        this.automation_title +
                        "'."
                    }
                  }
                );
                confirmBulkDialog.afterClosed().subscribe((res1) => {
                  this.automationService.reload();
                });
              } else {
                this.goToBack();
                this.automationService.reload();
              }
            },
            (err) => {
              this.deleting = false;
            }
          );
        });
      }
    });
  }

  unassign(contact): void {}

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
  }
  /**
   * Check contact is selected.
   * @param contact : ContactActivity
   */
  isSelected(contact: ContactActivity): boolean {
    const index = this.pageSelection.findIndex(
      (item) => item._id == contact._id
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
    return this.pageSelection.length === this.pageContacts.length;
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
    if (this.searchStr === '') {
      this.loadContacts(this.automation_id, this.pageSize.id, skip);
    }
  }
  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
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

  changeSearchStr(): void {
    this.searchSubscription && this.searchSubscription.unsubscribe();
    this.searchSubscription = this.automationService
      .searchContact(this.automation._id, this.searchStr)
      .subscribe((res) => {
        if (res) {
          this.pageContacts = [];
          for (let i = 0; i < res.length; i++) {
            const newContact = new ContactActivity().deserialize(res[i]);
            this.pageContacts.push(newContact);
          }
          this.contacts = this.pageContacts.length;
        }
      });
    this.page = 1;
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changePage(1);
  }

  openContact(contact: ContactActivity): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  openDeal(deal: Deal): void {
    if (deal && deal._id) {
      this.router.navigate(['pipeline'], { queryParams: { deals: deal._id } });
    }
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
   * Select All Contacts
   */
  selectAll(source = false): void {
    if (source) {
      this.updateActionsStatus('select', true);
      this.selectSource = 'header';
    } else {
      this.selectSource = 'page';
    }
    this.selecting = true;
    this.selectSubscription && this.selectSubscription.unsubscribe();
    this.selectSubscription = this.automationService
      .selectAll(this.automation._id)
      .subscribe((contacts) => {
        this.selecting = false;
        this.selection = _.unionBy(this.selection, contacts, '_id');
        this.pageSelection = _.intersectionBy(
          this.selection,
          this.pageContacts,
          '_id'
        );
        this.contacts = contacts.length;
        this.updateActionsStatus('select', false);
      });
  }

  /**
   * Update the Command Status
   * @param command :Command String
   * @param loading :Whether current action is running
   */
  updateActionsStatus(command: string, loading: boolean): void {
    this.CONTACT_ACTIONS.some((e) => {
      if (e.command === command) {
        e.loading = loading;
        return true;
      }
    });
  }

  duplicate(event: Event, automation: Automation): void {
    event.stopPropagation();
    this.router.navigate(['/autoflow/new/' + automation._id]);
  }

  shareAutomation($event, automation): void {
    const items: CheckRequestItem[] = [automation].map((e) => ({
      _id: e._id,
      type: e.item_type
    }));
    const data = {
      automations: items
    };
    this.dialog
      .open(TeamMaterialShareComponent, {
        width: '98vw',
        maxWidth: '450px',
        data: {
          resources: data,
          type: 'automation',
          unshare: false
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.status) {
          // this.automationService.reload();
        }
      });
  }

  deselectAll(): void {
    this.pageSelection = [];
    this.selection = [];
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

  bulkContactEdit(): void {
    this.panelType = 'editorContact';
    this.contactDrawer.open();
  }

  /**
   * Panel Open and Close event
   * @param $event Panel Open Status
   */
  setContactEditPanelType($event: boolean): void {
    if (!$event) {
      this.panelType = '';
    } else {
      this.editContactPanel.clearForm();
    }
  }

  /**
   * Download CSV
   */
  downloadCSV(): void {
    this.dialog.open(DownloadContactsProgreeBarComponent, {
      width: '90vw',
      maxWidth: '800px',
      data: {
        selection: this.selection,
        custom_columns: []
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

  openTextDlg(): void {
    const contact = this.selection[0];
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
        contacts: this.selection
      }
    });
  }

  openCall(): void {
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
          this.dealsService
            .loadStage(this.dealsService.selectedPipeline.getValue())
            .subscribe((res) => {
              this.dealsService.pageStages.next(res || []);
            });
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

  shareContacts(): void {
    this.dialog
      .open(ContactShareComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          contacts: this.selection
        }
      })
      .afterClosed()
      .subscribe((res) => {});
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
          title: 'Add Automation',
          message: 'You can assign to at most 10 contacts.'
        }
      });
    }
  }

  unassignAutomation(): void {
    this.dialog
      .open(UnassignBulkAutomation, {
        maxWidth: '400px',
        width: '96vw',
        data: {
          contacts: this.selection,
          automation: this.automation._id
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.changePage(1);
          this.deselectAll();
        }
      });
  }

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
        this.bulkContactEdit();
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
      case 'stop_automation':
        this.unassignAutomation();
        break;
      case 'text':
        this.openTextDlg();
        break;
      case 'call':
        this.openCall();
        break;
      case 'deal':
        this.openDealDlg();
        break;
      case 'appointment':
        this.openAppointmentDlg();
        break;
      case 'share':
        this.shareContacts();
        break;
    }
  }

  /**
   * Handler when page number get out of the bound after remove contacts.
   * @param $event : Page Number
   */
  pageChanged($event: number): void {
    this.changePage($event);
  }

  changeDealSearchStr(): void {
    this.dealSearchSubscription && this.dealSearchSubscription.unsubscribe();
    this.searchSubscription = this.automationService
      .searchDeal(this.automation._id, this.dealSearchStr)
      .subscribe((res) => {
        if (res && res.length > 0) {
          this.pageDeals = res;
          this.deals = this.pageDeals.map((item) => item.deal);
          this.totalDeals = this.pageDeals.length;
        }
      });
    this.dealPage = 1;
  }

  clearDealSearchStr(): void {
    this.dealSearchStr = '';
    this.changeDealPage(1);
  }

  isAllSelectedDeals(): boolean {
    return this.dealPageSelection.length === this.pageDeals.length;
  }

  masterToggleDeals(): void {
    if (this.isAllSelectedDeals()) {
      this.dealSelection = _.differenceBy(
        this.dealSelection,
        this.dealPageSelection,
        '_id'
      );
      this.dealPageSelection = [];
      return;
    }
    this.pageDeals.forEach((e) => {
      if (!this.isSelectedDeal(e)) {
        this.dealPageSelection.push(e.deal);
        this.dealSelection.push(e.deal);
      }
    });
  }

  toggleDeal(deal: any): void {
    const selectedDeal = deal.deal;
    const toggledSelection = _.xorBy(
      this.dealPageSelection,
      [selectedDeal],
      '_id'
    );
    this.dealPageSelection = toggledSelection;

    const toggledAllSelection = _.xorBy(
      this.dealSelection,
      [selectedDeal],
      '_id'
    );
    this.dealSelection = toggledAllSelection;
  }

  isSelectedDeal(deal: any): boolean {
    const index = this.dealPageSelection.findIndex(
      (item) => item._id === deal.deal._id
    );
    if (index >= 0) {
      return true;
    }
    return false;
  }

  selectAllDeals(source = false): void {
    if (source) {
      this.updateDealActionsStatus('select', true);
      this.dealSelectSource = 'header';
    } else {
      this.dealSelectSource = 'page';
    }
    this.dealSelecting = true;
    this.dealSelectSubscription && this.dealSelectSubscription.unsubscribe();
    this.dealSelectSubscription = this.automationService
      .selectAllDeals(this.automation._id)
      .subscribe((deals) => {
        this.dealSelecting = false;
        this.dealSelection = _.unionBy(this.dealSelection, deals, '_id');
        this.dealPageSelection = _.intersectionBy(
          this.dealSelection,
          this.deals,
          '_id'
        );
        this.updateActionsStatus('select', false);
      });
  }

  updateDealActionsStatus(command: string, loading: boolean): void {
    this.DEAL_ACTIONS.some((e) => {
      if (e.command === command) {
        e.loading = loading;
        return true;
      }
    });
  }

  deselectAllDeals(): void {
    this.dealPageSelection = [];
    this.dealSelection = [];
  }

  changeDealPage(page: number): void {
    this.dealPage = page;
    // Normal Load by Page
    let skip = (page - 1) * this.dealPageSize.id;
    skip = skip < 0 ? 0 : skip;
    if (this.dealSearchStr === '') {
      this.loadDeals(this.automation._id, this.dealPageSize.id, skip);
    }
  }
  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changeDealPageSize(type: any): void {
    const currentSize = this.dealPageSize.id;
    this.dealPageSize = type;
    // Check with the Prev Page Size
    if (currentSize < this.dealPageSize.id) {
      // If page size get bigger
      const loaded = this.dealPage * currentSize;
      let newPage = Math.floor(loaded / this.dealPageSize.id);
      newPage = newPage > 0 ? newPage : 1;
      this.changeDealPage(newPage);
    } else {
      // if page size get smaller: TODO -> Set Selection and Page contacts
      const skipped = (this.dealPage - 1) * currentSize;
      const newPage = Math.floor(skipped / this.dealPageSize.id) + 1;
      this.changeDealPage(newPage);
    }
  }

  dealPageChanged($event: number): void {
    this.changeDealPage($event);
  }

  doDealAction(event: any): void {
    if (event.command === 'stop_automation') {
      this.dialog
        .open(UnassignBulkAutomation, {
          maxWidth: '400px',
          width: '96vw',
          data: {
            deals: this.dealSelection,
            automation: this.automation._id
          }
        })
        .afterClosed()
        .subscribe((status) => {
          if (status) {
            this.changeDealPage(1);
            this.deselectAllDeals();
          }
        });
    }
  }

  getAvatarName(contact): any {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name && !contact.last_name) {
      return contact.first_name[0];
    } else if (!contact.first_name && contact.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
  }

  changeType($event, type: string): void {
    if (this.editMode === 'edit') {
      $event.preventDefault();
      return;
    }
    //check switchable to contact
    if (type === 'contact') {
      let hasMultipleBranch = false;
      if (this.label == 'modular') {
        this.label = 'modular';
      } else {
        this.label = 'contact';
      }
      for (const edge of this.edges) {
        if (!edge.category) {
          const index = this.edges.findIndex(
            (item) => item.source === edge.source && item.id !== edge.id
          );
          if (index >= 0) {
            hasMultipleBranch = true;
            break;
          }
        }
      }
      if (hasMultipleBranch) {
        $event.preventDefault();
        this.dialog.open(NotifyComponent, {
          maxWidth: '400px',
          width: '96vw',
          data: {
            message:
              'Automation type cannot be changed when there are branches saved in the automation. Please remove all branches and try again or create a new automation instead.'
          }
        });
        return;
      }
      let hasNoSwitchableActions = false;
      for (const node of this.nodes) {
        if (node.type === 'automation' || node.type === 'move_deal') {
          hasNoSwitchableActions = true;
          break;
        }
        if (!this.isAvailableAssignAt(type, node)) {
          node.group = undefined;
        }
      }
      if (hasNoSwitchableActions) {
        $event.preventDefault();
        this.dialog.open(NotifyComponent, {
          maxWidth: '400px',
          width: '96vw',
          data: {
            message: `Automation type cannot be changed because it contains "New Deal", "Move Deal" or "Automation" actions. Please remove these actions and try again or create a new automation instead.`
          }
        });
        return;
      }
      this.automation_type = type;
      this.storeService.automationType.next(type);
      this.isEditTitleMode = true;
    } else {
      let hasNoSwitchableActions = false;
      if (this.label == 'modular') {
        this.label = 'modular';
      } else {
        this.label = 'deal';
      }
      for (const node of this.nodes) {
        if (this.NoSwitchableActions.indexOf(node.type) >= 0) {
          hasNoSwitchableActions = true;
          break;
        }
      }
      if (hasNoSwitchableActions) {
        this.label = 'deal';
        const dealNode = this.nodes.findIndex((item) => item.type === 'deal');
        if (dealNode >= 0) {
          $event.preventDefault();
          this.dialog.open(NotifyComponent, {
            maxWidth: '400px',
            width: '96vw',
            data: {
              message: `Automation type cannot be changed because it contains "New Deal", "Move Deal" or "Automation" actions. Please remove these actions and try again or create a new automation instead.`
            }
          });
          return;
        }
      }
      this.automation_type = type;
      this.storeService.automationType.next(type);
      this.isEditTitleMode = true;
    }
  }

  isLastAddedAction(node): boolean {
    if (this.lastUpdatedAction) {
      if (this.lastUpdatedAction.id === node.id) {
        return true;
      }
    }
    return false;
  }

  isLastClickedLink(link): boolean {
    if (this.lastUpdatedLink) {
      if (this.lastUpdatedLink.id === link.id) {
        return true;
      }
    }
    return false;
  }

  isShowStartTrigger(): boolean {
    if (this.nodes.length > 0) {
      if (this.nodes.length === 1 && this.nodes[0].id === 'a_10000') {
        return true;
      }
      return false;
    }
  }

  isAvailableAssignAt(type, node): boolean {
    const parents = this.getParents(node.id);
    let isMoveDeal = false;
    if (type === 'deal') {
      isMoveDeal = true;
    } else {
      for (const nodeId of parents) {
        const dealIndex = this.nodes.findIndex(
          (item) => item.id === nodeId && item.type === 'deal'
        );
        if (dealIndex >= 0) {
          isMoveDeal = true;
        }
      }
    }
    if (isMoveDeal) {
      return true;
    }
    return false;
  }

  closeAddAction(): void {
    this.addDrawer.close();
  }

  closeEditAction(): void {
    this.editDrawer.close();
  }

  closeRemoveAction(): void {
    this.removeDrawer.close();
  }

  closeStartTrigger(trigger?: ITrigger): void {
    if (trigger) {
      this.automationTrigger = trigger;
      if (this.editMode !== 'new' && this.isEditable()) {
        this.storeData().then((res) => {
          this.toastr.success('Updating is saved!');
        });
      }
    }
    this.triggerDrawer.close();
  }

  runAction(res): void {
    if (this.editMode !== 'new' && this.isEditable()) {
      this.isEditTitleMode = false;
    }

    switch (this.actionMethod) {
      case ACTION_METHOD.ADD_INSERT_ACTION:
        this.runInsertAction(res);
        this.closeAddAction();
        break;
      case ACTION_METHOD.ADD_INSERT_BRANCH:
        this.runInsertBranch(res);
        this.closeAddAction();
        break;
      case ACTION_METHOD.ADD_ACTION:
        this.runAddAction(res);
        this.closeAddAction();
        break;
      case ACTION_METHOD.EDIT_ACTION:
        this.runEditAction(res);
        this.closeEditAction();
        break;
      case ACTION_METHOD.REMOVE_ACTION:
        this.runRemoveAction(res);
        this.closeRemoveAction();
        break;
      default:
    }
  }

  async runInsertAction(res): Promise<void> {
    const link = this.actionParam;
    this.actionTimelines = res.actionTimelines || [];
    this.updateTimelineOption = res.updateTimeline
      ? res.updateTimeline
      : 'update';
    if (link) {
      const source = link.source;
      const target = link.target;
      //const lastIndex = this.identity;
      const lastIndex = uuidv4();
      let newId = 'a_' + lastIndex;

      // get node from link
      let node = null;
      const nodeIndex = this.nodes.findIndex((item) => item.id === source);
      if (nodeIndex >= 0) {
        node = this.nodes[nodeIndex];
      }

      if (res.category === ACTION_CAT.CONDITION) {
        if (this.automation) {
          this.actionTimelines = await this.automationService
            .getActionTimelines({
              automation: this.automation_id,
              ref: target
            })
            .toPromise();
        }
        const confirmDialog = this.dialog.open(SelectBranchComponent, {
          ...DialogSettings.CONFIRM
        });

        confirmDialog.afterClosed().subscribe((response) => {
          if (response.answer) {
            const answer = response.answer === 'yes';
            if (node) {
              const parents = this.getParents(node.id);
              const parentTypes = this.getParentTypes(parents);

              let hasDeal = false;
              if (this.automation_type === 'deal') {
                hasDeal = true;
              } else {
                if (parentTypes.length > 0) {
                  const index = parentTypes.indexOf('deal');
                  if (index >= 0) {
                    hasDeal = true;
                  }
                }
              }

              const yesId = newId;
              const nodes = this.nodes;
              let data = {
                ...res,
                id: newId,
                index: lastIndex,
                label: 'YES',
                leaf: answer ? false : true,
                condition: res.multipleReview
                  ? { case: res.type, answer: true, condition_type: 1 }
                  : { case: res.type, answer: true, primary: res.primary }
              };
              if (hasDeal) {
                data['parent_type'] = 'deal';
              }
              nodes.push(data);
              const currentId = node.id;

              const edges = sortEdges(this.edges);
              edges.push({
                id: currentId + '_' + newId,
                source: currentId,
                target: newId,
                category: 'case',
                answer: 'yes'
              });
              const nIndex = uuidv4();
              newId = 'a_' + nIndex;
              const noId = newId;
              data = {
                ...res,
                id: newId,
                index: nIndex,
                label: 'NO',
                leaf: answer ? true : false,
                condition: res.multipleReview
                  ? { case: res.type, answer: false, condition_type: 1 }
                  : { case: res.type, answer: false, primary: res.primary }
              };
              if (hasDeal) {
                data['parent_type'] = 'deal';
              }
              nodes.push(data);
              edges.push({
                id: currentId + '_' + newId,
                source: currentId,
                target: newId,
                category: 'case',
                type: res.type,
                hasLabel: true,
                answer: 'no'
              });
              //this.identity += 2;
              this.identity = uuidv4();

              edges.some((e, index) => {
                if (e.id === link.id) {
                  edges.splice(index, 1);
                  return true;
                }
              });

              // get next node
              const nextNodeIndex = nodes.findIndex(
                (item) => item.id === target
              );
              if (answer) {
                if (nextNodeIndex >= 0) {
                  nodes[nextNodeIndex].parent = yesId;
                  const addedEdge = {
                    id: yesId + '_' + nodes[nextNodeIndex].id,
                    source: yesId,
                    target: nodes[nextNodeIndex].id
                  };
                  edges.push(addedEdge);
                  this.actionParam = addedEdge;
                }
              } else {
                if (nextNodeIndex >= 0) {
                  if (nodes[nextNodeIndex].period === 0)
                    nodes[nextNodeIndex].period = 1 / 6; //set 10mins as default
                  nodes[nextNodeIndex].parent = noId;
                  const addedEdge = {
                    id: noId + '_' + nodes[nextNodeIndex].id,
                    source: noId,
                    target: nodes[nextNodeIndex].id
                  };
                  edges.push(addedEdge);
                  this.actionParam = addedEdge;
                }
              }
              this.nodes = [...nodes];
              this.edges = [...edges];

              if (nextNodeIndex >= 0) {
                const childNode = { ...this.nodes[nextNodeIndex] };
                const option = { type: '', watched_materials: [] };
                const watched_materials = [
                  ...node.videos,
                  ...node.pdfs,
                  ...node.images
                ];
                if (res.type === 'watched_material') {
                  option.type = 'send_email_material';
                  option.watched_materials = watched_materials;
                }
                childNode.condition = {
                  case: res.type,
                  answer
                };
                this.updateActionTimelines(childNode, option);
              }
            }
          }

          if (this.actionParam) {
            this.lastUpdatedLink = this.actionParam;
            const source = this.actionParam.source;
            const parents = this.getParents(source);
            const prevFollowUps = [];
            this.nodes.forEach((e) => {
              if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
                prevFollowUps.push(e);
              }
            });
            const prevAppointments = [];
            this.nodes.forEach((e) => {
              if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
                prevAppointments.push(e);
              }
            });
            //has new deal node in automation
            let isNewDeal = false;
            if (this.automation_type === 'deal') {
              isNewDeal = true;
            } else {
              const index = this.nodes.findIndex(
                (item) => item.type === 'deal'
              );
              if (index >= 0) {
                isNewDeal = true;
              }
            }

            //is insertable move deal
            let isMoveDeal = false;
            if (this.automation_type === 'deal') {
              isMoveDeal = true;
            } else {
              for (const nodeId of parents) {
                const dealIndex = this.nodes.findIndex(
                  (item) => item.id === nodeId && item.type === 'deal'
                );
                if (dealIndex >= 0) {
                  isMoveDeal = true;
                }
              }
            }

            // get node from link
            let node = null;
            const nodeIndex = this.nodes.findIndex(
              (item) => item.id === source
            );
            if (nodeIndex >= 0) {
              node = this.nodes[nodeIndex];
            }

            if (node) {
              // CONDITION ACTION HANDLER
              let conditionHandler = '';
              if (node?.condition) {
                if (node?.type === 'contact_condition') {
                  conditionHandler = 'trueCase';
                } else {
                  conditionHandler = node.condition?.answer
                    ? 'trueCase'
                    : 'falseCase';
                }
              }
              const data = {
                currentAction: node.type,
                parentAction: node,
                conditionHandler,
                follows: prevFollowUps,
                appointments: prevAppointments,
                hasNewDeal: isNewDeal,
                moveDeal: isMoveDeal,
                automation: this.automation,
                automation_type: this.automation_type
              };

              // prevent show condition handler when has 2 branches
              const childNodes =
                this.edges.filter((item) => item.source == node.id) || [];
              if (childNodes.length >= 2) {
                delete data.conditionHandler;
                delete data.currentAction;
              }

              this.storeService.actionInputData.next(data);
              this.actionMethod = ACTION_METHOD.ADD_INSERT_ACTION;
            }
          }
        });
      } else {
        if (res.type === 'contact_condition') {
          const confirmDialog = this.dialog.open(
            SelectContactConditionComponent,
            {
              ...DialogSettings.CONFIRM,
              data: { node: res }
            }
          );

          confirmDialog.afterClosed().subscribe((response) => {
            if (response.condition) {
              this.insertContactConditionAction(res, response.condition);
            }
          });
        } else if (
          res.type === 'automation' ||
          res.type === 'deal' ||
          res.type === 'move_deal'
        ) {
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Remove all child nodes',
                message: 'Are you sure to remove all related child nodes?',
                confirmLabel: 'Delete',
                mode: 'warning'
              }
            })
            .afterClosed()
            .subscribe((answer) => {
              if (answer) {
                const nodes = this.nodes;
                const newNode = {
                  ...res,
                  id: newId,
                  index: lastIndex,
                  label: this.ACTIONS[res.type],
                  leaf: res.type !== 'automation'
                };
                nodes.push(newNode);
                const edges = sortEdges(this.edges);
                edges.some((e, index) => {
                  if (e.id === link.id) {
                    edges.splice(index, 1);
                    return true;
                  }
                });
                edges.push({
                  id: source + '_' + newId,
                  source,
                  target: newId
                });
                const deleteNodes = [target];
                edges.forEach((e) => {
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    deleteNodes.push(e.target);
                  }
                });
                for (let i = edges.length - 1; i >= 0; i--) {
                  const e = edges[i];
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    edges.splice(i, 1);
                  }
                }
                for (let i = nodes.length - 1; i >= 0; i--) {
                  const e = nodes[i];
                  if (deleteNodes.indexOf(e.id) !== -1) {
                    nodes.splice(i, 1);
                  }
                }
                this.nodes = [...nodes];
                this.edges = [...edges];
                this.saved = false;
                this.addActionTimelines(newNode, {
                  type: 'end',
                  removeRefs: deleteNodes
                });
              }
            });
        } else if (res.type === 'move_contact') {
          if (this.nodes.findIndex((_nd) => _nd.id == target) < 0) {
            const nodes = this.nodes;
            const newNode = {
              ...res,
              id: newId,
              index: lastIndex,
              label: this.ACTIONS[res.type]
              // leaf: true
            };
            nodes.push(newNode);
            const edges = sortEdges(this.edges);
            edges.some((e, index) => {
              if (e.id === link.id) {
                edges.splice(index, 1);
                return true;
              }
            });
            edges.push({ id: source + '_' + newId, source, target: newId });
            this.identity++;
            this.nodes = [...nodes];
            this.edges = [...edges];
            this.saved = false;
            this.addActionTimelines(newNode);
          } else {
            this.dialog
              .open(ConfirmComponent, {
                ...DialogSettings.CONFIRM,
                data: {
                  title: 'Remove all child nodes',
                  message:
                    "This action won't allow next actions. Are you sure all child actions by adding it?",
                  confirmLabel: 'Delete',
                  mode: 'warning'
                }
              })
              .afterClosed()
              .subscribe((answer) => {
                if (answer) {
                  const nodes = this.nodes;
                  const newNode = {
                    ...res,
                    id: newId,
                    index: lastIndex,
                    label: this.ACTIONS[res.type]
                  };
                  nodes.push(newNode);
                  const edges = sortEdges(this.edges);
                  edges.some((e, index) => {
                    if (e.id === link.id) {
                      edges.splice(index, 1);
                      return true;
                    }
                  });
                  edges.push({
                    id: source + '_' + newId,
                    source,
                    target: newId
                  });
                  const deleteNodes = [target];
                  edges.forEach((e) => {
                    if (deleteNodes.indexOf(e.source) !== -1) {
                      deleteNodes.push(e.target);
                    }
                  });
                  for (let i = edges.length - 1; i >= 0; i--) {
                    const e = edges[i];
                    if (deleteNodes.indexOf(e.source) !== -1) {
                      edges.splice(i, 1);
                    }
                  }
                  for (let i = nodes.length - 1; i >= 0; i--) {
                    const e = nodes[i];
                    if (deleteNodes.indexOf(e.id) !== -1) {
                      nodes.splice(i, 1);
                    }
                  }
                  this.nodes = [...nodes];
                  this.edges = [...edges];
                  this.saved = false;

                  this.addActionTimelines(newNode, {
                    type: 'end',
                    removeRefs: deleteNodes
                  });
                }
              });
          }
        } else {
          const nodes = this.nodes;
          const newNode = {
            ...res,
            id: newId,
            index: lastIndex,
            label: this.ACTIONS[res.type]
            // leaf: true
          };
          nodes.push(newNode);
          const edges = sortEdges(this.edges);
          edges.some((e, index) => {
            if (e.id === link.id) {
              edges.splice(index, 1);
              return true;
            }
          });
          edges.push({ id: source + '_' + newId, source, target: newId });

          const addedEdge = {
            id: newId + '_' + target,
            source: newId,
            target
          };
          edges.push(addedEdge);
          this.actionParam = addedEdge;

          //this.identity++;
          this.identity = uuidv4();
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.saved = false;

          const option = {
            type: node.condition ? 'branch_condition' : 'normal'
          };
          this.addActionTimelines(newNode, option);
        }

        if (this.actionParam) {
          this.lastUpdatedLink = this.actionParam;
          const source = this.actionParam.source;
          const parents = this.getParents(source);
          const prevFollowUps = [];
          this.nodes.forEach((e) => {
            if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
              prevFollowUps.push(e);
            }
          });
          const prevAppointments = [];
          this.nodes.forEach((e) => {
            if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
              prevAppointments.push(e);
            }
          });
          //has new deal node in automation
          let isNewDeal = false;
          if (this.automation_type === 'deal') {
            isNewDeal = true;
          } else {
            const index = this.nodes.findIndex((item) => item.type === 'deal');
            if (index >= 0) {
              isNewDeal = true;
            }
          }

          //is insertable move deal
          let isMoveDeal = false;
          if (this.automation_type === 'deal') {
            isMoveDeal = true;
          } else {
            for (const nodeId of parents) {
              const dealIndex = this.nodes.findIndex(
                (item) => item.id === nodeId && item.type === 'deal'
              );
              if (dealIndex >= 0) {
                isMoveDeal = true;
              }
            }
          }

          // get node from link
          let node = null;
          const nodeIndex = this.nodes.findIndex((item) => item.id === source);
          if (nodeIndex >= 0) {
            node = this.nodes[nodeIndex];
          }

          if (node) {
            // CONDITION ACTION HANDLER
            let conditionHandler = '';
            if (node?.condition) {
              if (node?.type === 'contact_condition') {
                conditionHandler = 'trueCase';
              } else {
                conditionHandler = node.condition?.answer
                  ? 'trueCase'
                  : 'falseCase';
              }
            }

            const data = {
              currentAction: node.type,
              parentAction: node,
              conditionHandler,
              follows: prevFollowUps,
              appointments: prevAppointments,
              hasNewDeal: isNewDeal,
              moveDeal: isMoveDeal,
              automation: this.automation,
              automation_type: this.automation_type
            };

            // prevent show condition handler when has 2 branches
            const childNodes =
              this.edges.filter((item) => item.source == node.id) || [];
            if (childNodes.length >= 2) {
              delete data.conditionHandler;
              delete data.currentAction;
            }

            this.storeService.actionInputData.next(data);
            this.actionMethod = ACTION_METHOD.ADD_INSERT_ACTION;
          }
        }
      }
    }
  }

  runInsertBranch(res): void {
    const node = this.actionParam;
    if (node && res) {
      const edgeIndex = this.edges.findIndex((item) => item.source === node.id);
      if (edgeIndex >= 0) {
        const link = this.edges[edgeIndex];
        if (link) {
          const source = link.source;
          const target = link.target;
          //const lastIndex = this.identity;
          const lastIndex = uuidv4();
          const newId = 'a_' + lastIndex;

          const nodes = this.nodes;
          nodes.push({
            ...res,
            id: newId,
            index: lastIndex,
            label: this.ACTIONS[res.type],
            leaf: !this.isLeafAction(res)
          });
          const edges = sortEdges(this.edges);
          edges.push({ id: source + '_' + newId, source, target: newId });
          //this.identity++;
          this.identity = uuidv4();
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.saved = false;
        }
      }
    }
  }

  runAddAction(res): void {
    const node = this.actionParam;
    this.actionTimelines = res.actionTimelines || [];
    this.updateTimelineOption = res.updateTimeline
      ? res.updateTimeline
      : 'update';
    if (node) {
      this.type = this.getActionType(res.type);
      this.automation_type = this.type;
      if (res) {
        const parents = this.getParents(node.id);
        const parentTypes = this.getParentTypes(parents);

        let hasDeal = false;
        if (this.automation_type === 'deal') {
          hasDeal = true;
        } else {
          if (parentTypes.length > 0) {
            const index = parentTypes.indexOf('deal');
            if (index >= 0) {
              hasDeal = true;
            }
          }
        }

        const currentId = node.id;
        //const lastIndex = this.identity;
        const lastIndex = uuidv4();
        let newId = 'a_' + lastIndex;

        if (res.category === ACTION_CAT.NORMAL) {
          if (res.type === 'contact_condition') {
            this.addContactConditionAction(res);
          } else {
            node.leaf = false;
            const nodes = this.nodes;
            const data = {
              ...res,
              id: newId,
              index: lastIndex,
              label: this.ACTIONS[res.type],
              leaf: !this.isLeafAction(res)
            };
            if (hasDeal) {
              data['parent_type'] = 'deal';
            }
            nodes.push(data);

            this.actionParam = data;

            const edges = sortEdges(this.edges);
            edges.push({
              id: currentId + '_' + newId,
              source: currentId,
              target: newId,
              data: {}
            });
            // this.identity += 1;
            this.identity = uuidv4();
            this.nodes = [...nodes];
            this.edges = [...edges];
            this.lastUpdatedAction = this.nodes[this.nodes.length - 1];
          }
        } else {
          node.leaf = false;
          const nodes = this.nodes;
          let data = {
            ...res,
            id: newId,
            index: lastIndex,
            label: 'YES',
            leaf: true,
            condition: res.multipleReview
              ? {
                  case: res.type,
                  answer: true,
                  condition_type: 1
                }
              : {
                  case: res.type,
                  answer: true,
                  primary: res.primary,
                  percent: res.percent
                }
          };
          if (hasDeal) {
            data['parent_type'] = 'deal';
          }
          nodes.push(data);
          this.actionParam = data;

          const edges = sortEdges(this.edges);
          edges.push({
            id: currentId + '_' + newId,
            source: currentId,
            target: newId,
            category: 'case',
            answer: 'yes',
            data: {}
          });
          const nIndex = uuidv4();
          newId = 'a_' + nIndex;
          data = {
            ...res,
            id: newId,
            index: nIndex,
            label: 'NO',
            leaf: true,
            condition: res.multipleReview
              ? {
                  case: res.type,
                  answer: false,
                  condition_type: 1
                }
              : {
                  case: res.type,
                  answer: false,
                  primary: res.primary,
                  percent: res.percent
                }
          };
          if (hasDeal) {
            data['parent_type'] = 'deal';
          }
          nodes.push(data);
          edges.push({
            id: currentId + '_' + newId,
            source: currentId,
            target: newId,
            category: 'case',
            type: res.type,
            hasLabel: true,
            answer: 'no',
            data: {
              category: 'case',
              type: res.type,
              percent: res.percent,
              hasLabel: true,
              answer: 'no'
            }
          });
          //this.identity += 2;
          this.identity = uuidv4();
          this.nodes = [...nodes];
          this.edges = [...edges];
          this.lastUpdatedAction = node;
        }
        this.saved = false;
        // setTimeout(() => {
        //   const targetNode = this.graphWrapper.nodes.find(
        //     (n) => n.id === node.id
        //   );
        //   const positionX = targetNode.position.x;
        //   const positionY = targetNode.position.y;
        //   this.graphWrapper.panTo(positionX, positionY + 270);
        // }, 100);
      }
    } else {
      if (res) {
        const data = {
          ...res,
          id: 'a_' + this.identity,
          index: this.identity,
          label: this.ACTIONS[res.type],
          leaf: !this.isLeafAction(res)
        };

        this.actionParam = data;

        this.nodes.push(data);
        this.saved = false;
        this.lastUpdatedAction = this.nodes[this.nodes.length - 1];
      }
    }

    // set active added node for next insert
    if (this.actionParam) {
      this.lastUpdatedAction = this.actionParam;

      let conditionHandler = '';
      if (node?.condition) {
        if (node?.type === 'contact_condition') {
          conditionHandler = 'trueCase';
        } else {
          conditionHandler = node.condition?.answer ? 'trueCase' : 'falseCase';
        }
      }

      const parents = this.getParents(this.actionParam.id);
      const parentTypes = this.getParentTypes(parents);

      let hasDeal = false;
      if (this.automation_type === 'deal') {
        hasDeal = true;
      } else {
        if (parentTypes.length > 0) {
          const index = parentTypes.indexOf('deal');
          if (index >= 0) {
            hasDeal = true;
          }
        }
      }

      //is insertable move deal
      let isMoveDeal = false;
      if (this.automation_type === 'deal') {
        isMoveDeal = true;
      } else {
        for (const nodeId of parents) {
          const dealIndex = this.nodes.findIndex(
            (item) => item.id === nodeId && item.type === 'deal'
          );
          if (dealIndex >= 0) {
            isMoveDeal = true;
          }
        }
      }

      const prevFollowUps = [];
      this.nodes.forEach((e) => {
        if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
          prevFollowUps.push(e);
        }
      });

      const prevAppointments = [];
      this.nodes.forEach((e) => {
        if (e.type === 'appointment' && parents.indexOf(e.id) !== -1) {
          prevAppointments.push(e);
        }
      });
      const option = {
        type: 'end'
      };
      this.addActionTimelines(this.actionParam, option);

      const data = {
        currentAction: this.actionParam.type,
        parentAction: this.actionParam,
        conditionHandler,
        follows: prevFollowUps,
        appointments: prevAppointments,
        hasNewDeal: hasDeal,
        moveDeal: isMoveDeal,
        automation: this.automation,
        automation_type: this.automation_type
      };

      this.storeService.actionInputData.next(data);
      this.actionMethod = ACTION_METHOD.ADD_ACTION;

      this.lastUpdatedLink = null;
    }
  }

  addTrigger(res): void {
    this.automationTrigger = res;
  }

  editNode(link): void {
    const index = this.nodes.findIndex((item) => item.id === link.source);
    const selectedNode = this.nodes[index];
    if (index >= 0) {
      if (link.type == 'task_check') {
        this.confirmNodeCaseBranchOption(selectedNode);
      } else if (selectedNode.videos.length === 1) {
        this.confirmNodeCasePercent(selectedNode);
      } else if (selectedNode.videos.length > 1) {
        this.confirmNodeCaseMaterial(selectedNode);
      }
    }
  }

  runEditAction(res): void {
    const node = this.actionParam;
    if (node && res) {
      this.updateTimelineOption = res.updateTimeline;
      for (const key in res) {
        node[key] = res[key];
      }
      this.lastUpdatedAction = node;
      this.lastUpdatedLink = null;
      this.saved = false;
      if (
        this.prevNode.type === 'send_text_video' ||
        this.prevNode.type === 'send_text_image' ||
        this.prevNode.type === 'send_text_pdf' ||
        this.prevNode.type === 'send_text_material'
      ) {
        if (node.type === 'text') {
          // this.removeBranchByEdit(node);
          this.confirmKeepBranch(node);
        } else if (node.type === 'send_text_video') {
          this.confirmNodeCasePercent(node);
        } else if (node.type === 'send_text_material') {
          this.confirmNodeCaseMaterial(node);
        } else {
          this.setWatchedMaterialCondition(node);
        }
      } else if (
        this.prevNode.type === 'send_email_video' ||
        this.prevNode.type === 'send_email_image' ||
        this.prevNode.type === 'send_email_pdf' ||
        this.prevNode.type === 'send_email_material'
      ) {
        if (node.type === 'email') {
          this.confirmKeepBranch(node);
        } else if (node.type === 'send_email_video') {
          this.confirmNodeCasePercent(node);
        } else if (node.type === 'send_email_material') {
          this.confirmNodeCaseMaterial(node);
        } else {
          this.setWatchedMaterialCondition(node);
        }
      } else if (this.prevNode.type === 'email') {
        if (node.type === 'email') {
          this.updateActionTimelines(node);
        } else if (node.type === 'send_email_video') {
          this.confirmNodeCasePercent(node);
        } else if (node.type === 'send_email_material') {
          this.confirmNodeCaseMaterial(node);
        } else {
          this.setWatchedMaterialCondition(node);
        }
      } else if (this.prevNode.type === 'contact_condition') {
        this.confirmContactCondition(node);
      } else if (this.prevNode.type === 'task_check') {
        this.confirmNodeCaseBranchOption(node);
      } else {
        const index = this.nodes.findIndex((item) => item.id === node.id);
        if (index >= 0) {
          this.nodes.splice(index, 1, node);
        }
        this.updateActionTimelines(node);
      }
    }
  }

  updateActionTimelines(node, option = {}): void {
    const action = this.formatAction(node);
    const timeline_ids = this.actionTimelines
      ?.filter((e) => e.status === 'pending')
      .map((item) => item._id);

    const data = {
      timeline_ids,
      action,
      option
    };

    if (this.editMode !== 'new' && this.isEditable()) {
      this.storeData().then((res) => {
        this.toastr.success('Updating is saved!');
        if (!this.actionTimelines.length) return;
        this.nodes = [];
        this.edges = [];
        this.loadAutomation(this.automation_id, this.pageSize.id, 0);
        this.composeGraph(this.actions);
        this.automationService
          .updateActionTimelines(data)
          .subscribe((status) => {
            if (status) {
              this.toastr.success('Update timelines successfully.');
            }
          });
      });
    } else {
      if (!this.actionTimelines.length) return;
      this.automationService.updateActionTimelines(data).subscribe((status) => {
        if (status) {
          this.toastr.success('Update timelines successfully.');
        }
      });
    }
  }

  addActionTimelines(node, option = {}): void {
    const action = this.formatAction(node);
    let timeline_ids;
    if (option['type'] === 'end')
      timeline_ids = this.actionTimelines.map((item) => item._id);
    else
      timeline_ids = this.actionTimelines
        ?.filter((e) => e.status === 'pending')
        .map((item) => item._id);
    const data = {
      timeline_ids,
      action,
      option
    };
    if (this.editMode !== 'new' && this.isEditable()) {
      this.storeData().then((res) => {
        this.toastr.success('Updating is saved!');
        if (this.actionTimelines.length > 0) {
          this.automationService
            .addActionTimelines(data)
            .subscribe((status) => {
              if (status) {
                this.toastr.success('Add timelines successfully.');
              }
            });
        }
      });
    } else {
      if (!this.actionTimelines.length) return;
      this.automationService.addActionTimelines(data).subscribe((status) => {
        if (status) {
          this.toastr.success('Add timelines successfully.');
        }
      });
    }
  }

  removeActionTimelines(nodes, option = {}): void {
    let timeline_ids;
    if (
      option['type'] === 'branch_condition' ||
      (option['type'] === 'end' && option['isRemoveCase'])
    )
      timeline_ids = this.actionTimelines.map((item) => item._id);
    else
      timeline_ids = this.actionTimelines
        ?.filter((e) => e.status === 'pending')
        .map((item) => item._id);

    const refs = [];
    for (const node of nodes) {
      refs.push(node.id ? node.id : node);
    }
    const data = {
      timeline_ids,
      refs,
      option
    };

    if (this.editMode !== 'new' && this.isEditable()) {
      this.storeData().then((res) => {
        this.toastr.success('Updating is saved!');
        if (!this.actionTimelines.length) return;
        this.automationService
          .removeActionTimelines(data)
          .subscribe((status) => {
            if (status) {
              this.toastr.success('Remove timelines successfully.');
            }
          });
      });
    } else {
      if (!this.actionTimelines?.length) return;
      this.automationService.removeActionTimelines(data).subscribe((status) => {
        if (status) {
          this.toastr.success('Remove timelines successfully.');
        }
      });
    }
  }

  async runRemoveAction(res): Promise<void> {
    const node = this.actionParam;
    if (node && res) {
      this.updateTimelineOption = res.updateTimeline;
    }
    if (this.automation_id) {
      const data = {
        automation: this.automation_id,
        ref: node.id
      };
      this.actionTimelines = await this.automationService
        .getActionTimelines(data)
        .toPromise();
    }
    // Decide the node type => root | leaf | middle | middle with case | case
    if (
      node.leaf ||
      node.type === 'automation' ||
      node.type === 'move_contact'
    ) {
      this.removeLeaf(node);
    } else {
      let newSource;
      let newTarget;
      let newTargetNode;
      let newTargetEdge;
      const edges = sortEdges(this.edges);
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (e.target === node.id) {
          newSource = e.source;
        }
        if (e.source === node.id) {
          newTarget = e.target;
          newTargetEdge = e;
        }
        if (newSource && newTarget) {
          break;
        }
      }
      this.nodes.some((e) => {
        if (e.id === newTarget) {
          newTargetNode = e;
          return true;
        }
      });
      if (newTargetNode && newTargetNode.condition) {
        if (node.type == 'contact_condition')
          this.removeContactCaseNode(node, newSource);
        else this.removeCase(newTargetEdge, true);
      } else {
        if (newSource && newTarget) {
          this.removeMiddleNode(node, newSource, newTarget);
        } else {
          this.removeRoot(node);
        }
      }
      this.lastUpdatedAction = null;
    }
  }

  formatAction(updatedAction): any {
    const parentsObj = {}; // Parent Ids of each node
    const caseActions = {}; // Case actions Object
    const nodesObj = {};
    const actions = [];

    const saveNodes = [...this.nodes];
    const saveEdges = [...this.edges];

    saveEdges.forEach((e) => {
      parentsObj[e.target] = e.source;
    });
    saveNodes.forEach((e) => {
      if (e.category === ACTION_CAT.CONDITION) {
        caseActions[e.id] = e;
      }
      nodesObj[e.id] = e;
    });

    let action;
    if (updatedAction.category !== ACTION_CAT.CONDITION) {
      const parentId = parentsObj[updatedAction.id] || '0';
      // Check if the parent action is case action
      if (caseActions[parentId]) {
        const caseAction = caseActions[parentId];
        const caseParentActionId = parentsObj[caseAction.id];
        const caseParentAction = nodesObj[caseParentActionId];
        if (caseParentAction) {
          let type = updatedAction.type;
          if (
            updatedAction.type === 'text' ||
            updatedAction.type === 'send_text_video' ||
            updatedAction.type === 'send_text_pdf' ||
            updatedAction.type === 'send_text_image' ||
            updatedAction.type === 'send_text_material'
          ) {
            if (updatedAction.type.indexOf('send_text') !== -1) {
              const { videoIds, imageIds, pdfIds } =
                this.getTypeMaterials(updatedAction);
            }

            type = 'text';
          }
          if (
            updatedAction.type === 'email' ||
            updatedAction.type === 'send_email_video' ||
            updatedAction.type === 'send_email_pdf' ||
            updatedAction.type === 'send_email_image' ||
            updatedAction.type === 'send_email_material'
          ) {
            type = 'email';
          }

          if (updatedAction.commands) {
            action = {
              parent: caseParentActionId,
              id: updatedAction.id,
              period: updatedAction.period,
              condition: caseAction.condition,
              action: {
                type,
                task_type: updatedAction.task_type,
                content: updatedAction.content,
                deal_name: updatedAction.deal_name,
                deal_stage: updatedAction.deal_stage,
                automation_id: updatedAction.automation_id,
                appointment: updatedAction.appointment,
                subject: updatedAction.subject,
                due_date: updatedAction.due_date,
                due_duration: updatedAction.due_duration,
                videos: updatedAction.videos || [],
                pdfs: updatedAction.pdfs || [],
                images: updatedAction.images || [],
                commands: updatedAction.commands,
                ref_id: updatedAction.ref_id,
                attachments: updatedAction.attachments,
                timezone: updatedAction.timezone,
                share_users: updatedAction.share_users,
                share_all_member: updatedAction.share_all_member,
                round_robin: updatedAction.round_robin,
                share_type: updatedAction.share_type,
                share_team: updatedAction.share_team,
                contact_conditions: updatedAction.contact_conditions,
                description: updatedAction.description
              }
            };
          } else {
            action = {
              parent: caseParentActionId,
              id: updatedAction.id,
              period: updatedAction.period,
              condition: caseAction.condition,
              action: {
                type,
                task_type: updatedAction.task_type,
                content: updatedAction.content,
                deal_name: updatedAction.deal_name,
                deal_stage: updatedAction.deal_stage,
                automation_id: updatedAction.automation_id,
                appointment: updatedAction.appointment,
                subject: updatedAction.subject,
                due_date: updatedAction.due_date,
                due_duration: updatedAction.due_duration,
                videos: updatedAction.videos || [],
                pdfs: updatedAction.pdfs || [],
                images: updatedAction.images || [],
                command: updatedAction.command,
                ref_id: updatedAction.ref_id,
                attachments: updatedAction.attachments,
                timezone: updatedAction.timezone,
                share_users: updatedAction.share_users,
                share_all_member: updatedAction.share_all_member,
                round_robin: updatedAction.round_robin,
                share_type: updatedAction.share_type,
                share_team: updatedAction.share_team,
                contact_conditions: updatedAction.contact_conditions,
                description: updatedAction.description
              }
            };
          }
          action['watched_materials'] = [];
          if (caseAction.condition.primary) {
            action['watched_materials'] = [caseAction.condition.primary];
          } else {
            if (
              caseParentAction['videos'] &&
              caseParentAction['videos'].length > 0
            ) {
              const watched_video = caseParentAction['videos'];
              action['watched_materials'] = [
                ...action['watched_materials'],
                ...watched_video
              ];
            }
            if (
              caseParentAction['pdfs'] &&
              caseParentAction['pdfs'].length > 0
            ) {
              const watched_pdf = caseParentAction['pdfs'];
              action['watched_materials'] = [
                ...action['watched_materials'],
                ...watched_pdf
              ];
            }
            if (
              caseParentAction['images'] &&
              caseParentAction['images'].length > 0
            ) {
              const watched_image = caseParentAction['images'];
              action['watched_materials'] = [
                ...action['watched_materials'],
                ...watched_image
              ];
            }
          }
        }
      } else {
        action = {
          parent: parentId,
          id: updatedAction.id,
          period: updatedAction.period,
          condition: updatedAction.condition
        };

        let type = updatedAction.type;
        if (
          updatedAction.type === 'text' ||
          updatedAction.type === 'send_text_video' ||
          updatedAction.type === 'send_text_pdf' ||
          updatedAction.type === 'send_text_image' ||
          updatedAction.type === 'send_text_material'
        ) {
          if (updatedAction.type.indexOf('send_text') !== -1) {
            const { videoIds, imageIds, pdfIds } =
              this.getTypeMaterials(updatedAction);
          }

          type = 'text';
        }
        if (
          updatedAction.type === 'email' ||
          updatedAction.type === 'send_email_video' ||
          updatedAction.type === 'send_email_pdf' ||
          updatedAction.type === 'send_email_image' ||
          updatedAction.type === 'send_email_material'
        ) {
          type = 'email';
        }
        if (updatedAction.commands) {
          action['action'] = {
            type,
            task_type: updatedAction.task_type,
            content: updatedAction.content,
            subject: updatedAction.subject,
            deal_name: updatedAction.deal_name,
            deal_stage: updatedAction.deal_stage,
            voicemail: updatedAction.voicemail,
            automation_id: updatedAction.automation_id,
            appointment: updatedAction.appointment,
            due_date: updatedAction.due_date,
            due_duration: updatedAction.due_duration,
            videos: updatedAction.videos || [],
            pdfs: updatedAction.pdfs || [],
            images: updatedAction.images || [],
            commands: updatedAction.commands,
            ref_id: updatedAction.ref_id,
            attachments: updatedAction.attachments,
            timezone: updatedAction.timezone,
            group: updatedAction.group,
            share_users: updatedAction.share_users,
            share_all_member: updatedAction.share_all_member,
            round_robin: updatedAction.round_robin,
            share_type: updatedAction.share_type,
            share_team: updatedAction.share_team,
            condition_field: updatedAction.condition_field,
            contact_conditions: updatedAction.contact_conditions,
            description: updatedAction.description
          };
        } else {
          action['action'] = {
            type,
            task_type: updatedAction.task_type,
            content: updatedAction.content,
            subject: updatedAction.subject,
            deal_name: updatedAction.deal_name,
            deal_stage: updatedAction.deal_stage,
            voicemail: updatedAction.voicemail,
            automation_id: updatedAction.automation_id,
            appointment: updatedAction.appointment,
            due_date: updatedAction.due_date,
            due_duration: updatedAction.due_duration,
            videos: updatedAction.videos || [],
            pdfs: updatedAction.pdfs || [],
            images: updatedAction.images || [],
            command: updatedAction.command,
            ref_id: updatedAction.ref_id,
            attachments: updatedAction.attachments,
            timezone: updatedAction.timezone,
            group: updatedAction.group,
            share_users: updatedAction.share_users,
            share_all_member: updatedAction.share_all_member,
            round_robin: updatedAction.round_robin,
            share_type: updatedAction.share_type,
            share_team: updatedAction.share_team,
            condition_field: updatedAction.condition_field,
            contact_conditions: updatedAction.contact_conditions,
            description: updatedAction.description
          };
        }
      }
    }
    return action;
  }

  fullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    window.dispatchEvent(new Event('resize'));
  }

  isShowTimeDelay(node): boolean {
    if (node.period > 0) {
      return true;
    } else if (this.NoLimitActions.indexOf(node.type) === -1) {
      return true;
    }
    return false;
  }

  isShowComplete(): boolean {
    if (this.editMode !== 'edit' && this.automation_id == undefined) {
      return true;
    }
    if (!this.loadingAutomation) {
      if (this.automation) {
        return true;
      }
    }
    return false;
  }
  _downloadFolder(automation: any): void {
    this.automationService
      .downloadFolder({ folders: [automation._id] })
      .subscribe((res) => {
        if (res) {
          this.automationService.loadOwn(true);
          if (!this.user.onboard.automation_download) {
            this.user.onboard.automation_download = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
          }
        }
      });
  }

  _downloadAutomation(automation: any): void {
    const element = JSON.parse(JSON.stringify(automation));

    const data = {
      automations: [{ _id: element._id, type: element.type }]
    };

    this.isSaving = true;

    this.automationService.checkDownload(data).subscribe((res) => {
      const downloadRequest: DownloadRequest = {
        ...data,
        team: this.team_id || ''
      };
      if (res?.status) {
        const count =
          (res.data?.titles || []).length +
          (res.data?.videos || []).length +
          (res.data?.pdfs || []).length +
          (res.data?.images || []).length +
          (res.data?.dealStages || []).length;
        if (count == 0) {
          this.automationService
            .downloadFromTeam(downloadRequest)
            .subscribe((_res) => {
              this.isSaving = false;
              this.automationService.loadOwn(true);
              if (_res) {
                if (!this.user.onboard.automation_download) {
                  this.user.onboard.automation_download = true;
                  this.userService
                    .updateProfile({ onboard: this.user.onboard })
                    .subscribe(() => {
                      this.userService.updateProfileImpl({
                        onboard: this.user.onboard
                      });
                    });
                }
              }
            });
        } else {
          const ConfirmDialog = this.dialog.open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            position: { top: '100px' },
            data: {
              title: 'Download Automations',
              message: 'Are you sure to download these ones?',
              titles: res['data'].titles || [],
              videos: res['data'].videos || [],
              images: res['data'].images || [],
              relatedItemsCount: count,
              pdfs: res['data'].pdfs || [],
              dealStages: res['data'].dealStages || [],
              confirmLabel: 'Download',
              cancelLabel: 'Cancel'
            }
          });
          ConfirmDialog.afterClosed().subscribe((status) => {
            if (status) {
              if (status.match_detail) {
                downloadRequest.stages = status.match_detail;
              }
              this.automationService
                .downloadFromTeam(downloadRequest)
                .subscribe((_res) => {
                  this.isSaving = false;
                  this.automationService.loadOwn(true);
                  this.toastr.success('The automation download successful.');
                  if (_res) {
                    if (!this.user.onboard.automation_download) {
                      this.user.onboard.automation_download = true;
                      this.userService
                        .updateProfile({ onboard: this.user.onboard })
                        .subscribe(() => {
                          this.userService.updateProfileImpl({
                            onboard: this.user.onboard
                          });
                        });
                    }
                  }
                });
            } else {
              this.isSaving = false;
              this.automationService.loadOwn(true);
              this.toastr.error('The Automation download failed.');
            }
          });
        }
      } else {
        this.isSaving = false;
        this.automationService.loadOwn(true);
      }
    });
  }

  download(automation: any): void {
    let isExist = false;
    let ConfirmDialog;
    automation.original_id = automation._id;
    for (const automationItem of this.automations) {
      if (automationItem.original_id === automation._id) {
        isExist = true;
      }
    }
    if (automation.isFolder) {
      if (isExist) {
        ConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Folder',
            message: 'Are you sure to download this folder again?',
            confirmLabel: 'Download',
            cancelLabel: 'Cancel'
          }
        });
        ConfirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this._downloadFolder(automation);
          }
        });
      } else {
        this._downloadFolder(automation);
      }
    } else {
      if (isExist) {
        ConfirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Download Automation',
            message: 'Are you sure to download this automation again?',
            confirmLabel: 'Download',
            cancelLabel: 'Cancel'
          }
        });
        ConfirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this._downloadAutomation(automation);
          }
        });
      } else {
        this._downloadAutomation(automation);
      }
    }
  }

  setPercentToEdge(branch, percent): void {
    const index = this.edges.findIndex(
      (item) =>
        item.id.indexOf(branch.id) >= 0 &&
        item.data?.category &&
        item.data.category === 'case' &&
        item.data.answer === 'no'
    );
    if (index >= 0) {
      this.edges[index].data.percent = percent;
      this.edges = [...this.edges];
    }
  }

  setConditionTypeToWatched(branch): void {
    const index = this.edges.findIndex(
      (item) =>
        item.id.indexOf(branch.id) >= 0 &&
        item.data?.category &&
        item.data.category === 'case' &&
        item.data.answer === 'no'
    );
    if (index >= 0) {
      this.edges[index].data.type = 'watched_material';
      this.edges = [...this.edges];
    }
  }

  setConditionTypeToTaskCheck(branch): void {
    const index = this.edges.findIndex(
      (item) =>
        item.id.indexOf(branch.id) >= 0 &&
        item.data?.category &&
        item.data.category === 'case' &&
        item.data.answer === 'no'
    );
    if (index >= 0) {
      this.edges[index].data.type = 'task_check';
      this.edges = [...this.edges];
    }
  }

  confirmNodeCaseBranchOption(node): void {
    const branchNodes = this.getConditionsById(node.id);
    if (branchNodes.length > 0) {
      for (const branchNode of branchNodes) {
        if (branchNode && branchNode.condition) {
          branchNode.condition['case'] = 'task_check';
          this.setConditionTypeToTaskCheck(branchNode);
        }
      }
    }
    this.updateActionTimelines(node);
  }

  confirmNodeCasePercent(node): void {
    const branchNodes = this.getConditionsById(node.id);
    if (branchNodes.length > 0) {
      const dialog = this.dialog.open(CaseConfirmPercentComponent, {
        width: '90vw',
        maxWidth: '500px',
        data: { percent: branchNodes[0].condition?.percent }
      });
      dialog.afterClosed().subscribe((result) => {
        for (const branchNode of branchNodes) {
          if (branchNode && branchNode.condition) {
            branchNode.condition['case'] = 'watched_material';
            this.setConditionTypeToWatched(branchNode);
            if (
              result['status'] === true ||
              (result['status'] === false && !result['setPercent'])
            ) {
              branchNode.condition.percent = result.percent;
              this.setPercentToEdge(branchNode, result.percent);
            }
          }
        }
        const materials = [...node.videos, ...node.pdfs, ...node.images];
        const option = {
          type: 'send_email_material_condition',
          case: branchNodes[0].condition?.case,
          percent: branchNodes[0].condition?.percent,
          primary: branchNodes[0].condition?.primary,
          watched_materials: branchNodes[0].condition?.primary
            ? branchNodes[0].condition?.primary
            : materials
        };
        this.updateActionTimelines(node, option);
      });
    } else {
      this.updateActionTimelines(node);
    }
  }

  confirmNodeCaseMaterial(node): void {
    const branchNodes = this.getConditionsById(node.id);
    const materials = this.getMaterials(node);
    let review = 1;
    if (branchNodes.length && branchNodes[0].review !== undefined) {
      review = branchNodes[0].review;
    }
    const caseMaterialDialog = this.dialog.open(CaseMaterialConfirmComponent, {
      width: '90vw',
      maxWidth: '500px',
      disableClose: true,
      data: { materials, review }
    });
    caseMaterialDialog.afterClosed().subscribe((result) => {
      if (result) {
        for (const branchNode of branchNodes) {
          if (branchNode && branchNode.condition) {
            branchNode.condition['case'] = 'watched_material';
            branchNode['review'] = result.review;
            this.setConditionTypeToWatched(branchNode);
            branchNode.condition.percent = undefined;
            this.setPercentToEdge(branchNode, undefined);
          }
        }
        if (result.review === 0) {
        } else if (result.review === 1) {
          for (const branchNode of branchNodes) {
            if (
              branchNode &&
              branchNode.condition &&
              branchNode.condition.answer
            ) {
              branchNode.condition['condition_type'] = 1;
            }
          }
        } else if (result.review === 2) {
          for (const branchNode of branchNodes) {
            if (branchNode && branchNode.condition) {
              branchNode.condition['primary'] = result.primary;
            }
          }
        }

        let selectedMaterial = null;
        const videos = materials.filter(
          (item) => item.material_type === 'video'
        ).length;
        if (result.review === 2 && result.primary) {
          const index = this.materials.findIndex(
            (item) => item._id === result.primary
          );
          if (index >= 0) {
            selectedMaterial = this.materials[index];
          }
        }

        if (
          (result.review !== 2 && videos === 1) ||
          (result.review === 2 && selectedMaterial?.material_type === 'video')
        ) {
          this.confirmNodeCasePercent(node);
        } else {
          const watched_materials = [
            ...node.videos,
            ...node.pdfs,
            ...node.images
          ];
          const option = { type: '', watched_materials: [] };
          if (node.type === 'send_email_material') {
            option.type = 'send_email_material';
            option.watched_materials = watched_materials;
          }
          this.updateActionTimelines(node, option);
        }
      } else {
        this.setWatchedMaterialCondition(node);
      }
    });
  }

  confirmKeepBranch(node): void {
    const branchNodes = this.getConditionsById(node.id);
    if (branchNodes.length > 0) {
      const confirmKeepDialog = this.dialog.open(CaseConfirmKeepComponent, {
        width: '90vw',
        maxWidth: '500px',
        disableClose: true,
        data: { type: node.type }
      });
      confirmKeepDialog.afterClosed().subscribe(async (result) => {
        const option = {};
        if (result) {
          if (result.option === 'switch') {
            this.setOpenedEmailCondition(node);
            option['type'] = 'switch_to_opened_email';
          } else if (result.option === 'remove') {
            this.removeBranchByEdit(node);
          } else {
            let branch = null;
            for (const edge of this.edges) {
              if (edge.source === node.id) {
                branch = edge;
                break;
              }
            }
            if (branch && branch.category === 'case') {
              const newSource = branch.source;
              let yesCase; // "Yes" node id
              let noCase; // "No" node id
              let yesNextNode; // Node behind "Yes"
              let noNextNode; // Node behind "No"
              const edges = sortEdges(this.edges);
              const nodes = this.nodes;
              const deleteNodes = [];
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (e.source === newSource && e.answer === 'yes') {
                  yesCase = e.target;
                }
                if (e.source === newSource && e.answer === 'no') {
                  noCase = e.target;
                }
                if (yesCase && noCase) {
                  break;
                }
              }
              for (let i = edges.length - 1; i >= 0; i--) {
                const e = edges[i];
                if (e.source === yesCase) {
                  yesNextNode = e.target;
                }
                if (e.source === noCase) {
                  noNextNode = e.target;
                }
                if (yesNextNode && noNextNode) {
                  break;
                }
              }
              if (result.option === 'trueCase') {
                deleteNodes.push(noCase);
                edges.forEach((e) => {
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    deleteNodes.push(e.target);
                  }
                });
                deleteNodes.push(yesCase);
                for (let i = edges.length - 1; i >= 0; i--) {
                  const e = edges[i];
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    edges.splice(i, 1);
                  } else if (deleteNodes.indexOf(e.target) !== -1) {
                    edges.splice(i, 1);
                  }
                }
                for (let i = nodes.length - 1; i >= 0; i--) {
                  const e = nodes[i];
                  if (deleteNodes.indexOf(e.id) !== -1) {
                    nodes.splice(i, 1);
                  }
                }
                if (yesNextNode) {
                  edges.push({
                    id: node.id + '_' + yesNextNode,
                    source: node.id,
                    target: yesNextNode
                  });
                } else {
                  node.leaf = true;
                }
              } else if (result.option === 'falseCase') {
                deleteNodes.push(yesCase);
                edges.forEach((e) => {
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    deleteNodes.push(e.target);
                  }
                });
                deleteNodes.push(noCase);
                // deleteNodes.splice(0, 1);
                for (let i = edges.length - 1; i >= 0; i--) {
                  const e = edges[i];
                  if (deleteNodes.indexOf(e.source) !== -1) {
                    edges.splice(i, 1);
                  } else if (deleteNodes.indexOf(e.target) !== -1) {
                    edges.splice(i, 1);
                  }
                }
                for (let i = nodes.length - 1; i >= 0; i--) {
                  const e = nodes[i];
                  if (deleteNodes.indexOf(e.id) !== -1) {
                    nodes.splice(i, 1);
                  }
                }
                if (noNextNode) {
                  edges.push({
                    id: node.id + '_' + noNextNode,
                    source: node.id,
                    target: noNextNode
                  });
                } else {
                  node.leaf = true;
                }
              }
              this.nodes = [...nodes];
              this.edges = [...edges];

              if (this.automation_id) {
                const data = {
                  automation: this.automation_id,
                  ref: node.id
                };
                this.actionTimelines = await this.automationService
                  .getActionTimelines(data)
                  .toPromise();
              }

              this.removeActionTimelines(deleteNodes, {
                type: 'branch_condition',
                answer: result.option == 'trueCase' ? true : false
              });
            }
          }
        }
        this.updateActionTimelines(node, option);
      });
    } else {
      this.updateActionTimelines(node);
    }
  }

  isLeafAction(action): boolean {
    if (action.type === 'automation') {
      return true;
    } else if (
      action.type === 'move_contact' &&
      action['share_type'] === this.moveOptions[0].id
    ) {
      return true;
    }
    return false;
  }

  showEditTitle(): void {
    this.dialog
      .open(AutomationHeaderUpdateComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          automation_title: this.automation_title,
          automation_description: this.automation_description
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.automation_title = res.automation_title;
          this.automation_description = res.automation_description;
          if (this.editMode !== 'new' && this.isEditable()) {
            this.storeData().then((res) => {
              this.toastr.success('Updating is saved!');
            });
          }
        }
      });
  }

  isEditable(): boolean {
    if (this.editMode === 'new') {
      return true;
    } else {
      if (this.owner_id === this.user_id) {
        return true;
      }
    }
    return false;
  }

  addContactConditionAction(res): void {
    const node = this.actionParam;
    const currentId = node.id;
    //let lastIndex = this.identity;
    let lastIndex = uuidv4();
    let newId = 'a_' + lastIndex;
    const conditionActionId = newId;
    node.leaf = false;
    const nodes = this.nodes;

    // make condition action.
    const data = {
      ...res,
      id: conditionActionId,
      index: lastIndex,
      label: this.ACTIONS[res.type],
      leaf: false
    };
    nodes.push(data);

    this.actionParam = data;

    const edges = sortEdges(this.edges);
    edges.push({
      id: currentId + '_' + conditionActionId,
      source: currentId,
      target: conditionActionId,
      data: {}
    });
    this.identity = uuidv4();
    lastIndex = this.identity;
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.lastUpdatedAction = this.nodes[this.nodes.length - 1];

    //make condition branches.
    const contactConditions = res['contact_conditions'];
    for (const condition of contactConditions) {
      newId = 'a_' + uuidv4();
      const data = {
        ...res,
        id: newId,
        index: lastIndex,
        category: ACTION_CAT.CONDITION,
        label: condition,
        leaf: true,
        condition: { case: condition }
      };
      nodes.push(data);
      edges.push({
        id: conditionActionId + '_' + newId,
        source: conditionActionId,
        target: newId,
        category: 'case',
        answer: condition,
        data: {}
      });
      this.identity = uuidv4();
      lastIndex = this.identity;
    }

    //make else contact condition action
    newId = 'a_' + uuidv4();
    const elseData = {
      ...res,
      id: newId,
      index: lastIndex,
      category: ACTION_CAT.CONDITION,
      label: 'else',
      leaf: true,
      condition: { case: 'else' }
    };
    nodes.push(elseData);
    edges.push({
      id: conditionActionId + '_' + newId,
      source: conditionActionId,
      target: newId,
      category: 'case',
      answer: 'else',
      data: {}
    });
    this.identity = uuidv4();
    lastIndex = this.identity;

    this.nodes = [...nodes];
    this.edges = [...edges];
  }

  insertContactConditionAction(res, answer): void {
    const link = this.actionParam;
    const nodes = this.nodes;
    const edges = sortEdges(this.edges);
    if (link) {
      const source = link.source;
      const target = link.target;
      let targetIndex = this.nodes.findIndex((item) => item.id === target);
      //let lastIndex = this.identity;
      let lastIndex = uuidv4();
      let newId = 'a_' + lastIndex;
      const conditionActionId = newId;
      let answerNodeId;

      // make condition action.
      const data = {
        ...res,
        id: conditionActionId,
        index: lastIndex,
        label: this.ACTIONS[res.type],
        leaf: false
      };
      nodes.splice(targetIndex, 0, data);
      targetIndex++;
      edges.some((e, index) => {
        if (e.id === link.id) {
          edges.splice(index, 1);
          return true;
        }
      });
      edges.push({
        id: source + '_' + newId,
        source,
        target: conditionActionId
      });
      this.identity = uuidv4();
      lastIndex = this.identity;
      this.nodes = [...nodes];
      this.edges = [...edges];
      this.lastUpdatedAction = this.nodes[this.nodes.length - 1];

      //make condition branches.
      const contactConditions = res['contact_conditions'];
      for (const condition of contactConditions) {
        newId = 'a_' + uuidv4();
        if (answer == condition) {
          answerNodeId = newId;
        }
        const data = {
          ...res,
          id: newId,
          index: lastIndex,
          category: ACTION_CAT.CONDITION,
          label: condition,
          leaf: answer == condition ? false : true,
          condition: { case: condition }
        };
        nodes.splice(targetIndex, 0, data);
        targetIndex++;

        edges.push({
          id: conditionActionId + '_' + newId,
          source: conditionActionId,
          target: newId,
          category: 'case',
          answer: condition,
          data: {}
        });
        this.identity = uuidv4();
        lastIndex = this.identity;
      }

      //make else contact condition action
      newId = 'a_' + uuidv4();
      if (answer === 'else') {
        answerNodeId = newId;
      }
      const elseData = {
        ...res,
        id: newId,
        index: lastIndex,
        category: ACTION_CAT.CONDITION,
        label: 'else',
        leaf: answer === 'else' ? false : true,
        condition: { case: 'else' }
      };
      nodes.splice(targetIndex, 0, elseData);
      edges.push({
        id: conditionActionId + '_' + newId,
        source: conditionActionId,
        target: newId,
        category: 'case',
        answer: 'else',
        data: {}
      });
      this.identity = uuidv4();
      lastIndex = this.identity;

      this.nodes = [...nodes];
      this.edges = [...edges];

      // change next node's parent
      const nextNodeIndex = this.nodes.findIndex((item) => item.id === target);
      if (nextNodeIndex >= 0 && answerNodeId) {
        const childNode = { ...this.nodes[nextNodeIndex] };
        childNode.parent = conditionActionId;
        childNode.condition = {
          case: answer
        };

        this.nodes[nextNodeIndex].parent = answerNodeId;
        const addedEdge = {
          id: answerNodeId + '_' + this.nodes[nextNodeIndex].id,
          source: answerNodeId,
          target: this.nodes[nextNodeIndex].id
        };
        edges.push(addedEdge);

        this.actionParam = addedEdge;
        this.edges = [...edges];
        const option = {
          type: 'contact_condition',
          case: answer
        };
        this.addActionTimelines(data, option);
      }
    }
  }

  getContactCondition(node): any {
    let index = CONTACT_PROPERTIES.findIndex(
      (item) => item.id === node['condition_field']
    );
    if (index >= 0) {
      return CONTACT_PROPERTIES[index].value;
    }
    index = this.lead_fields.findIndex(
      (item) => item.name === node['condition_field']
    );
    if (index >= 0) {
      return node['condition_field'];
    }
    return '';
  }

  getContactConditionLabel(node): any {
    if (node['condition_field'] === 'automation') {
      const index = this.automations.findIndex(
        (item) => item._id === node.label
      );
      if (index >= 0) {
        return this.automations[index].title;
      } else {
        return '';
      }
    } else if (node['condition_field'] === 'country') {
      const index = this.COUNTRIES.findIndex(
        (item) => item.code === node.label
      );
      if (index >= 0) {
        return this.COUNTRIES[index].name;
      } else {
        return '';
      }
    } else if (node['condition_field'] === 'label') {
      const label = this.labels.find((e) => e._id === node.label);
      if (label) return label.name;
      else return '';
    } else if (validateDateTime(node.label)) {
      return moment(node.label).format('MM/DD/YYYY');
    } else {
      return node.label;
    }
  }

  getFormattedCondition(node, condition): any {
    if (node['condition_field'] === 'automation') {
      const index = this.automations.findIndex(
        (item) => item._id === condition
      );
      if (index >= 0) {
        return this.automations[index].title;
      }
    } else if (node['condition_field'] === 'country') {
      const index = this.COUNTRIES.findIndex((item) => item.code === condition);
      if (index >= 0) {
        return this.COUNTRIES[index].name;
      } else {
        return '';
      }
    } else if (node['condition_field'] === 'label') {
      const label = this.labels.find((e) => e._id === condition);
      if (label) return label.name;
      else return '';
    } else {
      return condition;
    }
  }

  isSidebarOpened(): boolean {
    if (
      (this.addDrawer && this.addDrawer.opened) ||
      (this.editDrawer && this.editDrawer.opened) ||
      (this.removeDrawer && this.removeDrawer.opened) ||
      (this.triggerDrawer && this.triggerDrawer.opened)
    ) {
      return true;
    }
    return false;
  }

  changeActive(): void {
    this.is_active = !this.is_active;
    if (this.editMode !== 'new' && this.isEditable()) {
      this.storeData().then((res) => {
        this.toastr.success('Updating is saved!');
      });
    }
  }

  getActionType = (type: string) => {
    switch (type) {
      case 'move_contact':
      case 'contact_condition':
      case 'share_contact':
      case 'deal':
        return 'contact';
      case 'move_deal':
        return 'deal';
      default:
        return undefined;
    }
  };

  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    audio: AUTOMATION_ICONS.SEND_AUDIO,
    email: AUTOMATION_ICONS.SEND_EMAIL,
    send_email_video: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_video: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
    send_email_pdf: AUTOMATION_ICONS.SEND_PDF_EMAIL,
    send_text_pdf: AUTOMATION_ICONS.SEND_PDF_TEXT,
    send_email_image: AUTOMATION_ICONS.SEND_IMAGE_EMAIL,
    send_text_image: AUTOMATION_ICONS.SEND_IMAGE_TEXT,
    update_contact: AUTOMATION_ICONS.UPDATE_CONTACT,
    deal: AUTOMATION_ICONS.NEW_DEAL,
    send_email_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    move_deal: AUTOMATION_ICONS.MOVE_DEAL,
    automation: AUTOMATION_ICONS.AUTOMATION,
    appointment: AUTOMATION_ICONS.APPOINTMENT,
    update_appointment: AUTOMATION_ICONS.APPOINTMENT,
    contact_condition: AUTOMATION_ICONS.CONTACT_CONDITION,
    move_contact: AUTOMATION_ICONS.MOVE_CONTACT,
    share_contact: AUTOMATION_ICONS.SHARE_CONTACT
  };

  ACTIONS = {
    follow_up: 'New Task',
    update_follow_up: 'Edit Task',
    note: 'New Note',
    email: 'New Email',
    text: 'New Text',
    send_email_video: 'New Video Email',
    send_text_video: 'New Video Text',
    send_email_pdf: 'New PDF Email',
    send_text_pdf: 'New PDF Text',
    send_email_image: 'New Image Email',
    send_text_image: 'New Image Text',
    update_contact: 'Edit Contact',
    deal: 'New Deal',
    move_deal: 'Move Deal',
    send_email_material: 'New Material Email',
    send_text_material: 'New Material Text',
    automation: 'Automation',
    appointment: 'New Appointment',
    update_appointment: 'Update Appointment',
    contact_condition: 'Contact Condition',
    move_contact: 'Contact Move',
    share_contact: 'Contact Share'
  };

  CASE_ACTIONS = {
    watched_video: 'Watched Video?',
    watched_pdf: 'Reviewed PDF?',
    watched_image: 'Reviewed Image?',
    opened_email: 'Opened Email?',
    replied_text: 'Replied Text',
    watched_material: 'Watched Material?',
    task_check: 'Completed Task?'
  };
  NEED_CASE_ACTIONS: [
    'email',
    'send_email_video',
    'send_text_video',
    'send_email_pdf',
    'send_text_pdf',
    'send_email_image',
    'send_text_image'
  ];

  NoLimitActions = [
    // 'note',
    // 'follow_up',
    // 'update_contact',
    // 'update_follow_up',
    // 'deal',
    // 'move_deal'
  ];

  NoSwitchableActions = ['deal', 'move_deal', 'automation'];
}
