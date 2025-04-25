import * as _ from 'lodash';
import moment from 'moment-timezone';
import {
  ChangeDetectorRef,
  Component,
  Input,
  Output,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren,
  EventEmitter
} from '@angular/core';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { DetailActivity } from '@app/models/activityDetail.model';
import { DealsService } from '@app/services/deals.service';
import { SspaService } from '@app/services/sspa.service';
import { UserService } from '@app/services/user.service';
import { Subscription } from 'rxjs';
import { TabItem } from '@app/utils/data.types';
import { getUserTimezone, listToTree, replaceToken } from '@app/helper';
import { Contact } from '@app/models/contact.model';
import { AccordionComponent } from '../accordion/accordion.component';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import {
  ActionName,
  CALENDAR_DURATION,
  DialogSettings
} from '@app/constants/variable.constants';
import { Timeline } from '@app/models/timeline.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '../confirm/confirm.component';
import { NoteCreateComponent } from '../note-create/note-create.component';
import { EmailService } from '@app/services/email.service';
import { Draft } from '@app/models/draft.model';
import { SendEmailComponent } from '../send-email/send-email.component';
import { StoreService } from '@app/services/store.service';
import { ToastrService } from 'ngx-toastr';
import { TaskCreateComponent } from '../task-create/task-create.component';
import { SendTextComponent } from '../send-text/send-text.component';
import { DialerService } from '@app/services/dialer.service';
import { AutomationShowFullComponent } from '../automation-show-full/automation-show-full.component';
import { AutomationService } from '@app/services/automation.service';
import { TaskEditComponent } from '../task-edit/task-edit.component';
import { TaskDetail } from '@app/models/task.model';
import { TaskRecurringDialogComponent } from '../task-recurring-dialog/task-recurring-dialog.component';
import { NoteEditComponent } from '../note-edit/note-edit.component';
import { ContactAutomationAssignModalComponent } from '../contact-detail-v2/contact-data-list-container/contact-automation-assign-modal/contact-automation-assign-modal.component';
import { CalendarEventDialogComponent } from '../calendar-event-dialog/calendar-event-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';

@Component({
  selector: 'app-deal-history',
  templateUrl: './deal-history.component.html',
  styleUrls: ['./deal-history.component.scss']
})
export class DealHistoryComponent implements OnInit {
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
  groups = [];
  dGroups = [];
  groupActions = {};
  details = {};
  detailData = {};
  sub_calls = {};
  trackers = {};
  showingMax = 4;
  automationDetails = {};
  durations = CALENDAR_DURATION;

  loading = false;
  timezone;

  mores = {}; // show mode flags for the schedule items
  activitySubscription: Subscription;
  reloadSubscription: Subscription;
  materialActivitySubscription: Subscription;
  dealId;
  @Input() deal: any;
  @Input('labels') allLabels: any;
  @Input('reload') reload = false;
  @Output() onSetReload = new EventEmitter();

  @ViewChildren('noteActivityItem')
  noteActivityItem: QueryList<AccordionComponent>;

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
  tab: TabItem = this.tabs[0];
  activityType: TabItem = this.tabs[0];
  additional_fields;
  timezone_info;

  timeLines = [];
  automation = null;
  automation_line = null;
  automationUnAssigned = true;
  ActionName = ActionName;
  allDataSource = new MatTreeNestedDataSource<any>();
  dataSource = new MatTreeNestedDataSource<any>();

  activeRoot: any;
  activePrevRoot: any;
  timelineActivities = [];
  getAutomationLinesSubscription: Subscription;
  getAutomationDetailSubscription: Subscription;

  emailDialog = null;
  textDialog = null;
  createEmaildraftSubscription: Subscription;
  updateEmailDraftSubscription: Subscription;
  removeEmailDraftSubscription: Subscription;
  createTextDraftSubscription: Subscription;
  updateTextDraftSubscription: Subscription;
  removeTextDraftSubscription: Subscription;
  setPrimaryContactSubscription: Subscription;
  draftSubscription: Subscription;
  draftEmail = new Draft();
  draftText = new Draft();

