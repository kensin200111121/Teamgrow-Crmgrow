import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TaskRecurringDialogComponent } from '@components/task-recurring-dialog/task-recurring-dialog.component';
import { SspaService } from '@services/sspa.service';
import { DealsService } from '@services/deals.service';
import { Deal } from '@models/deal.model';
import { Contact } from '@models/contact.model';
import { TabItem } from '@utils/data.types';
import { MatDialog } from '@angular/material/dialog';
import { CalendarEventDialogComponent } from '@components/calendar-event-dialog/calendar-event-dialog.component';
import { TaskCreateComponent } from '@components/task-create/task-create.component';
import {
  AUTOMATION_ICONS,
  CALENDAR_DURATION,
  DialogSettings,
  ActionName,
  ACTION_CAT,
  ACTION_METHOD
} from '@constants/variable.constants';
import { SendEmailComponent } from '@components/send-email/send-email.component';
import { NoteCreateComponent } from '@components/note-create/note-create.component';
import { Subscription } from 'rxjs';
import { NoteEditComponent } from '@components/note-edit/note-edit.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { TaskEditComponent } from '@components/task-edit/task-edit.component';
import { TaskDetail } from '@models/task.model';
import { HandlerService } from '@services/handler.service';
import { DealContactComponent } from '@components/deal-contact/deal-contact.component';
import * as _ from 'lodash';
import moment from 'moment-timezone';
import { AppointmentService } from '@services/appointment.service';
import { TeamService } from '@services/team.service';
import { UserService } from '@services/user.service';
import {
  getCurrentTimezone,
  getUserTimezone,
  listToTree,
  replaceToken
} from '@app/helper';
import { DetailActivity } from '@models/activityDetail.model';
import { User } from '@models/user.model';
import { ToastrService } from 'ngx-toastr';
import { AdditionalFieldsComponent } from '@components/additional-fields/additional-fields.component';
import { AdditionalEditComponent } from '@components/additional-edit/additional-edit.component';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Draft } from '@models/draft.model';
import { EmailService } from '@services/email.service';
import { filter, finalize, map } from 'rxjs/operators';
import { StoreService } from '@services/store.service';
import { Automation } from '@models/automation.model';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { AutomationService } from '@services/automation.service';
import { OverlayService } from '@services/overlay.service';
import { AutomationShowFullComponent } from '@components/automation-show-full/automation-show-full.component';
import { Timeline } from '@models/timeline.model';
import { environment } from '@environments/environment';
import { ConfirmBusinessComponent } from '@components/confirm-business-hour/confirm-business-hour.component';
import { DomSanitizer } from '@angular/platform-browser';
import { ResetDateTimeComponent } from '@components/reset-date-time/reset-date-time.component';
import { MatDrawer } from '@angular/material/sidenav';
import { LabelService } from '@services/label.service';
import { AccordionComponent } from '@components/accordion/accordion.component';
import { SendTextComponent } from '@app/components/send-text/send-text.component';
import { MaterialService } from '@app/services/material.service';
import { DialerService } from '@app/services/dialer.service';
import { USER_FEATURES } from '@app/constants/feature.constants';

const DEAL_ACTION = {
  DELETE: 0,
  CHANGE_TITLE: 1,
  MOVE_DEAL: 2,
  SET_PRIMARY: 3,
  ADD_CONTACT: 4,
  REMOVE_CONTACT: 5
};
@Component({
  selector: 'app-deals-detail',
  templateUrl: './deals-detail.component.html',
  styleUrls: ['./deals-detail.component.scss']
})
export class DealsDetailComponent implements OnInit {
  readonly USER_FEATURES = USER_FEATURES;
  ACTIVITY_GEN = {
    video_trackers: {
      watch: 'watched video',
      'thumbs up': 'thumbs up the video'
    },
    image_trackers: {
      review: 'reviewed image',
      'thumbs up': 'thumbs up the image'
    },
    pdf_trackers: {
      review: 'reviewed pdf',
      'thumbs up': 'thumbs up the pdf'
    },
    email_trackers: {
      open: 'opened email',
      click: 'Clicked the link on email'
    }
  };
  TRACKER_FIELD = {
    video_trackers: 'video',
    image_trackers: 'image',
    pdf_trackers: 'pdf',
    email_trackers: 'email'
  };
  timezone;
  dealId;
  deal = {
    main: new Deal(),
    activities: [],
    contacts: [],
    primary_contact: null
  };
  stages: any[] = [];
  selectedStage;
  selectedStageId = '';
  tabs: TabItem[] = [
    { icon: '', label: 'Activity', id: 'all' },
    { icon: '', label: 'Notes', id: 'notes' },
    { icon: '', label: 'Emails', id: 'emails' },
    { icon: '', label: 'Texts', id: 'texts', feature: USER_FEATURES.TEXT },
    { icon: '', label: 'Meetings', id: 'appointments' },
    { icon: '', label: 'Tasks', id: 'follow_ups' },
    {
      icon: '',
      label: 'Calls',
      id: 'phone_logs',
      feature: USER_FEATURES.DIALER
    },
    {
      icon: '',
      label: 'Automations',
      id: 'automations',
      feature: USER_FEATURES.AUTOMATION
    }
  ];
  tab: TabItem = this.tabs[0];
  activityType: TabItem = this.tabs[0];
  timeSorts = [
    { label: 'All', id: 'all' },
    { label: 'Overdue', id: 'overdue' },
    { label: 'Today', id: 'today' },
    { label: 'Tomorrow', id: 'tomorrow' },
    { label: 'This week', id: 'this_week' },
    { label: 'Next Week', id: 'next_week' },
    { label: 'Future', id: 'future' }
  ];
  selectedTimeSort = this.timeSorts[0];
  durations = CALENDAR_DURATION;
  dealPanel = true;
  contactsPanel = true;

  activityCounts = {
    all: 0,
    notes: 0,
    emails: 0,
    texts: 0,
    appointments: 0,
    phone_logs: 0,
    follow_ups: 0,
    deal: 0,
    automations: 0
  };
  notes = [];
  emails = [];
  texts = [];
  appointments = [];
  groupCalls = [];
  tasks = [];

  activities: DetailActivity[] = [];
  mainTimelines = [];
  showingDetails = [];
  groupActions = {};
  details = {};
  detailData = {};
  sendActions = {};
  automationDetails = {};

  editors = {};
  mores = {}; // show mode flags for the schedule items
  routeChangeSubscription: Subscription;
  profileSubscription: Subscription;
  stageLoadSubscription: Subscription;
  loadSubscription: Subscription;
  activitySubscription: Subscription;
  noteSubscription: Subscription;
  emailSubscription: Subscription;
  textSubscription: Subscription;
  appointmentSubscription: Subscription;
  groupCallSubscription: Subscription;
  taskSubscription: Subscription;
  dealSubscription: Subscription;
  teamsLoadSubscription: Subscription;
  updateSubscription: Subscription;
  reloadSubscription: Subscription;

  materialActivitySubscription: Subscription;
  cancelSubscription: Subscription;
  assignSubscription: Subscription;

  titleEditable = false;
  dealTitle = '';
  saving = false;
  saveSubscription: Subscription;
  loading = false;
  contacts = {};
  data = {
    materials: [],
    notes: [],
    emails: [],
    texts: [],
    appointments: [],
    tasks: [],
    phone_logs: [],
    automations: []
  };
  dataObj = {
    materials: {},
    notes: {},
    emails: {},
    texts: {},
    appointments: {},
    tasks: {},
    phone_logs: {},
    automations: {}
  };
  sub_calls = {};
  trackers = {};
  groups = [];
  dGroups = [];
  showingMax = 4;
  loadingAppointment = false;
  loadedAppointments = {};
  selectedAppointment;
  showAll = false;
  sliceNum = 5;
  showText = 'Show all';

  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  appointmentLoadSubscription: Subscription;
  @ViewChild('appointmentPortalContent')
  appointmentPortalContent: TemplateRef<unknown>;

  userId = '';
  emailDialog = null;
  textDialog = null;
  createEmailDraftSubscription: Subscription;
  updateEmailDraftSubscription: Subscription;
  removeEmailDraftSubscription: Subscription;
  createTextDraftSubscription: Subscription;
  updateTextDraftSubscription: Subscription;
  removeTextDraftSubscription: Subscription;
  setPrimaryContactSubscription: Subscription;
  draftSubscription: Subscription;
  draftEmail = new Draft();
  draftText = new Draft();

  // Automation
  selectedAutomation = '';
  assigning = false;
  canceling = false;
  allDataSource = new MatTreeNestedDataSource<any>();
  dataSource = new MatTreeNestedDataSource<any>();
  treeControl = new NestedTreeControl<any>((node) => node.children);
  ActionName = ActionName;
  siteUrl = environment.front;

  hasChild = (_: number, node: any) =>
    !!node.children && node.children.length > 0;

  timeLines = [];
  automation = null;
  automation_line = null;

  activeRoot: any;
  activePrevRoot: any;

  timelineActivities = [];
  getAutomationLinesSubscription: Subscription;
  getAutomationDetailSubscription: Subscription;
  garbageSubscription: Subscription;
  isBusinessTime = true;

  isUpdatingTimeline = false;
  updatingTimeline = null;
  updateTimelineSubscription: Subscription;
  removeTimelineSubscription: Subscription;
  addTimelineSubscription: Subscription;

  //manage timeline
  panelType = '';
  automation_type = 'deal';
  actions = [];
  actionTimelines = [];
  isInherited = false;
  edges = [];
  nodes = [];
  identity = 1;
  prevNode;
  actionMethod = '';
  actionParam;
  materials = [];
  automations: Automation[] = [];
  receiveActionSubscription: Subscription;
  allLabels = null;
  labelSubscription: Subscription;

  @ViewChild('timelineEditDrawer') timelineEditDrawer: MatDrawer;
  @ViewChildren('noteActivityItem')
  noteActivityItem: QueryList<AccordionComponent>;

  contactMainInfo: Contact = new Contact(); // contact main informations