  constructor(
    private dialog: MatDialog,
    public sspaService: SspaService,
    public userService: UserService,
    public dealsService: DealsService,
    private emailService: EmailService,
    private storeService: StoreService,
    private toast: ToastrService,
    private dialerService: DialerService,
    private automationService: AutomationService,
    private changeDetector: ChangeDetectorRef,
    public domSanitizer: DomSanitizer
  ) {
    this.dealId = this.deal?._id;

    const profile = this.userService.profile.getValue();
    this.timezone_info = getUserTimezone(profile);
    const garbage = this.userService.garbage.getValue();
    this.additional_fields = garbage.additional_fields || [];
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.deal && this.deal) {
      this.dealId = this.deal.main._id;
      this.loadActivity();
    }
    if (changes.reload && this.reload) {
      this.reloadLatest(3);
    }
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

  loadActivity(): void {
    if (!this.deal) return;
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
        this.onSetReload.emit(false);
        this.changeTab(this.tab);
      });
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
      case 'thumbs up':
        actionStr = 'gave thumbs up';
        return actionStr;
        break;
      default:
        actionStr = tracker_type;
    }

    return actionStr + ' ' + media_type.replace('_trackers', '');
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
  changeActivityTypes(tab: TabItem): void {
    console.log(tab);
    this.activityType = tab;
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
        this.groupActivities();
        this.arrangeActivity();
        this.setLastActivity();
        this.fetchAutomationActivities();

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
  getLabelName(contact: Contact): string {
    let _labelName = '';
    if (this.allLabels?.length > 0) {
      this.allLabels.forEach((e) => {
        if (e._id == contact?.label) _labelName = e.name;
      });
    }
    return _labelName;
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

  getTime(start: any, end: any): any {
    const start_hour = new Date(start).getHours();
    const end_hour = new Date(end).getHours();
    const start_minute = new Date(start).getMinutes();
    const end_minute = new Date(end).getMinutes();
    const duration = end_hour - start_hour + (end_minute - start_minute) / 60;
    const durationTime = this.durations.filter(
      (time) => time.value == duration
    );
    if (durationTime?.length) {
      return durationTime[0].text;
    } else {
      return '';
    }
  }

  getContactInfo = (id: string) => {
    const curContacts = this.deal.contacts.find((it) => it._id == id);
    return curContacts;
  };

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
          this.reloadLatest(3);
        }
      });
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

  openAutomationDlg() {
    this.dialog
      .open(ContactAutomationAssignModalComponent, {
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          dealId: this.dealId,
          dealInfo: this.deal
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reloadLatest(2);
          this.automationUnAssigned = false;
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

      this.createEmaildraftSubscription &&
        this.createEmaildraftSubscription.unsubscribe();
      this.createEmaildraftSubscription = this.emailService
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

  showDetailCompletedAutomation(activity): void {
    if (
      activity.content === 'assigned automation' ||
      activity.content === 'moved to next automation' ||
      activity.content === 'triggered automation'
    ) {
      const automationId = activity.automations;
      const automationLineId = activity.automation_lines._id;
      this.automationService
        .loadAutomationTimelines(automationLineId)
        .subscribe((res) => {
          if (res) {
            const automation = res;
            this.dialog.open(AutomationShowFullComponent, {
              position: { top: '100px' },
              width: '98vw',
              maxWidth: '900px',
              height: 'calc(60vh + 70px)',
              panelClass: ['main-automation', `main-${automationId}`, 'active'],
              data: {
                id: automationId,
                automation: automation,
                timelines: automation['timelines'],
                type: 'deal'
              }
            });
          }
        });
    } else {
      this.getAutomationDetailSubscription &&
        this.getAutomationDetailSubscription.unsubscribe();
      this.getAutomationDetailSubscription = this.automationService
        .getAutomationLine(activity?.automation_lines._id)
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

  hasMoreMenu(activity: any): boolean {
    if (activity.type === 'automations') {
      if (activity.automation_lines?.status === 'running') {
        return true;
      }
    }
    return false;
  }

  stopAutomation(automationLineId) {
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
          this.automationService
            .unAssign(automationLineId)
            .subscribe((status) => {
              if (status) {
                this.reloadLatest(3);
              }
            });
        }
      });
  }
}