  additional_fields;
  timezone_info;
  hasDealTimelines = false;

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
  automationUnAssigned = true;
  calledSubscription: Subscription;
  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    public dealsService: DealsService,
    private dialerService: DialerService,
    private appointmentService: AppointmentService,
    private teamService: TeamService,
    private handlerService: HandlerService,
    private toast: ToastrService,
    private element: ElementRef,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private emailService: EmailService,
    private storeService: StoreService,
    private automationService: AutomationService,
    private overlayService: OverlayService,
    public domSanitizer: DomSanitizer,
    public labelService: LabelService,
    public sspaService: SspaService,
    public materialService: MaterialService,
    private changeDetector: ChangeDetectorRef
  ) {
    this.appointmentService.loadCalendars(false, false);
    this.teamService.loadAll(true);
    this.dealsService.stages.next([]); // reset previous fetched full stage list to prevent page freezing

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      try {
        if (user._id) {
          this.userId = user._id;
          const timezone = getCurrentTimezone();
          this.timezone = { zone: timezone };
        }
      } catch (err) {
        const timezone = getCurrentTimezone();
        this.timezone = { zone: timezone };
      }
    });

    if (this.dealsService.selectedPipeline.getValue()) {
      this.dealsService.easyLoadStage(
        true,
        this.dealsService.selectedPipeline.getValue()
      );
    }
    this.stageLoadSubscription && this.stageLoadSubscription.unsubscribe();
    this.stageLoadSubscription = this.dealsService.stages$.subscribe((res) => {
      this.stages = res;
      this.changeSelectedStage();
    });

    this.teamsLoadSubscription && this.teamsLoadSubscription.unsubscribe();
    this.teamsLoadSubscription = this.teamService.teams$.subscribe((teams) => {
      teams.forEach((team) => {
        if (team.editors && team.editors.length) {
          team.editors.forEach((e) => {
            this.editors[e._id] = new User().deserialize(e);
          });
        }
      });
    });

    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (this.dealId !== params['id']) {
        this.dealId = params['id'];
        this.loadSubscription && this.loadSubscription.unsubscribe();
        this.loadSubscription = this.dealsService
          .getDeal(this.dealId)
          .subscribe((res) => {
            if (res) {
              this.deal = res;
              this.deal.contacts = (res.contacts || []).map((e) =>
                new Contact().deserialize(e)
              );
              this.deal.contacts.forEach((e) => {
                this.contacts[e._id] = e;
              });
              if (this.deal.main.deal_stage) {
                this.selectedStageId = this.deal.main.deal_stage;
                this.changeSelectedStage();
              }
              this.loadActivity();
              this.getTimeLines();
              this.getSiblings();
              this.loadTasks();
            }
          });
      }
    });

    this.labelSubscription && this.labelSubscription.unsubscribe();
    this.labelSubscription = this.labelService.allLabels$.subscribe((res) => {
      if (res) {
        this.allLabels = res;
      }
    });

    this.calledSubscription && this.calledSubscription.unsubscribe();
    this.calledSubscription = this.dealsService.called$.subscribe((res) => {
      // this.reloadLatest();
    });

    const profile = this.userService.profile.getValue();
    this.timezone_info = getUserTimezone(profile);
    const garbage = this.userService.garbage.getValue();
    this.additional_fields = garbage.additional_fields || [];
  }

  ngOnInit(): void {
    const selectedTab = localStorage.getCrmItem('dealSelectedTab');
    this.materialService.loadOwn(true);
    if (selectedTab) {
      const tabIndex = this.tabs.findIndex((tab) => tab.id === selectedTab);
      this.tab = this.tabs[tabIndex] || this.tabs[0];
    } else {
      localStorage.setCrmItem('dealSelectedTab', this.tab.id);
    }
    const id = this.route.snapshot.params.id;
    if (id) {
      this.dealId = id;
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.dealsService.getDeal(id).subscribe((res) => {
        if (res) {
          this.deal = res;
          this.deal.contacts = (res.contacts || []).map((e) =>
            new Contact().deserialize(e)
          );
          this.deal.contacts.forEach((e) => {
            this.contacts[e._id] = e;
          });
          if (res.primary_contact) {
            this.deal.primary_contact = res.primary_contact;
            const index = this.deal.contacts.findIndex(
              (item) => item._id === this.deal.primary_contact
            );
            if (index >= 0) {
              const primaryContact = this.deal.contacts[index];
              this.deal.contacts.splice(index, 1);
              this.deal.contacts.unshift(primaryContact);
            }
          }
          if (this.deal.main.deal_stage) {
            this.selectedStageId = this.deal.main.deal_stage;
            this.changeSelectedStage();
          }
          this.loadActivity();
          this.getTimeLines();
          this.getSiblings();
          this.loadTasks();
        }
      });
      this.routerHandle();
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.stageLoadSubscription && this.stageLoadSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.teamsLoadSubscription && this.teamsLoadSubscription.unsubscribe();
    this.labelSubscription && this.labelSubscription.unsubscribe();
    this.receiveActionSubscription &&
      this.receiveActionSubscription.unsubscribe();
    this.storeService.timelineOutputData.next(null);

    this.timelineEditDrawer?.close();
    this.timelineEditDrawer?.ngOnDestroy();
  }

  changeSelectedStage(): void {
    this.stages.some((e) => {
      if (e._id === this.selectedStageId) {
        this.selectedStage = e;
      }
    });
  }

  backPage(): void {
    this.router.navigate(['/pipeline']);
  }

  loadActivity(): void {
    this.activitySubscription && this.activitySubscription.unsubscribe();
    this.loading = true;
    this.activitySubscription = this.dealsService
      .getActivity({ deal: this.dealId })
      .subscribe((res) => {
        this.loading = false;
        if (res) {
          this.activities = res['activity'].map((e) =>
            new DetailActivity().deserialize(e)
          );
          this.activities.sort((a, b) => {
            return a.updated_at > b.updated_at ? 1 : -1;
          });

          for (let i = 0; i < this.activities.length; i++) {
            const first_activty = this.activities[i];
            if (first_activty.type !== 'deals') continue;
            if (first_activty.content === 'added contact') continue;
            const time = moment(first_activty.updated_at);
            for (let j = i + 1; j < this.activities.length; j++) {
              const second_activty = this.activities[j];
              if (second_activty.type !== 'deals') continue;
              if (second_activty.content === 'added contact') continue;
              const time2 = moment(second_activty.updated_at);
              if (time2.diff(time, 'seconds') < 1) {
                if (!first_activty.sub_activities)
                  first_activty.sub_activities = [];
                first_activty.sub_activities.push(second_activty);
                this.activities.splice(j, 1);
                j--;
              }
            }
          }
          this.details = res['details'];
          this.dataObj.materials = {};
          this.dataObj.notes = {};
          this.dataObj.emails = {};
          this.dataObj.texts = {};
          this.dataObj.appointments = {};
          this.dataObj.tasks = {};
          this.dataObj.phone_logs = {};
          this.dataObj.automations = {};
          this.sub_calls = {};
          this.groups = [];

          //populate assigned contact in activity

          for (const activity of this.activities) {
            if (activity.type === 'notes') {
              const index = this.details['notes'].findIndex(
                (item) => item._id === activity['notes']
              );
              if (index >= 0) {
                activity['assigned_contacts'] = this.getContactList(
                  this.details['notes'][index]['assigned_contacts']
                );
                activity['activity_detail'] = this.details['notes'][index];
              }
            }
            if (activity.type === 'texts') {
              const index = this.details['texts'].findIndex(
                (item) => item._id === activity['texts']
              );
              if (index >= 0) {
                activity['assigned_contacts'] = this.getContactList(
                  this.details['texts'][index]['contacts']?.length
                    ? this.details['texts'][index]['contacts']
                    : this.details['texts'][index]['assigned_contacts']
                );
                activity['activity_detail'] = this.details['texts'][index];
              }
            }

            if (activity.type === 'emails') {
              const index = this.details['emails'].findIndex(
                (item) => item._id === activity['emails']
              );
              if (index >= 0) {
                activity['assigned_contacts'] = this.getContactList(
                  this.details['emails'][index]['assigned_contacts']?.length
                    ? this.details['emails'][index]['assigned_contacts']
                    : this.details['emails'][index]['contacts']
                );
                activity['activity_detail'] = this.details['emails'][index];
              }
            }

            if (activity.type === 'follow_ups') {
              const index = this.details['tasks'].findIndex(
                (item) => item._id === activity['follow_ups']
              );
              if (index >= 0) {
                activity['assigned_contacts'] = this.getContactList(
                  this.details['tasks'][index]['assigned_contacts']
                );
                activity['activity_detail'] = this.details['tasks'][index];
              }
            }

            if (activity.type === 'phone_logs') {
              const index = this.details['phone_logs'].findIndex(
                (item) => item._id === activity['phone_logs']
              );
              if (index >= 0) {
                activity['assigned_contacts'] = this.getContactList(
                  this.details['phone_logs'][index]['assigned_contacts']
                );
                activity['activity_detail'] = this.details['phone_logs'][index];
              }
            }

            if (activity.type === 'appointments') {
              const index = this.details['appointments'].findIndex(
                (item) => item._id === activity['appointments']
              );
              if (index >= 0) {
                activity['assigned_contacts'] = this.getContactList(
                  this.details['appointments'][index]['contacts']
                );
                activity['activity_detail'] =
                  this.details['appointments'][index];
              }
            }
          }

          this.data.materials = this.details['materials'] || [];
          this.data.notes = this.details['notes'] || [];
          this.data.emails = this.details['emails'] || [];
          this.data.texts = this.details['texts'] || [];
          this.data.appointments = this.details['appointments'] || [];
          this.data.tasks = this.details['tasks'] || [];
          this.data.phone_logs = this.details['phone_logs'] || [];
          this.data.automations = this.details['automations'] || [];

          (this.details['sub_calls'] || []).forEach((call) => {
            const key = call.shared_log;
            if (!this.sub_calls[key] || !this.sub_calls[key].length) {
              this.sub_calls[key] = [call];
            } else {
              this.sub_calls[key].push(call);
            }
          });
          for (const key in this.sub_calls) {
            this.sub_calls[key] = _.uniqBy(this.sub_calls[key], '_id');
          }
          this.trackers = this.details['trackers'] || {};

          this.groupActivities();
          this.arrangeActivity();
          this.setLastActivity();
          this.fetchAutomationActivities();

          //populate assigned contact in detail
          if (this.data.notes.length) {
            for (const note of this.data.notes) {
              if (note.assigned_contacts && note.assigned_contacts.length > 0) {
                const assigned_contacts = [];
                for (const contact of note.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                note.assigned_contacts = assigned_contacts;
              }
            }
          }
          if (this.data.emails.length) {
            for (const email of this.data.emails) {
              if (
                email.assigned_contacts &&
                email.assigned_contacts.length > 0
              ) {
                const assigned_contacts = [];
                for (const contact of email.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                email.assigned_contacts = assigned_contacts;
              }
            }
          }
          if (this.data.texts.length) {
            for (const text of this.data.texts) {
              if (text.assigned_contacts && text.assigned_contacts.length > 0) {
                const assigned_contacts = [];
                for (const contact of text.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                text.assigned_contacts = assigned_contacts;
              }
            }
          }
          if (this.data.tasks.length) {
            for (const task of this.data.tasks) {
              if (task.assigned_contacts && task.assigned_contacts.length > 0) {
                const assigned_contacts = [];
                for (const contact of task.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                task.assigned_contacts = assigned_contacts;
              }
            }
          }

          if (this.data.phone_logs.length) {
            for (const log of this.data.phone_logs) {
              if (log.assigned_contacts && log.assigned_contacts.length > 0) {
                const assigned_contacts = [];
                for (const contact of log.assigned_contacts) {
                  const index = this.deal.contacts.findIndex(
                    (item) => item._id === contact
                  );
                  if (index >= 0) {
                    assigned_contacts.push(this.deal.contacts[index]);
                  }
                }
                log.assigned_contacts = assigned_contacts;
              }
            }
          }
        }
        for (const key in this.data) {
          if (key !== 'materials') {
            this.data[key].forEach((e) => {
              this.dataObj[key][e._id] = e;
            });
          } else {
            this.data[key].forEach((e) => {
              e.material_type = 'video';
              if (e.type) {
                if (e.type.indexOf('pdf') !== -1) {
                  e.material_type = 'pdf';
                } else if (e.type.indexOf('image') !== -1) {
                  e.material_type = 'image';
                }
              }
              this.dataObj[key][e._id] = e;
            });
          }
        }

        this.changeTab(this.tab);
      });
  }
  groupActivities(): void {
    this.groupActions = {};
    this.mainTimelines = [];
    const groupTypeIndex = {};
    for (let i = this.activities.length - 1; i >= 0; i--) {
      const e = this.activities[i];
      const groupData = this.generateUniqueId(e);
      if (!groupData) {
        continue;
      }
      const { type, group } = groupData;

      e.group_id = group;
      // if (this.activities[i].type == 'deals' && this.activities[i].contacts) {
      //   continue;
      // }
      //if (this.groupActions[group] && this.activities[i].type != 'deals') {
      if (this.groupActions[group]) {
        this.groupActions[group].push(e);
      } else {
        this.groupActions[group] = [e];
        groupTypeIndex[group] = type;
      }
    }
    for (const group in this.groupActions) {
      if (this.trackers[group]) {
        for (const type in this.trackers[group]) {
          this.trackers[group][type].forEach((e) => {
            const activity = {};
            activity['type'] = type;
            activity['content'] = this.ACTIVITY_GEN[type][e.type];
            activity['created_at'] = e.created_at;
            activity['updated_at'] = e.updated_at;
            activity['videos'] = [];
            activity['pdfs'] = [];
            activity['images'] = [];
            // user,contacts,emails,texts,
            if (e.user && e.user instanceof Array) {
              activity['user'] = e.user[0];
            } else {
              activity['user'] = e.user;
            }
            if (e.contact && e.contact instanceof Array) {
              activity['contacts'] = e.contact[0];
            } else {
              activity['contacts'] = e.contact;
            }
            if (type === 'video_trackers') {
              if (e.video && e.video instanceof Array) {
                activity['videos'] = e.video;
              } else {
                activity['videos'] = [e.video];
              }
            }
            if (type === 'pdf_trackers') {
              if (e.pdf && e.pdf instanceof Array) {
                activity['pdfs'] = e.pdf;
              } else {
                activity['pdfs'] = [e.pdf];
              }
            }
            if (type === 'image_trackers') {
              if (e.image && e.image instanceof Array) {
                activity['images'] = e.image;
              } else {
                activity['images'] = [e.image];
              }
            }
            if (type === 'email_trackers') {
              if (e.email && e.email instanceof Array) {
                activity['emails'] = e.email[0];
              } else {
                activity['images'] = e.email;
              }
            }

            activity[type] = e;
            this.groupActions[group].push(
              new DetailActivity().deserialize(activity)
            );
          });

          this.groupActions[group].sort((a, b) =>
            a.created_at < b.created_at ? 1 : -1
          );
        }
      }

      const actions = this.groupActions[group].sort((a, b) =>
        a.updated_at < b.updated_at ? 1 : -1
      );

      this.mainTimelines.push(actions[0]);

      this.groups.push({
        type: groupTypeIndex[group],
        group,
        latest_time: actions[0].updated_at
      });
    }
    this.mainTimelines.sort((a, b) => {
      return a.updated_at < b.updated_at ? 1 : -1;
    });
    this.groups.sort((a, b) => {
      return a.latest_time < b.latest_time ? 1 : -1;
    });
  }

  fetchAutomationActivities(): void {
    const automationActivities = this.activities.filter(
      (item) => item.type === 'automations'
    );
    for (const activity of automationActivities) {
      const assignAutomationIndex = this.activities.findIndex(
        (item) =>
          item.automations === activity.automations &&
          item.content === 'assigned automation'
      );
      if (assignAutomationIndex >= 0) {
        this.automationDetails[activity._id] = {};
        if (activity.content !== 'assigned automation') {
          this.automationDetails[activity._id]['sub_activity'] =
            this.activities[assignAutomationIndex];
        }
        this.automationDetails[activity._id]['automation'] = this.details[
          'automations'
        ].find((item) => item._id === activity.automations);
      }
    }
  }

  getSiblings(): void {
    this.dealsService.getSiblings(this.dealId);
  }

  generateUniqueId(activity: DetailActivity): any {
    switch (activity.type) {
      case 'emails':
      case 'texts':
      case 'notes':
      case 'appointments':
      case 'follow_ups':
      case 'phone_logs':
      case 'automations':
      case 'deals':
        return {
          type: activity.type,
          group: activity[activity.type]
        };
    }
  }

  getActivityContent(media_type, tracker_type): string {
    let actionStr = '';
    switch (tracker_type) {
      case 'click':
        actionStr = 'clicked the link';
        break;
      case 'watch':
        actionStr = 'watched ';
        break;
      case 'open':
        actionStr = 'opened ';
        break;
      case 'unsubscribed':
        actionStr = 'unsubscribed ';
        break;
      case 'sent':
        actionStr = 'sent';
        break;
      case 'review':
        actionStr = 'reviewed ';
        break;
      case 'thumbs up':
        actionStr = 'gave thumbs up';
        return actionStr;
        break;
      default:
        actionStr = tracker_type;
    }

    return actionStr + ' ' + media_type.replace('_trackers', '');
  }

  generateMaterialActivity(trackers): any {
    const detailActivities = [];
    let send_activities;
    for (const key in trackers) {
      if (key === 'send_activities') {
        send_activities = trackers[key];
        continue;
      }
      if (trackers[key] && trackers[key].length > 0) {
        for (const tracker of trackers[key]) {
          if (!tracker) {
            continue;
          }
          const activity = new DetailActivity();
          activity['_id'] = tracker._id;
          if (Array.isArray(tracker.contact)) {
            const contacts = [];
            for (const contact of tracker.contact) {
              const index = this.deal.contacts.findIndex(
                (item) => item._id === contact
              );
              if (index >= 0) {
                contacts.push(this.deal.contacts[index]);
              }
            }
            activity['assigned_contacts'] = [...contacts];
          } else {
            const index = this.deal.contacts.findIndex(
              (item) => item._id === tracker.contact
            );
            if (index >= 0) {
              activity['assigned_contacts'] = [this.deal.contacts[index]];
            } else {
              activity['assigned_contacts'] = [];
            }
          }
          if (Array.isArray(tracker.user)) {
            activity['user'] = tracker.user[0];
          } else {
            activity['user'] = tracker.user;
          }
          activity['type'] = key;
          activity['emails'] = tracker.email;
          activity[key] = tracker;
          activity['content'] = this.getActivityContent(key, tracker.type);
          activity['created_at'] = tracker.created_at;
          activity['updated_at'] = tracker.updated_at;
          if (Array.isArray(tracker.contact)) {
            activity['activity'] = tracker.activity[0];
          } else {
            activity['activity'] = tracker.activity;
          }

          detailActivities.push(activity);
        }
      }
    }
    detailActivities.sort((a, b) => {
      if (new Date(a.created_at + '') < new Date(b.created_at + '')) {
        return 1;
      }
      return -1;
    });

    return { detailActivities, send_activities };
  }

  getActivityByGroup(group_id, type): any {
    const index = this.activities.findIndex((item) => item[type] === group_id);
    if (index >= 0) {
      return this.activities[index];
    }
    return null;
  }

  showMoreDetail(group_id, activity = null): void {
    if (activity) {
      this.materialActivitySubscription &&
        this.materialActivitySubscription.unsubscribe();
      activity.loadingTracker = true;
      const detailContacts = [];
      this.materialActivitySubscription = this.dealsService
        .getMaterialActivity(activity._id)
        .subscribe((res) => {
          if (res) {
            const { detailActivities, send_activities } =
              this.generateMaterialActivity(res);
            for (let i = 0; i < activity.assigned_contacts?.length; i++) {
              const contact = activity.assigned_contacts[i];
              const send_activity = send_activities?.filter(
                (e) => contact?._id === e.contacts
              );
              if (send_activity && send_activity.length) {
                contact['send_status'] = send_activity[0].status;
              } else {
                contact['send_status'] = 'failed';
              }
            }
            if (this.groupActions[activity.group_id]) {
              for (const detailActivity of detailActivities) {
                const index = this.groupActions[activity.group_id].findIndex(
                  (item) => item._id === detailActivity._id
                );
                if (index < 0) {
                  this.groupActions[activity.group_id].push(detailActivity);
                  this.groupActions[activity.group_id] = [
                    ...this.groupActions[activity.group_id]
                  ];
                }
                if (detailActivity.type != '') {
                  const key = detailActivity.type;
                  if (detailActivity[key]) {
                    const { contact } = detailActivity[key];
                    detailContacts.push(contact);
                  }
                }
              }
            }
            if (activity.assigned_contacts?.length > 0) {
              const unReadContact = activity.assigned_contacts.filter(
                (_item) => !detailContacts.includes(_item._id.toString())
              );
              activity.assigned_contacts = unReadContact;
            }
            activity['loadExpand'] = true;
          }
          activity.loadingTracker = false;
        });
    }
    if (this.dGroups.length >= this.showingMax) {
      this.dGroups.shift();
    }
    this.dGroups.push(group_id);
  }

  hideMoreDetail(group_id): void {
    const pos = this.dGroups.indexOf(group_id);
    if (pos !== -1) {
      this.dGroups.splice(pos, 1);
    }
  }

  loadDetailAppointment(event): void {
    if (!event.meta.event_id) {
      const loadedEvent = { ...event };
      this.selectedAppointment = loadedEvent;
      return;
    }
    const calendars = this.appointmentService.subCalendars.getValue();
    const currentCalendar = calendars[event.meta.calendar_id];
    if (!currentCalendar) {
      return;
    }
    const connected_email = currentCalendar.account;
    this.loadingAppointment = true;
    this.appointmentLoadSubscription &&
      this.appointmentLoadSubscription.unsubscribe();
    this.appointmentLoadSubscription = this.appointmentService
      .getEvent({
        connected_email,
        event_id: event.meta.event_id,
        calendar_id: event.meta.calendar_id
      })
      .subscribe((res) => {
        this.loadingAppointment = false;
        const loadedEvent = { ...event };
        loadedEvent.meta.is_organizer = res.organizer.self;
        loadedEvent.meta.organizer = res.organizer.email;
        loadedEvent.meta.guests = res.attendees || [];
        loadedEvent.meta.guests.forEach((e) => {
          e.response = e.responseStatus;
        });
        this.loadedAppointments[event.meta.event_id] = loadedEvent;
        this.selectedAppointment = loadedEvent;
      });
  }

  openDetailEvent(detail, event): void {
    const _formattedEvent = {
      title: detail.title,
      start: new Date(detail.due_start),
      end: new Date(detail.due_end),
      meta: {
        contacts: detail.contacts,
        calendar_id: detail.calendar_id,
        description: detail.description,
        location: detail.location,
        type: detail.type,
        guests: detail.guests,
        event_id: detail.event_id,
        recurrence: detail.recurrence,
        recurrence_id: detail.recurrence_id,
        is_organizer: detail.is_organizer,
        organizer: detail.organizer
      }
    };
    const oldAppointmentId = this.selectedAppointment
      ? this.selectedAppointment['meta']['event_id']
      : '';
    this.selectedAppointment = _formattedEvent;
    const newAppointmentId = this.selectedAppointment
      ? this.selectedAppointment['meta']['event_id']
      : '';
    const originX = event.clientX;
    const originY = event.clientY;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const size = {
      maxWidth: '360px',
      minWidth: '300px',
      maxHeight: 410,
      minHeight: 320
    };
    const positionStrategy = this.overlay.position().global();
    if (screenW - originX > 380) {
      positionStrategy.left(originX + 'px');
    } else if (originX > 380) {
      positionStrategy.left(originX - 380 + 'px');
    } else if (screenW - originX > 320) {
      positionStrategy.left(originX + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 440) {
      positionStrategy.centerVertically();
    } else if (originY < 220) {
      positionStrategy.top('10px');
    } else if (screenH - originY < 220) {
      positionStrategy.top(screenH - 430 + 'px');
    } else {
      positionStrategy.top(originY - 220 + 'px');
    }
    size['height'] = 'unset';
    this.templatePortal = new TemplatePortal(
      this.appointmentPortalContent,
      this.viewContainerRef
    );

    if (
      !this.loadedAppointments[newAppointmentId] &&
      newAppointmentId != oldAppointmentId
    ) {
      this.loadDetailAppointment(this.selectedAppointment);
    } else {
      if (this.loadedAppointments[newAppointmentId]) {
        this.selectedAppointment = this.loadedAppointments[newAppointmentId];
      }
    }

    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
      }
      this.overlayRef.updatePositionStrategy(positionStrategy);
      this.overlayRef.updateSize(size);
      this.overlayRef.attach(this.templatePortal);
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.outsidePointerEvents().subscribe((evt) => {
        this.selectedAppointment = null;
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  openAppointmentDlg(): void {
    this.dialog
      .open(CalendarEventDialogComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        maxHeight: '700px',
        data: {
          mode: 'dialog',
          deal: this.dealId,
          contacts: this.deal.contacts
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.reloadLatest(2);
        }
      });
  }

  openSendEmail(): void {
    if (!this.emailDialog) {
      if (this.dealId) {
        this.draftSubscription && this.draftSubscription.unsubscribe();
        const draftData = {
          deal: this.dealId,
          type: 'deal_email'
        };
        this.draftSubscription = this.emailService
          .getDraft(draftData)
          .subscribe((res) => {
            if (res) {
              this.draftEmail = res;
            }
            this.emailDialog = this.dialog.open(SendEmailComponent, {
              position: {
                bottom: '0px',
                right: '0px'
              },
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: {
                deal: this.dealId,
                contacts: this.deal.contacts,
                type: 'deal_email',
                draft: this.draftEmail
              }
            });

            const openedDialogs =
              this.storeService.openedDraftDialogs.getValue();
            if (openedDialogs && openedDialogs.length > 0) {
              for (const dialog of openedDialogs) {
                if (
                  dialog._ref.overlayRef._host.classList.contains('top-dialog')
                ) {
                  dialog._ref.overlayRef._host.classList.remove('top-dialog');
                }
              }
            }
            this.emailDialog._ref.overlayRef._host.classList.add('top-dialog');
            this.storeService.openedDraftDialogs.next([
              ...openedDialogs,
              this.emailDialog
            ]);

            this.emailDialog.afterClosed().subscribe((response) => {
              const dialogs = this.storeService.openedDraftDialogs.getValue();
              if (dialogs && dialogs.length > 0) {
                const index = dialogs.findIndex(
                  (item) => item.id === this.emailDialog.id
                );
                if (index >= 0) {
                  dialogs.splice(index, 1);
                  this.storeService.openedDraftDialogs.next([...dialogs]);
                }
              }
              this.emailDialog = null;
              if (response && response.status) this.loadTasks();
              if (response && response.draft) {
                this.saveEmailDraft(response.draft);
                this.storeService.emailDealDraft.next({});
              }
              if (response && response.send) {
                const sendEmail = response.send;
                if (sendEmail._id) {
                  this.emailService
                    .removeDraft(sendEmail._id)
                    .subscribe((result) => {
                      if (result) {
                        this.draftEmail = new Draft();
                        this.storeService.emailDealDraft.next({});
                      }
                    });
                }
              }
              this.reloadLatest(3);
            });
          });
      }
    } else {
      const openedDialogs = this.storeService.openedDraftDialogs.getValue();
      if (openedDialogs && openedDialogs.length > 0) {
        for (const dialog of openedDialogs) {
          if (dialog._ref.overlayRef._host.classList.contains('top-dialog')) {
            dialog._ref.overlayRef._host.classList.remove('top-dialog');
          }
        }
      }
      this.emailDialog._ref.overlayRef._host.classList.add('top-dialog');
    }
  }

  openSendText(): void {
    const contacts = [];
    this.deal.contacts.forEach((e) => {
      if (e.cell_phone) {
        contacts.push(e);
      }
    });
    if (!contacts.length) {
      this.toast.error(
        '',
        `You can't message as any contacts of this deal don't have cell phone number.`
      );
      return;
    }
    if (!this.textDialog) {
      if (this.dealId) {
        this.draftSubscription && this.draftSubscription.unsubscribe();
        const draftData = {
          deal: this.dealId,
          type: 'deal_text'
        };
        this.draftSubscription = this.emailService
          .getDraft(draftData)
          .subscribe((res) => {
            if (res) {
              this.draftText = res;
            }
            this.textDialog = this.dialog.open(SendTextComponent, {
              position: {
                bottom: '0px',
                right: '0px'
              },
              width: '100vw',
              maxWidth: '600px',
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: {
                type: 'multi',
                deal: this.dealId,
                contacts,
                draft_type: 'deal_text',
                draft: this.draftText
              }
            });

            const openedDialogs =
              this.storeService.openedDraftDialogs.getValue();
            if (openedDialogs && openedDialogs.length > 0) {
              for (const dialog of openedDialogs) {
                if (
                  dialog._ref.overlayRef._host.classList.contains('top-dialog')
                ) {
                  dialog._ref.overlayRef._host.classList.remove('top-dialog');
                }
              }
            }
            this.textDialog._ref.overlayRef._host.classList.add('top-dialog');
            this.storeService.openedDraftDialogs.next([
              ...openedDialogs,
              this.textDialog
            ]);

            this.textDialog.afterClosed().subscribe((response) => {
              const dialogs = this.storeService.openedDraftDialogs.getValue();
              if (dialogs && dialogs.length > 0) {
                const index = dialogs.findIndex(
                  (item) => item.id === this.textDialog.id
                );
                if (index >= 0) {
                  dialogs.splice(index, 1);
                  this.storeService.openedDraftDialogs.next([...dialogs]);
                }
              }
              this.textDialog = null;
              if (response && response.draft) {
                this.saveTextDraft(response.draft);
                this.storeService.textDealDraft.next({});
              }
              if (response && response.send) {
                const sendText = response.send;
                if (sendText._id) {
                  this.emailService
                    .removeDraft(sendText._id)
                    .subscribe((result) => {
                      if (result) {
                        this.draftText = new Draft();
                        this.storeService.textDealDraft.next({});
                      }
                    });
                }
              }
              this.reloadLatest(3);
            });
          });
      }
    } else {
      const openedDialogs = this.storeService.openedDraftDialogs.getValue();
      if (openedDialogs && openedDialogs.length > 0) {
        for (const dialog of openedDialogs) {
          if (dialog._ref.overlayRef._host.classList.contains('top-dialog')) {
            dialog._ref.overlayRef._host.classList.remove('top-dialog');
          }
        }
      }
      this.textDialog._ref.overlayRef._host.classList.add('top-dialog');
    }
  }

  openCall(): void {
    const contacts = [];
    this.deal.contacts.forEach((e) => {
      const contactObj = new Contact().deserialize(e);
      const contact = {
        contactId: contactObj._id,
        numbers: [contactObj.cell_phone],
        name: contactObj.fullName
      };
      contacts.push(contact);
    });
    if (!contacts.length) {
      this.toast.error('', `These deal contacts don't have cell phone.`);
      return;
    }
    this.dialerService.makeCalls(contacts, this.dealId);
  }

  openTaskDlg(): void {
    this.dialog
      .open(TaskCreateComponent, {
        ...DialogSettings.TASK,
        data: {
          contacts: this.deal.contacts,
          deal: this.dealId
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reloadLatest(this.deal.contacts.length);
        }
      });
  }

  openNoteDlg(): void {
    this.dialog
      .open(NoteCreateComponent, {
        ...DialogSettings.NOTE,
        data: {
          deal: this.dealId,
          contacts: this.deal.contacts
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.reloadLatest(2);
        }
      });
  }

  moveDeal(stage): void {
    const data = {
      deal_id: this.dealId,
      position: stage.deals.length,
      deal_stage_id: stage._id
    };
    this.dealsService.moveDeal(data).subscribe((res) => {
      this.deal.main.deal_stage = stage._id;
      this.selectedStageId = stage._id;
      this.changeSelectedStage();
      this.reloadLatest(10);
      this.pageStateRearrange(DEAL_ACTION.MOVE_DEAL, stage?._id);
    });
  }

  contactDetail(contact: any): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  addContact(): void {
    this.contactsPanel = !this.contactsPanel;
    const isRunningTimeline = this.timeLines.some(
      (item) =>
        (item.status === 'active' && new Date(item.due_date) > new Date()) ||
        item.status === 'pending'
    );
    this.dialog
      .open(DealContactComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '500px',
        disableClose: true,
        data: {
          deal: this.dealId,
          exceedContacts: this.deal.contacts,
          isRunningTimeline
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.data && res.data.length) {
          this.deal.contacts = _.unionWith(
            this.deal.contacts,
            res.data,
            _.isEqual
          );
          this.reloadLatest(res.data.length);
          this.pageStateRearrange(DEAL_ACTION.ADD_CONTACT, res?.ids[0]);
        }
      });
  }

  removeContact(contact: Contact): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Contact',
          message: 'Are you sure you want to remove contact from this deal?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.status) {
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Delete Deal',
                message:
                  'Do you want to remove all the data and all the activities related this deal from contact?',
                cancelLabel: 'No',
                confirmLabel: 'Yes'
              }
            })
            .afterClosed()
            .subscribe((confirm) => {
              if (confirm?.status === true) {
                this.toast.warning(
                  'When you remove this contact, the current assigned automations would not executed on this contact anymore.'
                );
                this.dealsService
                  .updateContact({
                    dealId: this.dealId,
                    action: 'remove',
                    ids: [contact._id]
                  })
                  .subscribe((status) => {
                    if (status) {
                      _.pullAllBy(
                        this.deal.contacts,
                        [{ _id: contact._id }],
                        '_id'
                      );
                      // remove the activities for the removed contact
                      for (let i = this.activities.length - 1; i >= 0; i--) {
                        if (this.activities[i].contacts === contact._id) {
                          this.activities.splice(i, 1);
                        } else if (this.activities[i].sub_activities) {
                          for (
                            let j =
                              this.activities[i].sub_activities.length - 1;
                            j >= 0;
                            j--
                          ) {
                            if (
                              this.activities[i].sub_activities[j].contacts ===
                              contact._id
                            ) {
                              this.activities[i].sub_activities.splice(j, 1);
                            }
                          }
                        }
                      }
                      this.reloadLatest(2);
                    }
                  });
              } else if (confirm?.status === false) {
                this.toast.warning(
                  'When you remove this contact, the current assigned automations would not executed on this contact anymore.'
                );
                this.dealsService
                  .updateContact({
                    dealId: this.dealId,
                    action: 'remove',
                    ids: [contact._id],
                    deleteAllData: false
                  })
                  .subscribe((status) => {
                    if (status) {
                      _.pullAllBy(
                        this.deal.contacts,
                        [{ _id: contact._id }],
                        '_id'
                      );
                      this.reloadLatest(2);
                    }
                  });
              }
              this.pageStateRearrange(DEAL_ACTION.REMOVE_CONTACT, contact?._id);
            });
        }
      });
  }

  pageStateRearrange(action: number, value: any): void {
    let _dealInfo: Deal = null;
    const pageStages = this.dealsService.pageStages.getValue();
    pageStages.forEach((dealStage) => {
      const indexOfObject = dealStage.deals?.findIndex((deal) => {
        return deal['_id'] == this.dealId;
      });
      if (indexOfObject >= 0) {
        switch (action) {
          case DEAL_ACTION.DELETE: //DELETE DEAL
            dealStage?.deals?.splice(indexOfObject, 1);
            dealStage.deals_count--;
            break;
          case DEAL_ACTION.CHANGE_TITLE: //EDIT DEAL TITLE
            dealStage.deals[indexOfObject]['title'] = value;
            break;
          case DEAL_ACTION.MOVE_DEAL: //MOVE DEAL TO ANOTHER STAGE
            _dealInfo = dealStage?.deals?.find((obj) => {
              return obj['_id'] === this.dealId;
            });
            dealStage?.deals?.splice(indexOfObject, 1);
            dealStage.deals_count--;
            break;
          case DEAL_ACTION.ADD_CONTACT: //ADD NEW CONTACT
            dealStage.deals[indexOfObject].contacts.push(value);
            break;
          case DEAL_ACTION.REMOVE_CONTACT: //REMOVE CONTACT
            const indexOfContact = dealStage.deals[
              indexOfObject
            ]?.contacts?.findIndex((contact) => {
              return contact == value;
            });
            dealStage.deals[indexOfObject]?.contacts?.splice(indexOfContact, 1);
          case DEAL_ACTION.SET_PRIMARY: //SET PRIMARY CONTACT FROM ANOTHER CONTACT
            dealStage.deals[indexOfObject]['primary_contact'] = value;
          default:
            break;
        }
      }
    });
    if (action === DEAL_ACTION.MOVE_DEAL && _dealInfo) {
      pageStages.forEach((dealStage) => {
        if (dealStage?._id === value) {
          _dealInfo.deal_stage = dealStage?._id;
          dealStage.deals.push(_dealInfo);
          dealStage.deals_count++;
        }
      });
    }
    this.dealsService.pageStages.next(pageStages);
  }

  removeDeal(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete Deal',
          message: 'Are you sure to delete this deal?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Delete Deal',
                message:
                  'Do you want to remove all the data and all the activities related this deal from contacts?',
                cancelLabel: 'No',
                confirmLabel: 'Yes'
              }
            })
            .afterClosed()
            .subscribe((confirm) => {
              if (confirm.status === true) {
                this.dealsService
                  .deleteDeal(this.dealId)
                  .subscribe((status) => {
                    if (status) {
                      this.pageStateRearrange(DEAL_ACTION.DELETE, '');
                      this.backPage();
                    }
                  });
              }
              if (confirm === false) {
                this.dealsService
                  .deleteOnlyDeal(this.dealId)
                  .subscribe((status) => {
                    if (status) {
                      this.pageStateRearrange(DEAL_ACTION.DELETE, '');
                      this.backPage();
                    }
                  });
              }
            });
        }
      });
  }

  removeScheduleItem(task: any): void {
    const confirmDlg = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      data: {
        title: 'Delete Schedule Item',
        message:
          "The schedule item will be removed permanently and won't be able to be restored later",
        confirmLabel: 'Yes, Delete'
      }
    });
    confirmDlg.afterClosed().subscribe((res) => {
      if (res) {
        // TODO: complete the remove schedule item
      }
    });
  }

  changeTab(tab: TabItem): void {
    this.tab = tab;
    this.changeDetector.detectChanges();
    if (this.tab.id !== 'all') {
      this.showingDetails = [];
      if (tab.id === 'notes') {
        this.showingDetails = [...this.data.notes];
        this.showingDetails.sort((a, b) =>
          a.updated_at > b.updated_at ? -1 : 1
        );
        return;
      }
      if (tab.id === 'appointments') {
        this.showingDetails = [...this.data.appointments];
        return;
      }
      if (tab.id === 'follow_ups') {
        this.changeSort(this.selectedTimeSort);
        return;
      }
      if (tab.id === 'emails') {
        this.activities.forEach((e) => {
          if (
            (e.type === 'videos' || e.type === 'pdfs' || e.type === 'images') &&
            (!e.emails || !e.emails.length) &&
            (!e.texts || !e.texts.length)
          ) {
            if (e.content.indexOf('email') !== -1) {
              this.showingDetails.push({
                ...this.dataObj.materials[e[e.type]],
                activity_id: e._id,
                data_type: e.type,
                send_time: e.updated_at
              });
            }
          }
        });
        this.data.emails.forEach((e) => {
          this.showingDetails.push({
            ...e,
            assigned_contacts: this.getContactList(
              e.assigned_contacts?.length ? e.assigned_contacts : e.contacts
            ),
            data_type: 'emails',
            send_time: e.updated_at
          });
        });
        this.showingDetails.sort((a, b) =>
          a.send_time > b.send_time ? -1 : 1
        );
        return;
      }
      if (tab.id === 'texts') {
        this.activities.forEach((e) => {
          if (
            (e.type === 'videos' || e.type === 'pdfs' || e.type === 'images') &&
            (!e.emails || !e.emails.length) &&
            (!e.texts || !e.texts.length)
          ) {
            if (
              e.content.indexOf('sms') !== -1 ||
              e.content.indexOf('text') !== -1
            ) {
              this.showingDetails.push({
                ...this.dataObj.materials[e[e.type]],
                activity_id: e._id,
                data_type: e.type,
                send_time: e.updated_at
              });
            }
          }
        });
        this.data.texts.forEach((e) => {
          this.showingDetails.push({
            ...e,
            data_type: 'texts',
            send_time: e.updated_at
          });
        });
        this.showingDetails.sort((a, b) =>
          a.send_time > b.send_time ? -1 : 1
        );
        return;
      }
    }
    this.changeDetector.detectChanges();
    localStorage.setCrmItem('dealSelectedTab', this.tab.id);
  }
  changeActivityTypes(tab: TabItem): void {
    this.activityType = tab;
  }
  changeSort(timeSort: any): void {
    this.showingDetails = [...this.data.tasks];
    this.selectedTimeSort = timeSort;

    let today;
    let weekDay;
    if (this.timezone.tz_name) {
      today = moment().tz(this.timezone.tz_name).startOf('day');
      weekDay = moment().tz(this.timezone.tz_name).startOf('week');
    } else {
      today = moment().utcOffset(this.timezone.zone).startOf('day');
      weekDay = moment().utcOffset(this.timezone.zone).startOf('week');
    }
    let start_date = today.clone();
    let end_date = today.clone();

    if (timeSort.id === 'all' || timeSort.id === 'future') {
      const last_recurrence = [];
      this.showingDetails = _.orderBy(
        this.showingDetails.filter((detail) => {
          if (detail.set_recurrence && !detail.due_date) {
            return false;
          }

          if (timeSort.id === 'future') {
            start_date = weekDay.clone().add(2, 'week');
            if (moment(detail.due_date).isBefore(start_date)) {
              return false;
            }
          }

          if (
            detail.status !== 0 ||
            !detail.set_recurrence ||
            !detail.parent_follow_up
          ) {
            return true;
          } else {
            if (last_recurrence.includes(detail.parent_follow_up)) {
              return false;
            } else {
              last_recurrence.push(detail.parent_follow_up);
              return true;
            }
          }
        }),
        ['due_date', 'updated_at'],
        ['asc', 'asc']
      );
      return;
    }

    if (timeSort.id === 'overdue') {
      this.showingDetails = _.orderBy(
        this.showingDetails,
        ['due_date', 'updated_at'],
        ['desc', 'desc']
      );
    } else {
      this.showingDetails = _.orderBy(
        this.showingDetails,
        ['due_date', 'updated_at'],
        ['asc', 'asc']
      );
    }
    switch (this.selectedTimeSort.id) {
      case 'overdue':
        end_date = today.clone();
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isBefore(end_date) &&
            !detail.status
        );
        break;
      case 'today':
        start_date = today.clone();
        end_date = today.clone().add(1, 'day');
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isSameOrAfter(start_date) &&
            moment(detail.due_date).isBefore(end_date)
        );
        break;
      case 'tomorrow':
        start_date = today.clone().add('day', 1);
        end_date = today.clone().add(2, 'day');
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isSameOrAfter(start_date) &&
            moment(detail.due_date).isBefore(end_date)
        );
        break;
      case 'this_week':
        start_date = weekDay.clone();
        end_date = weekDay.clone().add(1, 'week');
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isSameOrAfter(start_date) &&
            moment(detail.due_date).isBefore(end_date)
        );
        break;
      case 'next_week':
        start_date = weekDay.clone().add(1, 'week');
        end_date = weekDay.clone().add(2, 'week');
        this.showingDetails = this.showingDetails.filter(
          (detail) =>
            detail.due_date &&
            moment(detail.due_date).isSameOrAfter(start_date) &&
            moment(detail.due_date).isBefore(end_date)
        );
        break;
    }
  }

  showDetail(event: any): void {
    const target: HTMLElement = event.target as HTMLElement;
    const parent: HTMLElement = target.closest(
      '.main-history-item'
    ) as HTMLElement;
    if (parent) {
      parent.classList.add('expanded');
    }
  }
  hideDetail(event: any): void {
    const target: HTMLElement = event.target as HTMLElement;
    const parent: HTMLElement = target.closest(
      '.main-history-item'
    ) as HTMLElement;
    if (parent) {
      parent.classList.remove('expanded');
    }
  }

  updateNote(activity: any): void {
    if (!activity || !activity.activity_detail) {
      return;
    }
    const data = {
      note: activity.activity_detail,
      type: 'deal',
      deal_name: this.deal.main.title
    };
    this.dialog
      .open(NoteEditComponent, {
        width: '98vw',
        maxWidth: '394px',
        data
      })
      .afterClosed()
      .subscribe((note) => {
        if (note) {
          activity.activity_detail = note;
          if (this.detailData && this.detailData[note._id]) {
            this.detailData[note._id].content = note.content;
          }
          this.changeTab(this.tab);
        }
      });
  }

  updateNoteDetail(detail: any): void {
    if (!detail) {
      return;
    }
    const data = {
      note: detail,
      type: 'deal',
      deal_name: this.deal.main.title
    };
    this.dialog
      .open(NoteEditComponent, {
        width: '98vw',
        maxWidth: '394px',
        data
      })
      .afterClosed()
      .subscribe((note) => {
        if (note) {
          detail.content = note.content;
          this.activities.some((e) => {
            if (e.type !== 'notes') {
              return;
            }
            if (e.activity_detail && e.activity_detail._id === detail._id) {
              e.activity_detail.content = note.content;
              return true;
            }
          });
          this.arrangeActivity();
          if (this.detailData && this.detailData[note._id]) {
            this.detailData[note._id].content = note.content;
          }
          this.changeTab(this.tab);
        }
      });
  }

  deleteNote(activity: any): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Note',
          message: 'Are you sure to delete the note?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.dealsService
            .removeNote({ note: activity.activity_detail._id })
            .subscribe((res) => {
              if (res) {
                delete this.detailData[activity.activity_detail._id];
                _.pullAllBy(
                  this.showingDetails,
                  { _id: activity.activity_detail._id },
                  '_id'
                );
                this.activities.forEach((e) => {
                  const detail = e.activity_detail;
                  if (detail && detail._id === activity.activity_detail._id) {
                    delete e.activity_detail;
                  }
                });
                this.arrangeActivity();
              }
            });
        }
      });
  }
  deleteNoteDetail(detail: any): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Note',
          message: 'Are you sure to delete the note?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.dealsService
            .removeNote({ note: detail._id })
            .subscribe((res) => {
              if (res) {
                this.activities.forEach((e) => {
                  if (e.type !== 'notes') {
                    return;
                  }
                  if (
                    e.activity_detail &&
                    e.activity_detail._id === detail._id
                  ) {
                    e.activity_detail = null;
                    return true;
                  }
                });
                this.mainTimelines.forEach((e, i) => {
                  if (e.notes == detail._id) {
                    this.mainTimelines.splice(i, 1);
                  }
                });
                this.arrangeActivity();
                delete this.detailData[detail._id];
                const index = this.data.notes.findIndex(
                  (e) => e._id == detail._id
                );
                this.data.notes.splice(index, 1);
                this.changeTab(this.tab);
              }
            });
        }
      });
  }

  editTask(task: any): void {
    const data = { ...task };

    this.dialog
      .open(TaskEditComponent, {
        width: '98vw',
        maxWidth: '394px',
        data: {
          type: 'deal',
          deal: this.deal.main._id,
          task: new TaskDetail().deserialize(data)
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.status == 'deleted') {
            const taskId = task._id;
            const parent_follow_up =
              this.dataObj.tasks[taskId].parent_follow_up;
            let deleted;
            if (res.deleted_all && parent_follow_up) {
              deleted = _.remove(
                this.data.tasks,
                (e) =>
                  e.parent_follow_up === parent_follow_up &&
                  e.status === task.status
              );
            } else {
              deleted = _.remove(this.data.tasks, (e) => e._id === taskId);
            }

            deleted.forEach((e) => {
              delete this.dataObj.tasks[e._id];

              this.activities.forEach((ele) => {
                const detail = ele.activity_detail;
                if (detail && detail._id === e._id) {
                  delete ele.activity_detail;
                }
              });

              this.mainTimelines = _.pullAllBy(
                this.mainTimelines,
                [{ type: 'follow_ups', follow_ups: e._id }],
                'follow_ups'
              );
            });

            this.arrangeActivity();
            this.changeTab(this.tab);
          } else {
            this.loadActivity();
          }
        }
        // Update Activity
      });
  }

  completeTask(task: any): void {
    const data = {
      ...task
    };

    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Complete Task',
          message: 'Are you sure to complete the task?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Complete'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.dealsService
            .completeFollowUp({
              followup: data._id,
              deal: this.deal.main._id,
              status: 1
            })
            .subscribe((status) => {
              if (status) {
                this.reloadLatest(2);
              }
            });
        }
      });
  }

  archiveTask(activity): void {
    const taskId = activity._id;
    if (
      activity.set_recurrence &&
      activity.status !== 1 &&
      (this.selectedTimeSort.id === 'all' || this.tab.id == 'all')
    ) {
      this.dialog
        .open(TaskRecurringDialogComponent, {
          disableClose: true,
          data: {
            title: 'recurrence_task_delete'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (!confirm) {
            return;
          }
          const include_recurrence = confirm.type == 'all';

          this.dealsService
            .removeFollowUp({ followup: taskId, include_recurrence })
            .subscribe((status) => {
              if (status) {
                const parent_follow_up =
                  this.dataObj.tasks[taskId].parent_follow_up;
                if (include_recurrence && parent_follow_up) {
                  const deleted = _.remove(
                    this.data.tasks,
                    (e) =>
                      e.parent_follow_up === parent_follow_up &&
                      e.status === activity.status
                  );
                  deleted.forEach((e) => {
                    delete this.dataObj.tasks[e._id];
                    this.activities = _.pullAllBy(
                      this.activities,
                      [{ type: 'follow_ups', follow_ups: e._id }],
                      'follow_ups'
                    );
                    this.mainTimelines = _.pullAllBy(
                      this.mainTimelines,
                      [{ type: 'follow_ups', follow_ups: e._id }],
                      'follow_ups'
                    );
                  });
                } else {
                  _.remove(this.data.tasks, (e) => e._id === taskId);
                  delete this.dataObj.tasks[taskId];
                  this.groupActivities();
                }

                this.arrangeActivity();
                this.changeTab(this.tab);
              }
            });
        });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Delete Task',
            message: 'Are you sure to delete the task?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Delete',
            mode: 'warning'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) {
            this.dealsService
              .removeFollowUp({ followup: taskId })
              .subscribe((status) => {
                if (status) {
                  this.activities = _.pullAllBy(
                    this.activities,
                    [{ type: 'follow_ups', follow_ups: taskId }],
                    'follow_ups'
                  );
                  this.mainTimelines = _.pullAllBy(
                    this.mainTimelines,
                    [{ type: 'follow_ups', follow_ups: taskId }],
                    'follow_ups'
                  );
                  this.data.tasks = _.pullAllBy(
                    this.data.tasks,
                    [{ _id: taskId }],
                    '_id'
                  );
                  delete this.dataObj.tasks[taskId];
                  this.arrangeActivity();
                  this.changeTab(this.tab);
                }
              });
          }
        });
    }
  }

  editGroupCall(): void {}

  removeGroupCall(): void {}

  editAppointment(activity: any, isReal = false): void {
    let data;
    if (isReal) {
      data = {
        ...activity
      };
    } else {
      if (!activity || !activity.activity_detail) {
        return;
      }
      data = {
        ...activity.activity_detail
      };
    }

    const _formattedEvent = {
      appointment: data._id,
      title: data.title,
      start: new Date(data.due_start),
      end: new Date(data.due_end),
      meta: {
        contacts: data.contacts,
        calendar_id: data.calendar_id,
        description: data.description,
        location: data.location,
        type: data.type,
        guests: data.guests,
        event_id: data.event_id,
        recurrence: data.recurrence,
        recurrence_id: data.recurrence_id,
        is_organizer: data.is_organizer,
        organizer: data.organizer
      }
    };

    this.dialog
      .open(CalendarEventDialogComponent, {
        width: '98vw',
        maxWidth: '600px',
        data: {
          mode: 'dialog',
          deal: this.deal.main._id,
          event: _formattedEvent
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.reloadLatest(3);
        }
      });
  }

  removeAppointment(activity: any, isReal = false): void {
    let data;
    if (isReal) {
      data = {
        ...activity
      };
    } else {
      if (!activity || !activity.activity_detail) {
        return;
      }
      data = {
        ...activity.activity_detail
      };
    }

    const _formattedEvent = {
      appointment: data._id,
      title: data.title,
      start: new Date(data.due_start),
      end: new Date(data.due_end),
      meta: {
        contacts: data.contacts,
        calendar_id: data.calendar_id,
        description: data.description,
        location: data.location,
        type: data.type,
        guests: data.guests,
        event_id: data.event_id,
        recurrence: data.recurrence,
        recurrence_id: data.recurrence_id,
        is_organizer: data.is_organizer,
        organizer: data.organizer
      }
    };

    const calendars = this.appointmentService.subCalendars.getValue();
    const currentCalendar = calendars[_formattedEvent.meta.calendar_id];
    if (!currentCalendar) {
      // OPEN ALERT & CLOSE OVERLAY
      return;
    }
    const connected_email = currentCalendar.account;

    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete Appointment',
          message: 'Are you sure to delete the appointment?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Delete',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          this.dealsService
            .removeAppointment({
              connected_email,
              recurrence_id: _formattedEvent.meta.recurrence_id,
              event_id: _formattedEvent.meta.event_id,
              calendar_id: _formattedEvent.meta.calendar_id
            })
            .subscribe((status) => {
              if (status) {
                const mainIndex = this.mainTimelines.findIndex(
                  (item) => item._id === activity._id
                );
                if (mainIndex >= 0) {
                  this.mainTimelines.splice(mainIndex, 1);
                }
                const detailIndex = this.details['appointments'].findIndex(
                  (item) => item._id === activity.activity_detail._id
                );
                if (detailIndex >= 0) {
                  this.details['appointments'].splice(detailIndex, 1);
                }
                this.arrangeActivity();
                this.changeTab(this.tab);
              }
            });
        }
      });
  }

  arrangeActivity(): void {
    this.activityCounts = {
      all: 0,
      notes: 0,
      emails: 0,
      texts: 0,
      appointments: 0,
      phone_logs: 0,
      follow_ups: 0,
      deal: 0,
      automations: 0
    };
    if (this.mainTimelines.length > 0) {
      this.mainTimelines.forEach((activity) => {
        if (activity.type == 'notes') {
          this.activityCounts.notes++;
          this.activityCounts.all++;
        }
        if (
          activity.type == 'emails' ||
          activity.type == 'email_trackers' ||
          activity.type == 'videos' ||
          activity.type == 'video_trackers' ||
          activity.type == 'pdfs' ||
          activity.type == 'pdf_trackers' ||
          activity.type == 'images' ||
          activity.type == 'image_trackers'
        ) {
          this.activityCounts.emails++;
          this.activityCounts.all++;
        }
        if (activity.type == 'texts') {
          this.activityCounts.texts++;
          this.activityCounts.all++;
        }
        if (activity.type == 'appointments') {
          this.activityCounts.appointments++;
          this.activityCounts.all++;
        }
        if (activity.type == 'phone_logs') {
          this.activityCounts.phone_logs++;
          this.activityCounts.all++;
        }
        if (activity.type == 'follow_ups') {
          this.activityCounts.follow_ups++;
          this.activityCounts.all++;
        }
        if (activity.type == 'deals') {
          this.activityCounts.deal++;
          this.activityCounts.all++;
        }
        if (activity.type == 'automations') {
          this.activityCounts.automations++;
          this.activityCounts.all++;
        }
      });
    }
  }

  setLastActivity(): void {
    for (const activity of this.activities) {
      if (this.details[activity.type]) {
        const index = this.details[activity.type].findIndex(
          (item) => item._id === activity[activity.type]
        );
        if (index >= 0) {
          const trackerActivity = this.details[activity.type][index];
          const trackers = {};
          for (const key in trackerActivity) {
            if (key.indexOf('_tracker') >= 0) {
              trackers[key + 's'] = [trackerActivity[key]];
            }
          }
          if (Object.keys(trackers).length) {
            const { detailActivities, send_activities } =
              this.generateMaterialActivity(trackers);
            for (let i = 0; i < activity.assigned_contacts.length; i++) {
              const contact = activity.assigned_contacts[i];
              const send_activity = send_activities?.filter((e) => {
                contact?._id === e.contacts;
              });
              if (send_activity && send_activity.length) {
                contact['send_status'] = send_activity[0].status;
              } else {
                contact['send_status'] = 'failed';
              }
            }
            if (this.groupActions[activity.group_id]) {
              this.groupActions[activity.group_id] = [
                ...detailActivities,
                ...this.groupActions[activity.group_id]
              ];

              const actions = this.groupActions[activity.group_id].sort(
                (a, b) => (a.updated_at < b.updated_at ? 1 : -1)
              );

              this.mainTimelines.find(
                (e) => e.group_id == activity.group_id
              ).updated_at = actions[0].updated_at;

              this.groups.find(
                (e) => e.group == activity.group_id
              ).latest_time = actions[0].updated_at;
            }
          }
        }
      }
    }

    this.mainTimelines.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    this.groups.sort((a, b) => (a.latest_time < b.latest_time ? 1 : -1));
  }

  /**
   * Focus the cursor to the editor
   * @param formControl: Input Form Control
   */
  focusTitle(): void {
    this.titleEditable = true;
    this.dealTitle = this.deal.main.title;
    setTimeout(() => {
      if (this.element.nativeElement.querySelector('.title-input')) {
        this.element.nativeElement.querySelector('.title-input').focus();
      }
    }, 200);
  }
  checkAndSave(event): void {
    if (event.keyCode === 13) {
      if (this.deal.main.title === this.dealTitle) {
        this.titleEditable = false;
        return;
      }
      this.saving = true;
      this.saveSubscription && this.saveSubscription.unsubscribe();
      this.saveSubscription = this.dealsService
        .editDeal(this.dealId, {
          title: this.dealTitle,
          deal_stage: this.deal.main.deal_stage
        })
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.deal.main.title = this.dealTitle;
            this.pageStateRearrange(DEAL_ACTION.CHANGE_TITLE, this.dealTitle);
            this.titleEditable = false;
          }
        });
    }
  }

  /**************************************
   * Appointment Activity Relative Functions
   **************************************/
  getTime(start: any, end: any): any {
    const start_hour = new Date(start).getHours();
    const end_hour = new Date(end).getHours();
    const start_minute = new Date(start).getMinutes();
    const end_minute = new Date(end).getMinutes();
    const duration = end_hour - start_hour + (end_minute - start_minute) / 60;
    const durationTime = this.durations.filter(
      (time) => time.value == duration
    );
    if (durationTime?.length > 0) {
      return durationTime[0].text;
    }
  }

  convertContent(content = ''): any {
    const htmlContent = content.split('<div>');
    let convertString = '';
    htmlContent.forEach((html) => {
      if (html.indexOf('material-object') !== -1) {
        convertString = convertString + html.match('<a(.*)a>')[0];
      }
    });
    return convertString;
  }

  convertLandingPageContent(content = ''): any {
    const htmlContent = content.split('<div>');
    let convertString = '';
    htmlContent.forEach((html) => {
      if (html.indexOf('landing-page-object') !== -1) {
        convertString = convertString + html.match('<a(.*)a>')[0];
      }
    });
    return convertString;
  }

  editAdditional($event): void {
    if ($event) {
      $event.stopPropagation();
      $event.preventDefault();
    }
    this.dialog
      .open(AdditionalEditComponent, {
        width: '98vw',
        maxWidth: '600px',
        data: {
          type: 'deal',
          deal: {
            ...this.deal.main
          }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // this.toast.success('Successfully updated additional information.');
          this.deal.main.additional_field = {};
          for (const field of res) {
            this.deal.main.additional_field[field.name] = field.value;
          }
        }
      });
  }

  isEmptyObject(obj): boolean {
    if (obj) {
      return Object.keys(obj).length === 0;
    }
    return true;
  }

  addAdditionalFields(): void {
    this.dialog
      .open(AdditionalFieldsComponent, {
        maxWidth: '480px',
        width: '96vw',
        disableClose: true,
        data: {
          additional_field: { ...this.deal.main.additional_field }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.deal.main.additional_field = { ...res };
          this.updateSubscription = this.dealsService
            .editDeal(this.deal.main._id, this.deal.main)
            .subscribe((deal) => {
              if (deal) {
              }
            });
        }
      });
  }

  removeActivity(activity): void {}

  reloadLatest(count = 20): void {
    this.loading = true;
    this.dGroups.splice(0);
    this.reloadSubscription && this.reloadSubscription.unsubscribe();
    this.reloadSubscription = this.dealsService
      .getActivity({
        deal: this.dealId,
        count: count || 20
      })
      .subscribe((res) => {
        this.loadTasks();
        this.loading = false;
        let activities = res['activity'].map((e) =>
          new DetailActivity().deserialize(e)
        );

        activities.sort((a, b) => {
          return a.updated_at > b.updated_at ? 1 : -1;
        });

        for (let i = 0; i < activities.length; i++) {
          const first_activty = activities[i];
          if (first_activty.type !== 'deals') continue;
          if (first_activty.content === 'added contact') continue;
          const time = moment(first_activty.updated_at);
          for (let j = i + 1; j < activities.length; j++) {
            const second_activty = activities[j];
            if (second_activty.type !== 'deals') continue;
            if (second_activty.content === 'added contact') continue;
            const time2 = moment(second_activty.updated_at);
            if (time2.diff(time, 'seconds') < 1) {
              if (!first_activty.sub_activities)
                first_activty.sub_activities = [];
              first_activty.sub_activities.push(second_activty);
              activities.splice(j, 1);
              j--;
            }
          }
        }

        const activityDetails = res['details'];

        for (const activity of activities) {
          if (activity.type === 'notes') {
            const index = activityDetails['notes'].findIndex(
              (item) => item._id === activity['notes']
            );
            if (index >= 0) {
              activity['assigned_contacts'] = this.getContactList(
                activityDetails['notes'][index]['assigned_contacts']
              );
              activity['activity_detail'] = activityDetails['notes'][index];
            }
          }
          if (activity.type === 'texts') {
            const index = activityDetails['texts'].findIndex(
              (item) => item._id === activity['texts']
            );
            if (index >= 0) {
              activity['assigned_contacts'] = this.getContactList(
                activityDetails['texts'][index]['contacts'].length
                  ? activityDetails['texts'][index]['contacts']
                  : activityDetails['texts'][index]['assigned_contacts']
              );
              activity['activity_detail'] = activityDetails['texts'][index];
            }
          }

          if (activity.type === 'emails') {
            const index = activityDetails['emails'].findIndex(
              (item) => item._id === activity['emails']
            );
            if (index >= 0) {
              activity['assigned_contacts'] = this.getContactList(
                activityDetails['emails'][index]['assigned_contacts']?.length
                  ? activityDetails['emails'][index]['assigned_contacts']
                  : activityDetails['emails'][index]['contacts']
              );
              activity['activity_detail'] = activityDetails['emails'][index];
            }
          }

          if (activity.type === 'follow_ups') {
            const index = activityDetails['tasks'].findIndex(
              (item) => item._id === activity['follow_ups']
            );
            if (index >= 0) {
              activity['assigned_contacts'] = this.getContactList(
                activityDetails['tasks'][index]['assigned_contacts']
              );
              activity['activity_detail'] = activityDetails['tasks'][index];
            }
          }

          if (activity.type === 'phone_logs') {
            const index = activityDetails['phone_logs'].findIndex(
              (item) => item._id === activity['phone_logs']
            );
            if (index >= 0) {
              activity['assigned_contacts'] = this.getContactInfo(
                activityDetails['phone_logs'][index]['assigned_contacts']
              );
              activity['activity_detail'] =
                activityDetails['phone_logs'][index];
            }
          }

          if (activity.type === 'appointments') {
            const index = activityDetails['appointments'].findIndex(
              (item) => item._id === activity['appointments']
            );
            if (index >= 0) {
              activity['assigned_contacts'] = this.getContactList(
                activityDetails['appointments'][index]['contacts']
              );
              activity['activity_detail'] =
                activityDetails['appointments'][index];
            }
          }
        }

        const details = res['details'];
        let materials = details['materials'] || [];
        let notes = details['notes'] || [];
        let emails = details['emails'] || [];
        let texts = details['texts'] || [];
        let appointments = details['appointments'] || [];
        let tasks = details['tasks'] || [];
        let phone_logs = details['phone_logs'] || [];
        let automations = details['automations'] || [];
        const sub_calls = details['sub_calls'] || [];

        this.details['materials'] = [...materials, ...this.data.materials];
        this.details['notes'] = [...notes, ...this.data.notes];
        this.details['emails'] = [...emails, ...this.data.emails];
        this.details['texts'] = [...texts, ...this.data.texts];
        this.details['appointments'] = [
          ...appointments,
          ...this.data.appointments
        ];
        this.details['tasks'] = [...tasks, ...this.data.tasks];
        this.details['phone_logs'] = [...phone_logs, ...this.data.phone_logs];
        this.details['tasks'] = [...tasks, ...this.data.tasks];
        this.details['automations'] = [
          ...automations,
          ...this.data.automations
        ];
        this.details['sub_calls'] = details['sub_calls'] || [];

        if (tasks.length) {
          for (const task of tasks) {
            if (task.assigned_contacts && task.assigned_contacts.length > 0) {
              task.assigned_contacts = this.getContactList(
                task.assigned_contacts
              );
            }
          }
        }

        const trackers = details['trackers'] || {};
        activities = [...activities, ...this.activities];
        activities.sort((a, b) => (a.updated_at > b.updated_at ? 1 : -1));
        materials = [...materials, ...this.data.materials];
        notes = [...notes, ...this.data.notes];
        emails = [...emails, ...this.data.emails];
        texts = [...texts, ...this.data.texts];
        appointments = [...appointments, ...this.data.appointments];
        tasks = [...tasks, ...this.data.tasks];
        phone_logs = [...phone_logs, ...this.data.phone_logs];
        automations = [...automations, ...this.data.automations];

        this.activities = _.uniqBy(activities, '_id');
        this.data.materials = _.uniqBy(materials, '_id');
        this.data.notes = _.uniqBy(notes, '_id');
        this.data.emails = _.uniqBy(emails, '_id');
        this.data.texts = _.uniqBy(texts, '_id');
        this.data.appointments = _.uniqBy(appointments, '_id');
        this.data.tasks = _.uniqBy(tasks, '_id');
        this.data.phone_logs = _.uniqBy(phone_logs, '_id');
        this.data.automations = _.uniqBy(automations, '_id');
        for (const key in trackers) {
          if (this.trackers[key]) {
            for (const field in trackers[key]) {
              let originalTrackers = this.trackers[key][field];
              const incomingTrackers = trackers[key][field];
              originalTrackers = [...incomingTrackers, ...originalTrackers];
              originalTrackers = _.uniqBy(originalTrackers, '_id');
              this.trackers[key][field] = originalTrackers;
            }
          } else {
            this.trackers[key] = trackers[key];
          }
        }
        this.groups = [];
        this.getTimeLines();
        this.groupActivities();
        this.arrangeActivity();
        this.setLastActivity();
        this.fetchAutomationActivities();

        for (const key in this.data) {
          if (key !== 'materials') {
            this.data[key].forEach((e) => {
              this.dataObj[key][e._id] = e;
            });
          } else {
            this.data[key].forEach((e) => {
              e.material_type = 'video';
              if (e.type) {
                if (e.type.indexOf('pdf') !== -1) {
                  e.material_type = 'pdf';
                } else if (e.type.indexOf('image') !== -1) {
                  e.material_type = 'image';
                }
              }
              this.dataObj[key][e._id] = e;
            });
          }
        }

        (this.details['sub_calls'] || []).forEach((call) => {
          const key = call.shared_log;
          if (!this.sub_calls[key] || !this.sub_calls[key].length) {
            this.sub_calls[key] = [call];
          } else {
            this.sub_calls[key].push(call);
          }
        });
        for (const key in this.sub_calls) {
          this.sub_calls[key] = _.uniqBy(this.sub_calls[key], '_id');
        }

        if (this.noteActivityItem && this.noteActivityItem['_results']) {
          for (const noteActivityItem of this.noteActivityItem['_results']) {
            noteActivityItem.panel.close();
          }
        }

        setTimeout(() => {
          this.changeTab(this.tab);
        }, 500);
      });
    this.mainTimelines.forEach((e) => (e.loadExpand = false));
  }

  routerHandle(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {})
      )
      .subscribe(() => {
        if (this.emailDialog) {
          setTimeout(() => {
            const draftData = this.storeService.emailDealDraft.getValue();
            this.saveEmailDraft(draftData);
          }, 1000);

          const dialogs = this.storeService.openedDraftDialogs.getValue();
          if (dialogs && dialogs.length > 0) {
            const index = dialogs.findIndex(
              (item) => item.id === this.emailDialog.id
            );
            if (index >= 0) {
              dialogs.splice(index, 1);
              this.storeService.openedDraftDialogs.next([...dialogs]);
            }
          }

          this.emailDialog.close();
          this.emailDialog = null;
        }
        if (this.textDialog) {
          setTimeout(() => {
            const draftData = this.storeService.textDealDraft.getValue();
            this.saveTextDraft(draftData);
          }, 1000);

          const dialogs = this.storeService.openedDraftDialogs.getValue();
          if (dialogs && dialogs.length > 0) {
            const index = dialogs.findIndex(
              (item) => item.id === this.textDialog.id
            );
            if (index >= 0) {
              dialogs.splice(index, 1);
              this.storeService.openedDraftDialogs.next([...dialogs]);
            }
          }

          this.textDialog.close();
          this.textDialog = null;
        }
      });
  }

  saveEmailDraft(data): void {
    if (this.draftEmail && this.draftEmail.user) {
      if (!data.content && !data.subject) {
        this.removeEmailDraftSubscription && this.removeEmailDraftSubscription;
        this.removeEmailDraftSubscription = this.emailService
          .removeDraft(this.draftEmail._id)
          .subscribe((res) => {
            if (res) {
              this.draftEmail = null;
            }
          });
      } else {
        if (
          data.content !== this.draftEmail.content ||
          data.subject !== this.draftEmail.subject
        ) {
          this.updateEmailDraftSubscription &&
            this.updateEmailDraftSubscription;
          this.updateEmailDraftSubscription = this.emailService
            .updateDraft(this.draftEmail._id, data)
            .subscribe((res) => {
              if (res) {
                this.draftEmail = {
                  ...this.draftEmail,
                  ...data
                };
              }
            });
        }
      }
    } else {
      if (!data.content && !data.subject) {
        return;
      }
      const defaultEmail = this.userService.email.getValue();
      if (defaultEmail) {
        if (
          data.content === defaultEmail.content.replace(/^\s+|\s+$/g, '') &&
          data.subject === defaultEmail.subject
        ) {
          return;
        }
      }

      this.createEmailDraftSubscription &&
        this.createEmailDraftSubscription.unsubscribe();
      this.createEmailDraftSubscription = this.emailService
        .createDraft(data)
        .subscribe((res) => {
          if (res) {
            this.draftEmail = res;
          }
        });
    }
  }

  saveTextDraft(data): void {
    if (this.draftText && this.draftText.user) {
      if (!data.content) {
        this.removeTextDraftSubscription && this.removeTextDraftSubscription;
        this.removeTextDraftSubscription = this.emailService
          .removeDraft(this.draftText._id)
          .subscribe((res) => {
            if (res) {
              this.draftText = null;
            }
          });
      } else {
        if (data.content !== this.draftText.content) {
          this.updateTextDraftSubscription && this.updateTextDraftSubscription;
          this.updateTextDraftSubscription = this.emailService
            .updateDraft(this.draftText._id, data)
            .subscribe((res) => {
              if (res) {
                this.draftText = {
                  ...this.draftText,
                  ...data
                };
              }
            });
        }
      }
    } else {
      if (!data.content) {
        return;
      }
      const defaultText = this.userService.sms.getValue();
      if (defaultText) {
        if (data.content === defaultText.content.replace(/^\s+|\s+$/g, '')) {
          return;
        }
      }

      this.createTextDraftSubscription &&
        this.createTextDraftSubscription.unsubscribe();
      this.createTextDraftSubscription = this.emailService
        .createDraft(data)
        .subscribe((res) => {
          if (res) {
            this.draftText = res;
          }
        });
    }
  }

  getActivityIcon(group_id, activity): string {
    if (this.groupActions[group_id] && this.groupActions[group_id].length > 0) {
      const type = this.groupActions[group_id][0].type;
      return type + ' ' + this.groupActions[group_id][0][type]?.type;
    }
    return activity.type + ' ' + activity[activity.type]?.type;
  }

  getActivityLabel(group_id, activity): string {
    if (this.groupActions[group_id] && this.groupActions[group_id].length > 0) {
      const type = this.groupActions[group_id][0].type;
      if (type) {
        if (this.groupActions[group_id][0][type]?.type) {
          return this.getActivityContent(
            type,
            this.groupActions[group_id][0][type]?.type
          );
        } else {
          return this.groupActions[group_id][0].content;
        }
      }
    }
    return activity.content;
  }

  getActivityFromDetail(detail): any {
    let type = '';
    for (const key in this.details) {
      if (this.details[key] && this.details[key].length > 0) {
        const index = this.details[key].findIndex(
          (item) => item._id === detail._id
        );
        if (index >= 0) {
          type = key;
          break;
        }
      }
    }
    const index = this.activities.findIndex(
      (item) => item[type] === detail._id
    );
    if (index >= 0) {
      return this.activities[index];
    }
    return detail;
  }

  /*****************************************
   * Automation Select & Display
   *****************************************/
  /**
   * Select Automation To assign
   * @param evt :Automation
   */
  selectAutomation(evt: Automation): void {
    if (evt) this.selectedAutomation = evt._id;
  }

  assignAutomation(): void {
    if (!this.selectedAutomation) {
      return;
    }
    const contactIds = [];
    for (const contact of this.deal.contacts) {
      contactIds.push(contact._id);
    }
    if (this.allDataSource.data.length) {
      const flag = this.getConfirmedAutomationBusinessHour();
      if (!flag && this.isBusinessTime) {
        this.dialog
          .open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            data: {
              title: 'Reassign new automation',
              message:
                'Are you sure to stop the current automation and start new automation?',
              cancelLabel: 'Cancel',
              confirmLabel: 'Assign'
            }
          })
          .afterClosed()
          .subscribe((status) => {
            if (status) {
              this.dialog
                .open(ConfirmBusinessComponent, {
                  maxWidth: '500px',
                  width: '96vw',
                  data: {
                    title: 'Confirm',
                    message:
                      'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
                    cancelLabel: 'Cancel',
                    confirmLabel: 'Ok'
                  }
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res) {
                    if (res.notShow) {
                      this.updateConfirmAutomationBusinessHour();
                    }
                    this._assignAutomation();
                  }
                });
            }
          });
      } else {
        this.dialog
          .open(ConfirmComponent, {
            maxWidth: '400px',
            width: '96vw',
            data: {
              title: 'Reassign new automation',
              message:
                'Are you sure to stop the current automation and start new automation?',
              cancelLabel: 'Cancel',
              confirmLabel: 'Assign'
            }
          })
          .afterClosed()
          .subscribe((status) => {
            if (status) {
              this._assignAutomation();
            }
          });
      }
    } else {
      const flag = this.getConfirmedAutomationBusinessHour();
      if (!flag) {
        this.dialog
          .open(ConfirmBusinessComponent, {
            maxWidth: '500px',
            width: '96vw',
            data: {
              title: 'Confirm Business Hour',
              message:
                'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
              cancelLabel: 'Cancel',
              confirmLabel: 'Ok'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              if (res.notShow) {
                this.updateConfirmAutomationBusinessHour();
              }
              this._assignAutomation();
            }
          });
      } else {
        this._assignAutomation();
      }
    }
  }

  _assignAutomation(): void {
    this.assigning = true;
    this.assignSubscription && this.assignSubscription.unsubscribe();
    this.automationService
      .bulkAssign(this.selectedAutomation, null, [this.dealId])
      .subscribe((res) => {
        this.assigning = false;
        this.getTimeLines();
        this.reloadLatest(2);
        this.automationUnAssigned = false;
      });
  }

  closeAutomation(): void {
    if (!this.allDataSource.data.length) {
      return;
    }
    this.dialog
      .open(ConfirmComponent, {
        maxWidth: '400px',
        width: '96vw',
        data: {
          title: 'Unassign automation',
          message: 'Are you sure to stop the automation?',
          cancelLabel: 'Cancel',
          confirmLabel: 'Unassign'
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.canceling = true;
          this.cancelSubscription && this.cancelSubscription.unsubscribe();
          this.automationService
            .unAssign(this.automation_line._id)
            .subscribe((res) => {
              this.canceling = false;
              if (res) {
                this.getTimeLines();
                this.reloadLatest(2);
                this.automationUnAssigned = true;
              }
            });
        }
      });
  }

  easyView(node: any, origin: any, content: any): void {
    this.overlayService
      .open(origin, content, this.viewContainerRef, 'automation-timeline', {
        data: node
      })
      .subscribe((res) => {
        if (res) {
          if (res.type === 'paused') {
            this.pauseTimeline(node);
          } else if (res.type === 'forward') {
            this.forwardTimeline(node);
          } else if (res.type === 'restart') {
            this.resetTimelineDueDate(node, 'restart');
          } else if (res.type === 'revise') {
            this.resetTimelineDueDate(node, 'revise');
          }
        }
      });
  }
  forwardTimeline(node): void {
    this.updatingTimeline = node;
    this.isUpdatingTimeline = true;
    this.changeDetector.markForCheck();
    const data = {
      ids: [node._id],
      due_date: moment().add(1, 'minutes'),
      disable_business_time: true
    };
    this.updateTimelineSubscription?.unsubscribe();
    this.updateTimelineSubscription = this.automationService
      .updateTimelineStatus(data)
      .pipe(
        finalize(() => {
          this.isUpdatingTimeline = false;
          this.changeDetector.markForCheck();
        })
      )
      .subscribe((result) => {
        if (result) {
          node = { ...result.data[0] };
          this.updateActionTimeline(node);
          this.timeLineArrangement();
        }
      });
  }

  showFullAutomation(): void {
    this.dialog.open(AutomationShowFullComponent, {
      position: { top: '100px' },
      width: '98vw',
      maxWidth: '700px',
      height: 'calc(60vh + 70px)',
      panelClass: [
        'main-automation',
        `main-${this.automation_line?.automation}`,
        'active'
      ],
      data: {
        id: this.automation_line?._id,
        automation: this.automation_line,
        timelines: this.timeLines,
        type: 'deal'
      }
    });
  }

  loadTasks(): void {
    this.dealsService.loadTasks(this.dealId).subscribe((res) => {
      let tasks = [];
      let automations = [];
      const automationDic = {};
      res.forEach((e) => {
        Object.keys(e).forEach((key) => {
          if (key !== 'automations') {
            tasks = [...tasks, ...e[key]];
          } else {
            automations = e[key];
          }
        });
      });

      automations.forEach((e) => {
        automationDic[e._id] = e;
      });
      this.tasks = tasks;
      this.tasks.forEach((e) => {
        this.mores[e._id] = false;
        if (e.campaign) {
          e.task_type = 'campaign';
          e.task_original_type = 'campaign';
        } else if (e.type === 'assign_automation') {
          e.task_type = 'Assign Automation';
          e.task_original_type = 'automation';
          const automation_id = e.action.automation_id || e.action.automation;
          if (automation_id && automationDic[automation_id]) {
            e.details = automationDic[automation_id];
          }
        } else if (e.type === 'send_email') {
          e.task_original_type = 'email';
          if (e.set_recurrence && e.recurrence_mode) {
            e.task_type = e.recurrence_mode + ' recurring email';
          } else if (e.set_recurrence === false) {
            e.task_type = 'scheduled email';
          } else {
            e.task_type = 'Email';
          }
        } else if (e.type === 'send_text') {
          e.task_original_type = 'text';
          if (e.set_recurrence && e.recurrence_mode) {
            e.task_type = e.recurrence_mode + ' recurring text';
          } else if (e.set_recurrence === false) {
            e.task_type = 'scheduled text';
          }
        }
      });
      if (this.tasks.length) {
        this.changeTabs(
          {
            icon: '',
            label: 'TO-DO',
            id: 'tasks'
          },
          'insert'
        );
      }
    });
  }

  getFormattedDate(dateString: string): string {
    let returnDateString = '';
    if (dateString) {
      const returnDate = new Date(dateString);
      const now = new Date();
      const thisYear = now.getFullYear().toString();
      const dateYear = moment(returnDate).format('YYYY');
      if (thisYear !== dateYear) {
        returnDateString = moment(returnDate).format('MMM DD,YYYY, hh:mm A');
      } else {
        returnDateString = moment(returnDate).format('MMM DD, hh:mm A');
      }
    }
    return returnDateString;
  }

  getTimeLines(): void {
    this.dealsService.getTimeLines(this.dealId).subscribe((res) => {
      if (res) {
        this.timeLines = res['time_lines'];
        this.automation = res['automation'];
        this.automation_line = res['automation_line'];
        this.timeLineArrangement();
        this.generateTimelineActivity();
      }
    });
  }

  remakeTimeLines(): void {
    if (this.timeLines && this.timeLines.length > 0) {
      for (const e of this.timeLines) {
        if (e.action) {
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
          e.action.type = type;
          e.action.label = this.ActionName[type];
        }
      }
    }
  }

  timeLineArrangement(): any {
    this.allDataSource.data = [];
    if (!this.timeLines || this.timeLines.length === 0) {
      this.changeDetector.markForCheck();
      this.automationUnAssigned = true;
      return;
    }

    this.remakeTimeLines();
    let rootNode = new Timeline();

    // get root node in timelines
    let rootNodeId = this.timeLines[0].parent_ref;
    if (rootNodeId !== 'a_10000') {
      while (true) {
        const rootIndex = this.timeLines.findIndex(
          (item) => item.ref === rootNodeId
        );
        if (rootIndex >= 0) {
          rootNodeId = this.timeLines[rootIndex].parent_ref;
        } else {
          break;
        }
      }
    }

    rootNode = Object.assign({}, this.timeLines[rootNodeId]);

    if (rootNodeId === 'a_10000') {
      // add root node.
      rootNode.ref = 'a_10000';
      rootNode.parent_ref = '0';
      rootNode.root = true;

      this.timeLines.unshift(rootNode);
      this.allDataSource.data = listToTree(
        this.timeLines,
        rootNode.parent_ref,
        'deal'
      );
    } else {
      this.allDataSource.data = listToTree(this.timeLines, rootNodeId, 'deal');
    }

    let root = null;
    if (this.allDataSource.data?.length === 0) {
      this.changeDetector.markForCheck();
      this.automationUnAssigned = true;
      return;
    }
    // if (this.allDataSource.data[0]?.status == 'completed') {
    //   root = JSON.parse(JSON.stringify(this.allDataSource.data[0]));
    // } else {
    //   return;
    // }
    root = JSON.parse(JSON.stringify(this.allDataSource.data[0]));

    const rootDealNode = { ...root };
    this.activeRoot = null;
    this.activePrevRoot = null;

    // get status = 'active' first action and set it to root
    this.getActiveRoot(rootDealNode);
    // if nothing status = 'active', get status = 'checking' first action and set it to root
    if (!this.activeRoot) {
      this.getCheckingRoot(rootDealNode);
    }
    let activeRoot = null;
    if (this.activeRoot) {
      activeRoot = { ...this.activeRoot };
    } else {
      activeRoot = { ...root };
    }

    const activePrevRoot = { ...this.activePrevRoot };
    if (activePrevRoot && Object.keys(activePrevRoot).length > 0) {
      activeRoot = { ...activePrevRoot };
    }

    if (activeRoot) {
      for (const firstChild of activeRoot.children)
        for (const secondChild of firstChild.children)
          secondChild.children = [];

      this.dataSource = new MatTreeNestedDataSource<any>();
      this.dataSource.data.push(activeRoot);
    }
    this.changeDetector.markForCheck();
  }

  getActiveRoot(root, parent = null): void {
    if (
      root.status === 'progress' ||
      root.status === 'active' ||
      root.status === 'paused' ||
      root.status === 'executed' ||
      root.status === 'checking'
    ) {
      if (this.activeRoot) {
        if (new Date(this.activeRoot.updated_at) < new Date(root.updated_at)) {
          this.activeRoot = { ...root };
          if (parent) {
            this.activePrevRoot = { ...parent };
          }
        }
      } else {
        this.activeRoot = { ...root };
        if (parent) {
          this.activePrevRoot = { ...parent };
        }
      }
    }
    if (root.children && root.children.length > 0) {
      for (const child of root.children) {
        this.getActiveRoot(child, root);
      }
    }
  }

  getCheckingRoot(root, parent = null): void {
    if (root.status === 'checking') {
      if (this.activeRoot) {
        if (new Date(this.activeRoot.updated_at) < new Date(root.updated_at)) {
          this.activeRoot = { ...root };
          if (parent) {
            this.activePrevRoot = { ...parent };
          }
        }
      } else {
        this.activeRoot = { ...root };
        if (parent) {
          this.activePrevRoot = { ...parent };
        }
      }
    }
    if (root.children && root.children.length > 0) {
      for (const child of root.children) {
        this.getCheckingRoot(child, root);
      }
    }
  }

  activeActionsCount(): number {
    return this.timeLines.filter((item) => item.status === 'active').length;
  }

  isBranchNode(node): boolean {
    if (node && this.timeLines.length > 0) {
      const siblingNodes = [];
      for (const item of this.timeLines) {
        if (item.parent_ref === node.parent_ref) {
          siblingNodes.push(item);
        }
      }
      if (siblingNodes.length >= 2 && !node.condition) {
        return true;
      }
    }
    return false;
  }

  setPrimaryContact(contact): void {
    if (contact) {
      this.setPrimaryContactSubscription &&
        this.setPrimaryContactSubscription.unsubscribe();
      this.dealsService
        .setPrimaryContact(this.dealId, contact._id)
        .subscribe((res) => {
          if (res) {
            this.deal.primary_contact = contact._id;
          }
          const _primary = {
            _id: contact?._id,
            email: contact?.email,
            first_name: contact?.first_name,
            last_name: contact?.last_name
          };
          this.pageStateRearrange(DEAL_ACTION.SET_PRIMARY, _primary);
        });
    }
  }

  isPrimaryContact(contact): boolean {
    if (this.deal.primary_contact && contact) {
      if (this.deal.primary_contact === contact._id) {
        if (this.deal.contacts.length === 1) {
          this.contactMainInfo = contact;
        }
        return true;
      }
    }
    return false;
  }

  generateTimelineActivity(): void {
    if (!this.timeLines) {
      return;
    }
    this.timelineActivities = [];
    if (this.timeLines && this.timeLines.length > 0) {
      const dealAutomation = this.automation;
      const activeActions = this.timeLines.filter(
        (item) => item.status === 'active'
      );
      if (activeActions.length > 0) {
        const actions = [];
        for (const activeAction of activeActions) {
          const actionTime = moment(activeAction.due_date).format(
            'YYYY-MM-DD HH:mm a'
          );
          actions.push({
            label: activeAction.action?.label,
            time: actionTime
          });
        }
        this.timelineActivities.push({
          type: 'Deal Automation',
          automation: dealAutomation,
          actions: actions
        });
      }
    }
    if (this.timelineActivities.length > 0) {
      this.changeTabs(
        {
          icon: '',
          label: 'TO-DO',
          id: 'tasks',
          feature: USER_FEATURES.AUTOMATION
        },
        'insert'
      );
    }
  }

  showDetailTimeline(timeline): void {
    this.dialog.open(AutomationShowFullComponent, {
      position: { top: '100px' },
      width: '98vw',
      maxWidth: '700px',
      height: 'calc(60vh + 70px)',
      data: {
        id: this.automation._id,
        automation: this.automation,
        timelines: this.timeLines,
        type: 'deal'
      }
    });
  }

  /**
   * Change the tabs
   * @param tab : Tab Item
   * @param mode : 'remove' | 'insert'
   */
  changeTabs(tab: TabItem, mode: string): void {
    const index = this.tabs.findIndex((e) => e.id === tab.id);
    if (mode === 'insert') {
      if (index === -1) {
        this.tabs.push(tab);
      }
    } else if (mode === 'remove') {
      if (index !== -1) {
        this.tabs.splice(index, 1);
      }
    }
  }

  getFollowUp(taskId) {
    if (this.dataObj.tasks[taskId] && this.dataObj.tasks[taskId].due_date) {
      return this.dataObj.tasks[taskId];
    } else {
      const recurrences = this.data.tasks
        .filter((e) => e.parent_follow_up === taskId && e.status !== 1)
        .sort((a, b) =>
          moment(a.due_date).isSameOrBefore(b.due_date) ? -1 : 1
        );

      if (recurrences.length) {
        return recurrences[0];
      } else {
        return null;
      }
    }
  }

  clickExpand() {
    this.showAll = !this.showAll;
    if (this.showAll) {
      this.showText = 'Show only 5 contacts';
      this.sliceNum = this.deal.contacts.length;
    } else {
      this.showText = 'Show all';
      this.sliceNum = 5;
    }
  }

  getAutomationActivityTitle(activity): string {
    const assignAutomationIndex = this.activities.findIndex(
      (item) =>
        item.automations === activity.automations &&
        (item.content === 'assigned automation' ||
          item.content === 'moved to next automation')
    );
    if (assignAutomationIndex >= 0) {
      const parentId =
        this.activities[assignAutomationIndex].parent_automations;
      if (parentId) {
        const index = this.details['automations'].findIndex(
          (item) => item._id === parentId
        );
        return this.details['automations'][index].title;
      }
    }
    return '';
  }

  getSubAutomationActivity(activity): any {
    if (activity.content === 'assigned automation') {
      return null;
    }
    const assignAutomationIndex = this.activities.findIndex(
      (item) =>
        item.automations === activity.automations &&
        item.content === 'assigned automation'
    );
    if (assignAutomationIndex >= 0) {
      return this.activities[assignAutomationIndex];
    }
    return null;
  }

  showDetailCompletedAutomation(activity): void {
    if (
      activity.content === 'assigned automation' ||
      activity.content === 'moved to next automation'
    ) {
      this.dialog.open(AutomationShowFullComponent, {
        position: { top: '100px' },
        width: '98vw',
        maxWidth: '700px',
        height: 'calc(60vh + 70px)',
        panelClass: [
          'main-automation',
          `main-${this.automation_line?.automation}`,
          'active'
        ],
        data: {
          id: this.automation_line?._id,
          automation: this.automation_line,
          timelines: this.timeLines,
          type: 'deal'
        }
      });
    } else {
      this.getAutomationDetailSubscription &&
        this.getAutomationDetailSubscription.unsubscribe();
      this.getAutomationDetailSubscription = this.automationService
        .getAutomationLine(activity?.automation_lines)
        .subscribe((res) => {
          this.dialog.open(AutomationShowFullComponent, {
            position: { top: '100px' },
            width: '98vw',
            maxWidth: '700px',
            height: 'calc(60vh + 70px)',
            panelClass: [
              'main-automation',
              `main-${res?.automation_line?.automation}`,
              'active'
            ],
            data: {
              id: activity.automation,
              automation: res.automation_line,
              timelines: res.automation_line.automations,
              type: 'deal',
              isCompleted: true
            }
          });
        });
    }
  }

  getConfirmedAutomationBusinessHour(): boolean {
    const garbage = this.userService.garbage.getValue();
    if (garbage.confirm_message) {
      return garbage.confirm_message.automation_business_hour;
    }
    return false;
  }

  updateConfirmAutomationBusinessHour(): void {
    const garbage = this.userService.garbage.getValue();
    const data = {
      ...garbage.confirm_message,
      automation_business_hour: true
    };
    this.userService.updateGarbage({ confirm_message: data }).subscribe(() => {
      this.userService.updateGarbageImpl({
        confirm_message: data
      });
    });
  }

  updateActionTimeline(timeline): void {
    if (this.timeLines.length > 0) {
      const index = this.timeLines.findIndex(
        (item) => item._id === timeline._id
      );
      if (index >= 0) {
        this.timeLines.splice(index, 1, timeline);
      }
    }
  }

  pauseTimeline(node): void {
    this.updatingTimeline = node;
    this.dialog
      .open(ConfirmComponent, {
        data: {
          title: 'Pause Automation',
          message: 'Are you sure to pause this upcoming action indefinitely?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.isUpdatingTimeline = true;
          const data = {
            ids: [node._id],
            status: 'paused'
          };
          this.updateTimelineSubscription?.unsubscribe();
          this.updateTimelineSubscription = this.automationService
            .updateTimelineStatus(data)
            .pipe(
              finalize(() => {
                this.isUpdatingTimeline = false;
                this.changeDetector.markForCheck();
              })
            )
            .subscribe((result) => {
              if (result) {
                node = { ...result.data[0] };
                this.updateActionTimeline(node);
                this.timeLineArrangement();
              }
            });
        }
      });
  }

  resetTimelineDueDate(node, type): void {
    this.dialog
      .open(ResetDateTimeComponent, {
        ...DialogSettings.NOTE,
        data: {
          title: 'Set Date&Time',
          dateTime: node.due_date
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.isUpdatingTimeline = true;
          this.updatingTimeline = node;
          const data = {
            ids: [node._id],
            due_date: res.due_date
          };
          if (type == 'restart') {
            data['status'] = 'active';
          }
          this.updateTimelineSubscription?.unsubscribe();
          this.updateTimelineSubscription = this.automationService
            .updateTimelineStatus(data)
            .pipe(
              finalize(() => {
                this.isUpdatingTimeline = false;
                this.changeDetector.markForCheck();
              })
            )
            .subscribe((result) => {
              if (result.status) {
                node = { ...result.data[0] };
                this.updateActionTimeline(node);
                this.timeLineArrangement();
              }
            });
        }
      });
  }

  buildActionsFromTimeline(): void {
    this.actions = [];
    for (const timeline of this.timeLines) {
      if (timeline.ref !== 'a_10000') {
        const action = {
          _id: timeline._id,
          action: timeline.action,
          condition: timeline.condition,
          automation: timeline.automation,
          automation_line: timeline.automation_line,
          id: timeline.ref,
          parent: timeline.parent_ref,
          period: timeline.period,
          status: timeline.status,
          watched_materials: timeline.watched_materials,
          created_at: timeline.created_at,
          updated_at: timeline.updated_at
        };
        this.actions.push(action);
      }
    }

    this.actions.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    this.filterDealAutomationActions();
  }

  getDrawerParams(timeline): void {
    const automation = this.automation;
    const nodeIndex = this.nodes.findIndex(
      (item) => item.id === this.getSliceAutomationTimeline(timeline).ref
    );
    if (nodeIndex >= 0) {
      const node = this.nodes[nodeIndex];
      const parents = this.getParents(node.id);
      const edge = _.find(this.edges, { target: node.id });
      let conditionHandler = '';
      if (edge) {
        const parentNode = _.find(this.nodes, { id: edge.source });
        if (parentNode && parentNode.condition) {
          if (parentNode.condition.answer) {
            conditionHandler = 'trueCase';
          } else {
            conditionHandler = 'falseCase';
          }
        }
      }

      //has new deal node in automation
      let isNewDeal = false;
      const index = this.nodes.findIndex((item) => item.type === 'deal');
      if (index >= 0) {
        isNewDeal = true;
      }

      //is insertable move deal
      let isMoveDeal = false;
      for (const nodeId of parents) {
        const dealIndex = this.nodes.findIndex(
          (item) => item.id === nodeId && item.type === 'deal'
        );
        if (dealIndex >= 0) {
          isMoveDeal = true;
        }
      }

      const prevFollowUps = [];
      this.nodes.forEach((e) => {
        if (e.type === 'follow_up' && parents.indexOf(e.id) !== -1) {
          prevFollowUps.push(e);
        }
      });
      this.prevNode = { ...node };

      const data = {
        action: node,
        conditionHandler,
        follows: prevFollowUps,
        nodes: this.nodes,
        edges: this.edges,
        hasNewDeal: isNewDeal,
        moveDeal: isMoveDeal,
        automation,
        automation_type: this.automation_type,
        automation_label: automation.label,
        editType: 'timeline'
      };

      this.storeService.timelineInputData.next(data);
      this.actionMethod = ACTION_METHOD.EDIT_ACTION;
      this.actionParam = node;
      this.timelineEditDrawer?.open();
      this.changeDetector.markForCheck();
    }
  }

  getSliceAutomationTimeline(timeline): any {
    if (timeline.automation) {
      const automation = timeline.automation;
      let ref = timeline.ref.replace('_' + automation, '');
      let parent_ref = timeline.parent_ref.replace('_' + automation, '');
      if (ref === '') {
        const index = this.nodes.findIndex(
          (item) =>
            item.automation_id == automation && item.type == 'automation'
        );
        if (index >= 0) {
          ref = this.nodes[index].id;
        }
      }
      if (parent_ref === '') {
        const index = this.nodes.findIndex(
          (item) =>
            item.automation_id == automation && item.type == 'automation'
        );
        if (index >= 0) {
          parent_ref = this.nodes[index].id;
        }
      }
      return {
        ...timeline,
        ref,
        parent_ref
      };
    }
    return timeline;
  }

  filterDealAutomationActions(): void {
    const fakeAutomationActions =
      this.actions.filter(
        (item) =>
          item.action &&
          item.action.type === 'automation' &&
          item.action.automation_id === item.automation &&
          item.id.includes(item.automation)
      ) || [];

    // reorder parent
    for (const fakeAction of fakeAutomationActions) {
      const parent = fakeAction.parent;
      const childRootIndex = this.actions.findIndex(
        (item) => item.parent === fakeAction.id
      );
      if (childRootIndex >= 0) {
        this.actions[childRootIndex].parent = parent;
      }
    }

    // remove fake actions
    for (const fakeAction of fakeAutomationActions) {
      const fakeIndex = this.actions.findIndex(
        (item) => item._id === fakeAction._id
      );
      this.actions.splice(fakeIndex, 1);
    }

    // remark ids
    for (const action of this.actions) {
      const automationId = action.automation;
      if (automationId) {
        const newId = automationId.slice(-4);
        action.id = action.id.replace(automationId, newId);
        action.parent = action.parent.replace(automationId, newId);
      }
    }

    // if not exist root action, set root action.
    const rootIndex = this.actions.findIndex(
      (item) => item.parent === 'a_10000'
    );
    if (rootIndex < 0) {
      let rootAction = null;
      for (const action of this.actions) {
        const index = this.actions.findIndex(
          (item) => item.id === action.parent
        );
        if (index < 0) {
          rootAction = action;
          break;
        }
      }
      if (rootAction) {
        rootAction.parent = 'a_10000';
      }
    }
  }

  composeGraph(actions): void {
    let maxId = 0;
    const ids = [];
    let missedIds = [];
    const currentIds = [];
    const nodes = [];
    const edges = [];
    const caseNodes = {}; // Case nodes pair : Parent -> Sub case actions
    const edgesBranches = []; // Edge Branches
    this.nodes = [];
    this.edges = [];
    if (actions) {
      // check multiple branch version.
      let isMultipleVersion = false;
      const index = actions.findIndex((item) => item.parent === 'a_10000');
      if (index >= 0) {
        isMultipleVersion = true;
      }

      nodes.push({
        category: ACTION_CAT.START,
        id: 'a_10000',
        index: 10000,
        label: 'START',
        leaf: true,
        type: 'start'
      });

      //if this automation is not multiple branch version, change parents to start node.
      if (!isMultipleVersion) {
        for (const action of actions) {
          if (action.parent === '0') {
            action.parent = 'a_10000';
          }
        }
      }

      actions.forEach((e) => {
        const idStr = (e.id + '').replace('a_', '');
        const id = parseInt(idStr);
        if (maxId < id) {
          maxId = id;
        }
        currentIds.push(id);
      });
    }
    for (let i = 1; i <= maxId; i++) {
      ids.push(i);
    }
    missedIds = ids.filter(function (n) {
      return currentIds.indexOf(n) === -1;
    });
    maxId++;
    actions.sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1));

    if (actions) {
      actions.forEach((e) => {
        if (e.condition) {
          const node = {
            id: e.id,
            index: this.genIndex(e.id),
            period: e.period
          };
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
            node['videos'] = e.action.videos;
            node['pdfs'] = e.action.pdfs;
            node['images'] = e.action.images;
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
            node['status'] = e.status;
            node['period'] = e.period;
            node['error_message'] = e.error_message;
            node['timelines'] = e.timelines;
          }
          nodes.push(node);

          const parentNodeIndex = actions.findIndex(
            (item) => item.id === e.parent
          );
          const parentNode = actions[parentNodeIndex];

          if (parentNode && parentNode.action.type === 'contact_condition') {
            let caseNodeIndex = missedIds.splice(-1)[0];
            if (!caseNodeIndex) {
              caseNodeIndex = maxId;
              maxId++;
            }
            const nodeId = 'a_' + caseNodeIndex;
            const caseNode = {
              type: 'contact_condition',
              condition_field: parentNode.action.condition_field,
              id: nodeId,
              index: caseNodeIndex,
              label: e.condition.case,
              leaf: true,
              category: ACTION_CAT.CONDITION,
              condition: { case: e.condition.case }
            };
            nodes.push(caseNode);
            const bSource = e.parent;
            const bTarget = nodeId;
            const target = e.id;
            edges.push({
              id: bSource + '_' + bTarget,
              source: bSource,
              target: bTarget,
              category: 'case',
              answer: caseNode.condition ? caseNode.condition.case : '',
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
            if (caseNodes[bSource]) {
              caseNodes[bSource].push(caseNode);
            } else {
              caseNodes[bSource] = [caseNode];
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
              let yesNodeIndex = missedIds.splice(-1)[0];
              if (!yesNodeIndex) {
                yesNodeIndex = maxId;
                maxId++;
              }
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
              let noNodeIndex = missedIds.splice(-1)[0];
              if (!noNodeIndex) {
                noNodeIndex = maxId;
                maxId++;
              }
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
          const node = {
            id: e.id,
            index: this.genIndex(e.id),
            period: e.period
          };

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
            node['videos'] = e.action.videos;
            node['pdfs'] = e.action.pdfs;
            node['images'] = e.action.images;
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
            node['timelines'] = e.timelines;
            node['status'] = e.status;
            node['error_message'] = e.error_message;
            node['period'] = e.period;
          }
          nodes.push(node);
          if (e.parent !== '0') {
            const source = e.parent;
            const target = e.id;
            edges.push({ id: source + '_' + target, source, target, data: {} });
            edgesBranches.push(source);
          }
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
        for (const condition of branchNode.contact_conditions) {
          const index = caseNodes[branch].findIndex(
            (item) => item.condition && item.condition.case == condition
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

        for (const condition of uncompletedConditions) {
          let caseNodeIndex = missedIds.splice(-1)[0];
          if (!caseNodeIndex) {
            caseNodeIndex = maxId;
            maxId++;
          }
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
            answer: this.getFormattedAnswer(branchNode, condition),
            data: {}
          });
        }
      } else {
        // uncompleted case branch
        if (caseNodes[branch].length === 1) {
          let newNodeIndex = missedIds.splice(-1)[0];
          if (!newNodeIndex) {
            newNodeIndex = maxId;
            maxId++;
          }
          const newNodeId = 'a_' + newNodeIndex;
          const conditionType = caseNodes[branch][0].condition.case;
          if (caseNodes[branch][0].condition.answer) {
            // Insert False case
            const noNode = {
              id: newNodeId,
              index: newNodeIndex,
              label: 'NO',
              leaf: true,
              condition: { case: conditionType, answer: false },
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
        e.type === 'automation' ||
        e.type === 'deal' ||
        e.type === 'move_deal'
      ) {
        e.leaf = false;
      } else {
        e.leaf = true;
      }
    });
    this.identity = maxId;
    this.nodes = [...nodes];
    this.edges = [...edges];
  }

  genIndex(id: string): any {
    const idStr = (id + '').replace('a_', '');
    return parseInt(idStr);
  }

  getFormattedAnswer(node, condition): any {
    if (node['condition_field'] === 'tags') {
      return condition.join(', ');
    } else {
      return condition;
    }
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

  buildActionsFromNode(): any {
    const parentsObj = {}; // Parent Ids of each node
    const caseActions = {}; // Case actions Object
    const nodesObj = {};
    const actions = [];

    const saveNodes = [...this.nodes];
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
            let action;
            if (e.commands) {
              action = {
                parent_ref: caseParentActionId,
                ref: e.id,
                period: e.period,
                condition: caseAction.condition,
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
                  contact_conditions: e.contact_conditions
                }
              };
            } else {
              action = {
                parent_ref: caseParentActionId,
                ref: e.id,
                period: e.period,
                condition: caseAction.condition,
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
                  contact_conditions: e.contact_conditions
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
            // if (action.condition && action.condition.primary) {
            //   delete action.condition.primary;
            // }
            actions.push(action);
          }
        } else {
          const action = {
            parent_ref: parentId,
            ref: e.id,
            period: e.period
          };

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
              contact_conditions: e.contact_conditions
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
              contact_conditions: e.contact_conditions
            };
          }
          // if (e.group) {
          //   action['action']['group'] = e.group;
          // }
          if (e['parent_type'] && e['parent_type'] === 'deal') {
            action['type'] = 'deal';
          }
          actions.push(action);
        }
      }
    });
    return actions;
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

  getTaskActivities(): any {
    const activities = [];
    for (const task of this.tasks) {
      activities.push({
        ...task,
        activityType: 'task'
      });
    }
    for (const timeline of this.timelineActivities) {
      activities.push({
        ...timeline,
        activityType: 'timeline'
      });
    }
    return activities;
  }

  getMainTimelines(tabId): any {
    return this.mainTimelines.filter((item) => item.type === tabId);
  }

  // ICONS List
  ICONS = {
    follow_up: AUTOMATION_ICONS.FOLLOWUP,
    update_follow_up: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
    note: AUTOMATION_ICONS.CREATE_NOTE,
    text: AUTOMATION_ICONS.SEND_TEXT,
    email: AUTOMATION_ICONS.SEND_EMAIL,
    audio: AUTOMATION_ICONS.SEND_AUDIO,
    send_email_video: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_video: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
    send_email_pdf: AUTOMATION_ICONS.SEND_PDF_EMAIL,
    send_text_pdf: AUTOMATION_ICONS.SEND_PDF_TEXT,
    send_email_image: AUTOMATION_ICONS.SEND_IMAGE_EMAIL,
    send_text_image: AUTOMATION_ICONS.SEND_IMAGE_TEXT,
    update_contact: AUTOMATION_ICONS.UPDATE_CONTACT,
    deal: AUTOMATION_ICONS.NEW_DEAL,
    move_deal: AUTOMATION_ICONS.MOVE_DEAL,
    send_email_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    send_text_material: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
    root: AUTOMATION_ICONS.DEAL_ROOT,
    automation: AUTOMATION_ICONS.AUTOMATION,
    contact_condition: AUTOMATION_ICONS.CONTACT_CONDITION,
    move_contact: AUTOMATION_ICONS.MOVE_CONTACT,
    share_contact: AUTOMATION_ICONS.SHARE_CONTACT
  };
  getLabelName(contact: Contact): string {
    let _labelName = '';
    if (this.allLabels?.length > 0) {
      this.allLabels.forEach((e) => {
        if (e._id == contact?.label) _labelName = e.name;
      });
    }
    return _labelName;
  }
  replaceContent(content = ''): string {
    const user = this.userService.profile.getValue();
    const material = Object.values(this.dataObj.materials)[0];
    if (content) {
      const materialTitle = material ? material['title'] : '';
      content = content.replace(/{material_title}/gi, materialTitle);
    } else {
      content = '';
    }
    if (this.deal?.contacts?.length === 1) {
      const templateTokens =
        this.userService.garbage.getValue()?.template_tokens || [];

      let labelName = '';
      if (content.match(/{label}/gi)) {
        labelName = this.getLabelName(this.deal?.contacts?.[0]);
      }
      return replaceToken(
        user,
        this.deal?.contacts?.[0],
        templateTokens,
        content,
        labelName,
        this.additional_fields,
        this.timezone_info
      );
    } else return content;
  }

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
    watched_material: 'Watched Material?'
  };

  getContactsInfo = (id: string) => {
    const curContacts = this.deal.contacts.filter((it) => it._id == id);
    return curContacts;
  };
  getContactInfo = (id: string) => {
    const curContacts = this.deal.contacts.find((it) => it._id == id);
    return curContacts;
  };
  getContactList = (contacts: any) => {
    const assignedContacts = [];
    for (const contact of contacts) {
      const contactIndex = this.deal.contacts.findIndex(
        (item) => item._id === contact
      );
      if (contactIndex >= 0) {
        assignedContacts.push(this.deal.contacts[contactIndex]);
      }
    }
    return assignedContacts;
  };

  showTextStatus = (activity: any) => {
    activity['expend_status'] = activity['expend_status'] ? false : true;
    console.log(activity);
  };
}
