import {
  Component,
  OnInit,
  ViewChild,
  AfterContentChecked,
  AfterViewInit,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  ChangeDetectorRef,
  ApplicationRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  TIMES,
  ActionName,
  ACTION_CAT,
  CALENDAR_DURATION,
  AUTOMATION_ATTACH_SIZE,
  CONTACT_PROPERTIES,
  PHONE_COUNTRIES,
  DEFAULT_TEMPLATE_TOKENS,
  SCHEDULED_TIME_TOKEN,
  REGIONS,
  orderOriginal,
  DialogSettings,
  MIN_ROW_COUNT,
  BulkActions
} from '@constants/variable.constants';
import { MaterialService } from '@services/material.service';
import { Subscription } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { FileService } from '@services/file.service';
import { LabelService } from '@services/label.service';
import { UserService } from '@services/user.service';
import { TeamService } from '@services/team.service';
import { Task } from '@models/task.model';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import moment from 'moment-timezone';
import * as _ from 'lodash';
import { getUserTimezone, searchReg, validateEmail } from '@app/helper';
import { Template } from '@models/template.model';
import { StoreService } from '@services/store.service';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatesService } from '@services/templates.service';
import { ConnectService } from '@services/connect.service';
import { ToastrService } from 'ngx-toastr';
import { DealsService } from '@services/deals.service';
import { environment } from '@environments/environment';
import { HelperService } from '@services/helper.service';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { AutomationService } from '@services/automation.service';
import { AppointmentService } from '@services/appointment.service';
import { Contact } from '@models/contact.model';
import { DialerService } from '@services/dialer.service';
import { TagService } from '@services/tag.service';
import { TabItem, TemplateToken } from '@utils/data.types';
import { CountryISO } from 'ngx-intl-tel-input';
import { ContactService } from '@services/contact.service';
import { Automation } from '@models/automation.model';
import { HandlerService } from '@services/handler.service';
import { CreateTokenComponent } from '@components/create-token/create-token.component';
import { ResetDateTimeComponent } from '@components/reset-date-time/reset-date-time.component';
import { SelectMemberComponent } from '@components/select-member/select-member.component';
import { SelectTeamComponent } from '@components/select-team/select-team.component';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { convertIdToUrlOnSMS, convertURLToIdOnSMS } from '@app/utils/functions';

@Component({
  selector: 'app-edit-action',
  templateUrl: './edit-action.component.html',
  styleUrls: ['./edit-action.component.scss']
})
export class EditActionComponent
  implements OnInit, AfterContentChecked, AfterViewInit, OnDestroy
{
  category;
  type = '';
  action;
  submitted = false;
  isCalendly = false;

  materials = [];
  materialsLoading = false;
  materialsError = ''; // Load Error
  materialError = ''; // Select Error

  templateLoadingSubscription: Subscription;
  dialerSubscription: Subscription;
  isProcessing = true;
  templates;
  templateLoadError = '';
  myControl = new UntypedFormControl();
  selectedTemplate: Template = new Template();

  due_date;
  due_time = '12:00:00.000';
  due_duration = 1;
  times = TIMES;
  followDueOption = 'date';

  // Contact Update
  contactUpdateOption = 'update_label';
  labels = [];
  labelsLoading = false;
  labelsLoadError = '';
  commandLabel = ''; // Label
  commandName = '';
  commandTags = []; // Tags
  selectedTags = [];
  pushCommandTags = [];
  pullCommandTags = [];

  mediaType = '';
  materialType = '';
  material;

  default = {
    sms: '',
    email: ''
  };

  periodOption = 'gap';
  parentId = false;

  plan_time = { day: 0, hour: 1, min: 0 };
  plan_time_delay = 1;

  attachmentLimit = AUTOMATION_ATTACH_SIZE;

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  @ViewChild('searchInput') searchField: ElementRef;
  @ViewChild('subjectField') subjectField: ElementRef;
  currentUser;

  error = '';

  selectedFollow: any;
  followUpdateOption = 'update_follow_up';
  updateFollowDueOption = 'date';
  selectedDate = '';
  update_due_duration = 0;
  task = new Task();

  searchStr = '';
  filterMaterials = [];

  loadSubscription: Subscription;
  profileSubscription: Subscription;
  updateTimelineSubscription: Subscription;

  @ViewChild('smsContentField') textAreaEl: ElementRef;
  set = 'twitter';
  templatePortal: TemplatePortal;
  @ViewChild('createNewSMSContent') createNewSMSContent: TemplateRef<unknown>;
  @ViewChild('createNewEmailContent')
  createNewEmailContent: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templateSubject = '';
  templateValue = '';
  stages: any[] = [];
  deal_name = '';
  deal_stage = '';
  popup;
  recordUrl = 'https://crmgrow-record.s3-us-west-1.amazonaws.com';
  authToken = '';
  userId = '';
  attachments = [];
  smsContentCursorStart = 0;
  smsContentCursorEnd = 0;
  smsContent = '';
  subjectFocus = false;
  contentFocus = false;

  dealNameCursorStart = 0;
  dealNameCursorEnd = 0;
  dealNameFocus = false;

  nodes = [];
  edges = [];
  condition_refs = [];

  moveDealOption = 'next';
  automation_type = '';
  automation_label = 'contact';
  automation = null;
  selectedAutomation = '';

  calendar_durations = CALENDAR_DURATION;
  appointmentDueOption = 'delay';
  timeDelayType = 'hour';
  timeUntilType = 'hour';
  conditionHandler = '';
  isAvailableAssignAt = false;
  selectedVoiceMail = null;
  duplicateValues: boolean[] = [];
  ActionName = ActionName;

  minDate;
  days = Array(29).fill(0);
  hours = Array(23).fill(0);

  @Output() onClose = new EventEmitter();
  data;

  selectedTimezone = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();

  assignedList = [];
  timelines = [];
  filteredAssignedList = [];
  searchAssignedListStr = '';
  tabs: TabItem[] = [];
  actionTab = { icon: '', label: 'Action', id: 'action' };
  selectedTab: TabItem = this.tabs[0];
  updateTimeline = 'update';

  audioFile;
  uploadingAudio = false;
  recordingAudio = false;

  contactProperties = CONTACT_PROPERTIES;
  contactConditions = [];
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  LOCATION_COUNTRIES = ['US', 'CA'];
  COUNTRIES: { code: string; name: string }[] = [];
  COUNTRY_REGIONS = {};
  orderOriginal = orderOriginal;
  mapConditions = [];
  identify = 1;
  lead_fields: any[] = [];
  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name'
  };
  templateTokens: TemplateToken[] = [];
  tokens: string[] = [];

  emailTemplateSearchStr = '';
  textTemplateSearchStr = '';
  emailTemplates: Template[] = [];
  textTemplates: Template[] = [];
  emailSearchResult: Template[] = [];
  textSearchResult: Template[] = [];

  garbageSubscription: Subscription;
  templateSubscription: Subscription;

  editType = 'action';

  minRowCount = MIN_ROW_COUNT;
  DISPLAY_COLUMNS = ['select', 'contact', 'status'];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  SORT_TYPES = [
    { id: '', label: 'All status' },
    { id: 'pending', label: 'Pending' },
    { id: 'active', label: 'Active' },
    { id: 'checking', label: 'Checking' },
    { id: 'disabled', label: 'Disabled' },
    { id: 'paused', label: 'Paused' },
    { id: 'Error', label: 'Error' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;
  filteredResult = [];
  filteredFiles: any[] = [];
  selectedFiles: any[] = [];
  selectedSort = 'status';
  ACTIONS = [];
  sortType = this.SORT_TYPES[0];

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
  selectedMoveOption = this.moveOptions[0];
  selectedMoveOptionId = 1;
  internalTeamCount = 0;
  communityCount = 0;
  selectedTeam;
  members = [];
  selectedMember;
  role = 'viewer';
  filteredTags: any[] = [];

  internalOnly = true;

  @ViewChild('teamSelector') teamSelector: SelectTeamComponent;
  @ViewChild('memberSelector') memberSelector: SelectMemberComponent;
  @Input('automationId') automationId = '';
  constructor(
    private dialog: MatDialog,
    private materialService: MaterialService,
    private userService: UserService,
    private fileService: FileService,
    public templatesService: TemplatesService,
    private helperSerivce: HelperService,
    private _viewContainerRef: ViewContainerRef,
    public connectService: ConnectService,
    private toastr: ToastrService,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef,
    public storeService: StoreService,
    public labelService: LabelService,
    private automationService: AutomationService,
    private appointmentService: AppointmentService,
    private tagService: TagService,
    private dialerService: DialerService,
    private handlerService: HandlerService,
    private contactService: ContactService,
    private teamService: TeamService
  ) {
    this.tagService.getAllTags(false);
    this.tagService.tags$.subscribe((tags) => {
      this.filteredTags = tags;
    });
    this.userService.garbage$.subscribe((res) => {
      const garbage = res;
      const cannedTemplate = garbage && garbage.canned_message;
      this.default.email = cannedTemplate && cannedTemplate.email;
      this.default.sms = cannedTemplate && cannedTemplate.sms;

      const current = new Date();
      this.minDate = {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        day: current.getDate()
      };
      if (
        garbage?.calendly &&
        Object.keys(garbage?.calendly).length &&
        !environment.isSspa
      ) {
        this.isCalendly = true;
      } else {
        this.isCalendly = false;
      }
    });
    // this.appointmentService.loadCalendars(false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
    });

    this.templatesService.loadAll(false);
    this.teamService.loadAll(false);

    this.duplicateValues = [];

    this.authToken = this.userService.getToken();
    this.userId = this.userService.profile.getValue()._id;

    this.initVariables();
    this.storeService.actionInputData$.subscribe((res) => {
      if (res) {
        this.data = res;
        this.editType = 'action';
        this.initVariables();
        // this.initDialog();
      }
    });

    this.storeService.timelineInputData$.subscribe((res) => {
      if (res) {
        this.data = res;
        this.editType = 'timeline';
        this.initVariables();
        // this.initDialog();
      }
    });

    this.templateSubscription && this.templateSubscription.unsubscribe();
    this.templateSubscription = this.templatesService.templates$.subscribe(
      (res) => {
        if (res && res.length) {
          this.textTemplates = [];
          this.emailTemplates = [];
          res.forEach((e) => {
            if (e.type === 'email') {
              this.emailTemplates.push(e);
            } else {
              this.textTemplates.push(e);
            }
          });
          this.emailSearchResult = this.emailTemplates;
          this.textSearchResult = this.textTemplates;
        }
      }
    );
  }

  ngOnInit(): void {
    this.COUNTRIES = this.contactService.COUNTRIES;
    this.COUNTRY_REGIONS = REGIONS;
    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });

    const profile = this.userService.profile.getValue();
    if (environment.isSspa) {
      this.internalOnly = true;
    } else if (profile?.user_version < 2.3) {
      this.internalOnly = false;
    }
  }

  ngOnDestroy(): void {
    this.templateSubscription && this.templateSubscription.unsubscribe();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    window.removeEventListener('message', this.recordCallback);
  }

  ngAfterContentChecked(): void {}

  ngAfterViewInit(): void {
    this.storeService.actionInputData$.subscribe((res) => {
      if (res) {
        this.data = res;
        this.editType = 'action';
        this.initDialog();
      }
    });

    this.storeService.timelineInputData$.subscribe((res) => {
      if (res) {
        this.data = res;
        this.editType = 'timeline';
        this.initDialog();
      }
    });
  }

  removeError(): void {
    this.error = '';
  }
  remove(): void {
    this.commandLabel = '';
  }
  removePullItem(item): void {
    const index = this.pullCommandTags.indexOf(item);
    if (index > -1) {
      this.pullCommandTags.splice(index, 1);
    }
  }
  removePushItem(item): void {
    const index = this.pushCommandTags.indexOf(item);
    if (index > -1) {
      this.pushCommandTags.splice(index, 1);
    }
  }
  toggleMaterial(material): void {
    if (this.material && this.material._id) {
      if (material) {
        if (material._id !== this.material._id) {
          this.material = material;
        }
      }
    }
  }

  loadTeam(): void {
    this.teamService.teams$.subscribe((res) => {
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
  }

  checkDuplicateValues(index: number) {
    const filteredContactConditions = this.contactConditions.filter(
      (_, index) => this.mapConditions[index] !== 'remove'
    );
    const nonEmptyInputValues = filteredContactConditions.map(
      (condition) => condition.answer
    );
    if (
      nonEmptyInputValues.filter(
        (value, i) => value === nonEmptyInputValues[index] && i !== index
      ).length > 0
    ) {
      this.duplicateValues[index] = true;
    } else {
      this.duplicateValues[index] = false;
    }
  }

  updateAction(): void {
    if (
      this.isDuplicateContactCondition() ||
      this.isEmptyContactCondition() ||
      this.duplicateValues.some((value) => value === true)
    )
      return;
    let period = this.action['period'];
    if (!this.action['condition'] && this.action['period'] === 'custom_date') {
      if (this.timeDelayType === 'hour') {
        period = this.plan_time_delay;
      } else {
        period = this.plan_time_delay * 24;
      }

      if (!period && this.NoLimitActions.indexOf(this.type) < 0) {
        return;
      }
    }

    this.action['videos'] = [];
    this.action['pdfs'] = [];
    this.action['images'] = [];

    if (
      this.type === 'email' ||
      this.type === 'send_email_video' ||
      this.type === 'send_email_pdf' ||
      this.type === 'send_email_image' ||
      this.type === 'send_email_material'
    ) {
      const content = this.action['content'];
      const insertedMaterials = this.helperSerivce.getMaterials(content);
      if (insertedMaterials && insertedMaterials.length > 0) {
        if (insertedMaterials && insertedMaterials.length === 1) {
          const index = this.materials.findIndex(
            (item) => item._id === insertedMaterials[0]._id
          );
          if (index >= 0) {
            if (this.materials[index].material_type === 'video') {
              this.type = 'send_email_video';
              this.action['videos'] = [insertedMaterials[0]._id];
            } else if (this.materials[index].material_type === 'pdf') {
              this.type = 'send_email_pdf';
              this.action['pdfs'] = [insertedMaterials[0]._id];
            } else if (this.materials[index].material_type === 'image') {
              this.type = 'send_email_image';
              this.action['images'] = [insertedMaterials[0]._id];
            }
            this.action['label'] = this.ActionName[this.type];
          }
        } else {
          this.type = 'send_email_material';
          this.action['label'] = this.ActionName[this.type];

          for (const material of insertedMaterials) {
            const index = this.materials.findIndex(
              (item) => item._id === material._id
            );
            if (index >= 0) {
              if (this.materials[index].material_type === 'video') {
                if (Array.isArray(this.action['videos'])) {
                  this.action['videos'] = [
                    ...this.action['videos'],
                    material._id
                  ];
                } else {
                  this.action['videos'] = [material._id];
                }
              } else if (this.materials[index].material_type === 'pdf') {
                if (Array.isArray(this.action['pdfs'])) {
                  this.action['pdfs'] = [...this.action['pdfs'], material._id];
                } else {
                  this.action['pdfs'] = [material._id];
                }
              } else if (this.materials[index].material_type === 'image') {
                if (Array.isArray(this.action['images'])) {
                  this.action['images'] = [
                    ...this.action['images'],
                    material._id
                  ];
                } else {
                  this.action['images'] = [material._id];
                }
              }
            }
          }
        }
        const data = {
          ...this.action,
          type: this.type,
          period,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      } else {
        this.type = 'email';
        this.action['label'] = this.ActionName[this.type];
        const data = {
          ...this.action,
          type: this.type,
          period,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      }
      return;
    } else if (
      this.type === 'text' ||
      this.type === 'send_text_video' ||
      this.type === 'send_text_pdf' ||
      this.type === 'send_text_image' ||
      this.type === 'send_text_material'
    ) {
      const content = this.action['content'];

      const { materials: insertedMaterials } =
        this.helperSerivce.getSMSMaterials(content);
      if (insertedMaterials && insertedMaterials.length > 0) {
        if (insertedMaterials && insertedMaterials.length === 1) {
          if (insertedMaterials[0].type === 'video') {
            this.type = 'send_text_video';
            this.action['videos'] = [insertedMaterials[0]._id];
          } else if (insertedMaterials[0].type === 'pdf') {
            this.type = 'send_text_pdf';
            this.action['pdfs'] = [insertedMaterials[0]._id];
          } else if (insertedMaterials[0].type === 'image') {
            this.type = 'send_text_image';
            this.action['images'] = [insertedMaterials[0]._id];
          }
          this.action['label'] = this.ActionName[this.type];
        } else {
          this.type = 'send_text_material';
          this.action['label'] = this.ActionName[this.type];

          for (const material of insertedMaterials) {
            if (material.type === 'video') {
              if (Array.isArray(this.action['videos'])) {
                this.action['videos'] = [
                  ...this.action['videos'],
                  material._id
                ];
              } else {
                this.action['videos'] = [material._id];
              }
            } else if (material.type === 'pdf') {
              if (Array.isArray(this.action['pdfs'])) {
                this.action['pdfs'] = [...this.action['pdfs'], material._id];
              } else {
                this.action['pdfs'] = [material._id];
              }
            } else if (material.type === 'image') {
              if (Array.isArray(this.action['images'])) {
                this.action['images'] = [
                  ...this.action['images'],
                  material._id
                ];
              } else {
                this.action['images'] = [material._id];
              }
            }
          }
        }
        this.action['content'] = convertURLToIdOnSMS(content);
        const data = {
          ...this.action,
          type: this.type,
          period,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      } else {
        this.type = 'text';
        this.action['label'] = this.ActionName[this.type];
        const data = {
          ...this.action,
          type: this.type,
          period,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period
        // });
      }
      return;
    } else if (this.type === 'follow_up') {
      if (this.followDueOption === 'date') {
        const due_date = moment
          .tz(this.getSelectedDateTime(), this.selectedTimezone)
          .format();
        const data = {
          ...this.action,
          task_type: this.task.type,
          due_date: due_date,
          period,
          due_duration: undefined,
          timezone: this.selectedTimezone,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   task_type: this.task.type,
        //   due_date: due_date,
        //   period,
        //   due_duration: undefined
        // });
      } else {
        const data = {
          ...this.action,
          task_type: this.task.type,
          due_duration:
            this.timeUntilType === 'hour'
              ? this.due_duration
              : this.due_duration * 24,
          period,
          due_date: undefined,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   task_type: this.task.type,
        //   due_duration: this.due_duration,
        //   period,
        //   due_date: undefined
        // });
      }
      return;
    } else if (this.type === 'update_contact') {
      const commands = ['update_label', 'push_tag', 'pull_tag'];
      const content = [
        this.commandLabel,
        this.pushCommandTags,
        this.pullCommandTags
      ];
      if (this.contactUpdateOption === 'update_label') {
        if (!this.commandLabel) {
          this.error = 'Please select the label for contact.';
        }
      }
      if (this.contactUpdateOption === 'push_tag') {
        if (!this.pushCommandTags.length) {
          this.error = 'Please select the tags to insert.';
        }
      }
      if (this.contactUpdateOption === 'pull_tag') {
        if (!this.pullCommandTags.length) {
          this.error = 'Please select the tags to remove.';
        }
      }
      if (this.error) {
        return;
      } else {
        console.log('Update', {
          ...this.action,
          type: this.type,
          period,
          commands,
          content
        });
        const data = {
          ...this.action,
          type: this.type,
          period,
          commands,
          content,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   period,
        //   command,
        //   content
        // });
        return;
      }
    } else if (this.type === 'update_follow_up') {
      if (this.followUpdateOption === 'update_follow_up') {
        if (this.updateFollowDueOption === 'no_update') {
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            due_duration: undefined,
            due_date: undefined,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id,
            updateTimeline: this.updateTimeline
          };
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.closeDrawer();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   task_type: this.task.type,
          //   due_duration: undefined,
          //   due_date: undefined,
          //   period,
          //   command: 'update_follow_up',
          //   ref_id: this.selectedFollow.id
          // });
        } else if (this.updateFollowDueOption === 'update_due_date') {
          const due_date = moment
            .tz(this.getSelectedDateTime(), this.selectedTimezone)
            .format();
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            due_duration: undefined,
            due_date: due_date,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id,
            timeZone: this.selectedTimezone,
            updateTimeline: this.updateTimeline
          };
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.closeDrawer();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   task_type: this.task.type,
          //   due_duration: undefined,
          //   due_date: due_date,
          //   period,
          //   command: 'update_follow_up',
          //   ref_id: this.selectedFollow.id
          // });
        } else {
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            due_date: undefined,
            due_duration:
              this.timeUntilType === 'hour'
                ? this.update_due_duration || 0
                : this.update_due_duration * 24 || 0,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id,
            updateTimeline: this.updateTimeline
          };
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.closeDrawer();
          // this.dialogRef.close({
          //   ...this.action,
          //   type: this.type,
          //   task_type: this.task.type,
          //   due_date: undefined,
          //   due_duration: this.update_due_duration || 0,
          //   period,
          //   command: 'update_follow_up',
          //   ref_id: this.selectedFollow.id
          // });
        }
      } else {
        const data = {
          ...this.action,
          type: this.type,
          task_type: this.task.type,
          period,
          command: 'complete_follow_up',
          ref_id: this.selectedFollow.id,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   task_type: this.task.type,
        //   period,
        //   command: 'complete_follow_up',
        //   ref_id: this.selectedFollow.id
        // });
      }
      return;
    } else if (this.type === 'automation') {
      if (this.selectedAutomation) {
        if (
          this.automation &&
          this.automation._id === this.selectedAutomation
        ) {
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Warning',
                message:
                  'You are selecting current automation and it may have this contact running forever recurring until you close by force. Are you sure to assign?',
                confirmLabel: 'Yes',
                cancelLabel: 'No'
              }
            })
            .afterClosed()
            .subscribe((answer) => {
              if (answer) {
                this.action['automation_id'] = this.selectedAutomation;
                const data = {
                  ...this.action,
                  type: this.type,
                  period,
                  updateTimeline: this.updateTimeline
                };
                if (this.editType === 'timeline') {
                  this.storeService.timelineOutputData.next(data);
                } else {
                  this.storeService.actionOutputData.next(data);
                }
                this.closeDrawer();
              }
            });
        } else {
          this.action['automation_id'] = this.selectedAutomation;
          const data = {
            ...this.action,
            type: this.type,
            period,
            updateTimeline: this.updateTimeline
          };
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.closeDrawer();
        }
      }
      return;
    }
    if (this.type === 'contact_condition') {
      const conditionField = this.action['condition_field'];
      let isPhoneField = false;
      let isDateField = false;
      const index = this.lead_fields.findIndex(
        (item) => item.name === conditionField
      );
      if (index >= 0) {
        if (this.lead_fields[index].type === 'phone') {
          isPhoneField = true;
        } else if (this.lead_fields[index].type === 'date') {
          isDateField = true;
        }
      }
      if (
        this.action['condition_field'] === 'cell_phone' ||
        this.action['condition_field'] === 'secondary_phone' ||
        isPhoneField
      ) {
        const formattedPhones = this.contactConditions.map((item) => {
          let phone_number =
            item.answer && item.answer.internationalNumber
              ? item.answer.internationalNumber
              : item.answer;
          phone_number = '+' + phone_number.replace(/\D/g, '');
          return {
            answer: phone_number,
            ref: item.ref
          };
        });
        this.action['contact_conditions'] = formattedPhones;
      } else if (
        this.action['condition_field'] === 'website' ||
        this.action['condition_field'] === 'email' ||
        this.action['condition_field'] === 'primary_email' ||
        this.action['condition_field'] === 'secondary_email'
      ) {
        this.action['contact_conditions'] = this.contactConditions.map(
          (item) => {
            return {
              answer: item.answer.trim(),
              ref: item.ref
            };
          }
        );
      } else if (isDateField) {
        const formattedDates = [];
        for (const condition of this.contactConditions) {
          if (condition && condition.year) {
            const date = new Date();
            date.setDate(condition.day);
            date.setMonth(condition.month - 1);
            date.setFullYear(condition.year);
            date.setHours(0, 0, 0, 0);
            formattedDates.push({ answer: date.toISOString() });
          } else {
            formattedDates.push(condition);
          }
        }
        this.action['contact_conditions'] = formattedDates;
      } else {
        const formattedPhones = this.contactConditions.map((item) => {
          return {
            answer:
              item.answer && item.answer.internationalNumber
                ? item.answer.internationalNumber
                : item.answer,
            ref: item.ref
          };
        });
        this.action['contact_conditions'] = formattedPhones;
      }

      const data = {
        ...this.action,
        type: this.type,
        period,
        mapConditions: this.mapConditions,
        updateTimeline: this.updateTimeline
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.closeDrawer();
      return;
    }
    if (this.type === 'appointment' || this.type === 'update_appointment') {
      if (this.appointmentDueOption === 'date') {
        const due_date = moment
          .tz(this.getSelectedDateTime(), this.selectedTimezone)
          .format();
        const data = {
          ...this.action,
          due_date: due_date,
          period,
          due_duration: undefined,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   due_date: due_date,
        //   period,
        //   due_duration: undefined
        // });
      } else {
        const data = {
          ...this.action,
          due_duration:
            this.timeUntilType == 'hour'
              ? this.due_duration
              : this.due_duration * 24,
          period,
          due_date: undefined,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        // this.dialogRef.close({
        //   ...this.action,
        //   due_duration: this.due_duration,
        //   period,
        //   due_date: undefined
        // });
      }
      return;
    } else if (this.type === 'note') {
      if (!this.action['content']) {
        return;
      }
      const data = {
        ...this.action,
        type: this.type,
        period,
        updateTimeline: this.updateTimeline
      };

      if (this.audioFile) {
        this.uploadingAudio = true;
        const formData = new FormData();
        const file = new File([this.audioFile], 'audio.wav');
        formData.append('audio', file);
        this.automationService.uploadAudio(formData).subscribe((res) => {
          this.uploadingAudio = false;
          if (res.data) {
            data['audio'] = res.data;
          }
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.closeDrawer();
          return;
        });
      } else {
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
        return;
      }
    } else if (this.type === 'audio') {
      if (this.selectedVoiceMail) {
        const data = {
          ...this.action,
          type: this.type,
          period,
          updateTimeline: this.updateTimeline
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.closeDrawer();
      }
      return;
    } else if (this.type === 'share_contact' || this.type === 'move_contact') {
      if (!this.selectedTeam || !this.selectedMember) {
        return;
      }
      let users;
      let shared_all_member = false;
      let round_robin = false;
      if (this.selectedMember === 'allMembers') {
        users = this.selectedTeam.members.map((member) => member._id);
        shared_all_member = true;
      } else if (this.selectedMember === 'round_robin') {
        users = this.selectedTeam.members.map((member) => member._id);
        round_robin = true;
      } else {
        users = [this.selectedMember._id];
      }
      this.action['share_users'] = users;
      this.action['share_all_member'] = shared_all_member;
      this.action['round_robin'] = round_robin;
      if (this.type === 'move_contact') {
        this.action['share_type'] = this.selectedMoveOption.id;
      }
      this.action['share_team'] = this.selectedTeam._id;

      const data = {
        ...this.action,
        type: this.type,
        period,
        updateTimeline: this.updateTimeline
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.closeDrawer();
    } else {
      const data = {
        ...this.action,
        type: this.type,
        period,
        updateTimeline: this.updateTimeline
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.closeDrawer();
      // this.dialogRef.close({
      //   ...this.action,
      //   type: this.type,
      //   period
      // });
    }
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

  // getActionMaterials(node): any {
  //   let materials = [];
  //   if (node['videos']) {
  //     if (Array.isArray(node['videos'])) {
  //       materials = [...node['videos']];
  //     } else {
  //       materials = [node['videos']];
  //     }
  //   }
  //   if (node['pdfs']) {
  //     if (Array.isArray(node['pdfs'])) {
  //       materials = [...materials, ...node['pdfs']];
  //     } else {
  //       materials = [...materials, node['pdfs']];
  //     }
  //   }
  //   if (node['images']) {
  //     if (Array.isArray(node['images'])) {
  //       materials = [...materials, ...node['images']];
  //     } else {
  //       materials = [...materials, node['images']];
  //     }
  //   }
  //   return materials;
  // }

  displayFn(template): any {
    if (template) {
      if (!template._id) {
        return '';
      }
      return template.title;
    }
    return '';
  }

  selectFollow(event): void {
    this.action['content'] = this.selectedFollow.content;
    if (this.selectedFollow.due_duration) {
      this.update_due_duration = this.selectedFollow.due_duration;
      this.updateFollowDueOption = 'delay';
    } else if (this.selectedFollow.due_date) {
      this.updateFollowDueOption = 'date';
      const timezoneName = getUserTimezone(this.currentUser);
      const timezone = parseFloat(
        moment().tz(timezoneName).format('Z').replace(':', '.')
      );
      const date = new Date(this.selectedFollow.due_date);
      const utc = date.getTime() + date.getTimezoneOffset() * 60000;
      const nd = new Date(utc + 3600000 * timezone);
      this.due_date = moment.tz(
        `${nd.getFullYear()}-${nd.getMonth() + 1}-${nd.getDate()} ${
          this.due_time
        }`,
        this.selectedTimezone
      );
      const hour = nd.getHours();
      const min = nd.getMinutes();
      const hour_s = hour < 10 ? '0' + hour : hour;
      const min_s = min < 10 ? '0' + min : min;
      const time = `${hour_s}:${min_s}:00.000`;
      this.times.some((e) => {
        if (e.id === time) {
          this.due_time = e.id;
          return true;
        }
      });
    }
  }

  selectTemplate(event: Template): void {
    this.selectedTemplate = event;
    this.action['subject'] = this.selectedTemplate.subject;
    this.action['content'] = this.selectedTemplate.content;
  }

  /**=======================================================
   *
   * Subject Field
   *
   ========================================================*/
  subjectCursorStart = 0;
  subjectCursorEnd = 0;
  subject = '';
  /**
   *
   * @param field : Input text field of the subject
   */
  getSubjectCursorPost(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.subjectCursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.subjectCursorEnd = field.selectionEnd;
    }
    this.subjectFocus = true;
    this.contentFocus = false;
  }

  getDealNameCursorPost(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.dealNameCursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.dealNameCursorEnd = field.selectionEnd;
    }
    this.dealNameFocus = true;
  }

  setContentFocus(): void {
    this.subjectFocus = false;
    this.contentFocus = true;
  }

  getSmsContentCursor(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.smsContentCursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.smsContentCursorEnd = field.selectionEnd;
    }
  }

  insertEmojiContentValue(value: string): void {
    this.htmlEditor.insertEmailContentValue(value, true);
  }

  insertTextContentToken(data): void {
    if (this.contentFocus) {
      this.htmlEditor.insertEmailContentToken(data.value);
    }
    if (this.subjectFocus) {
      const tokenValue = `{${data.value}}`;
      const field = this.subjectField.nativeElement;
      field.focus();
      let subject = this.action['subject'] || '';
      subject =
        subject.substr(0, this.subjectCursorStart) +
        tokenValue +
        subject.substr(
          this.subjectCursorEnd,
          subject.length - this.subjectCursorEnd
        );
      this.action['subject'] = subject;
      this.subjectCursorStart = this.subjectCursorStart + tokenValue.length;
      this.subjectCursorEnd = this.subjectCursorStart;
    }
  }

  insertDealNameValue(value, field): void {
    let dealName = this.action['deal_name'] || '';
    dealName =
      dealName.substr(0, this.dealNameCursorStart) +
      '{' +
      value +
      '}' +
      dealName.substr(
        this.dealNameCursorEnd,
        dealName.length - this.dealNameCursorEnd
      );
    this.action['deal_name'] = dealName;
    this.dealNameCursorStart = this.dealNameCursorStart + value.length;
    this.dealNameCursorEnd = this.dealNameCursorStart;
    field.focus();
  }

  insertSmsContentValue(value, field, token = false): void {
    let iValue = value;
    if (token) iValue = `{${value}}`;
    let smsContent = this.action['content'];
    smsContent =
      smsContent.substr(0, this.smsContentCursorStart) +
      iValue +
      smsContent.substr(
        this.smsContentCursorEnd,
        smsContent.length - this.smsContentCursorEnd
      );
    this.smsContentCursorStart = this.smsContentCursorStart + iValue.length;
    this.smsContentCursorEnd = this.smsContentCursorStart;
    this.action['content'] = smsContent;
  }

  NoLimitActions = [
    // 'note',
    // 'follow_up',
    // 'update_contact',
    // 'update_follow_up',
    // 'deal',
    // 'move_deal'
  ];

  numPad(num): any {
    if (num < 10) {
      return '0' + num;
    }
    return num + '';
  }

  changeLabelSelect($event, i): void {
    this.contactConditions[i].answer = $event;
    this.checkDuplicateValues(i);
  }

  changeCommandLabel($event): void {
    this.commandLabel = $event;
    const label = this.labels.find((e) => e._id === $event);
    this.commandName = label.name;
    this.error = '';
  }

  changeCommandPullTags($event): void {
    this.pullCommandTags = $event;
  }
  changeCommandPushTags($event): void {
    this.pushCommandTags = $event;
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filter();
  }

  filter(): void {
    this.filterMaterials = this.materials.filter((item) => {
      return searchReg(item.title, this.searchStr);
    });
  }

  isMaterialSetting(): any {
    if (
      this.type === 'send_email_video' ||
      this.type === 'send_text_video' ||
      this.type === 'send_email_pdf' ||
      this.type === 'send_text_pdf' ||
      this.type === 'send_email_image' ||
      this.type === 'send_text_image'
    ) {
      return true;
    } else {
      return false;
    }
  }

  getMaterialType(material: any): string {
    if (material.type) {
      if (material.type === 'application/pdf') {
        return 'pdf';
      } else if (material.type.includes('image')) {
        return 'image';
      }
    }
    return 'video';
  }

  getMaterials(): any {
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

    let matches = this.action['content'].match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video?video=', '');
        videoIds.push(videoId);
      });
    }
    matches = this.action['content'].match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const pdfId = e.replace(environment.website + '/pdf?pdf=', '');
        pdfIds.push(pdfId);
      });
    }
    matches = this.action['content'].match(imageReg);
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

  onChangeTemplate(template: Template): void {
    this.action['subject'] = template.subject;
  }

  record(): void {
    const w = 750;
    const h = 450;
    const dualScreenLeft =
      window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
      window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft;
    const top = (height - h) / 2 / systemZoom + dualScreenTop;
    const option = `width=${w}, height=${h}, top=${top}, left=${left}`;
    const ref = window.location.href;
    if (!this.popup || this.popup.closed) {
      this.popup = window.open(
        this.recordUrl +
          '/index.html?token=' +
          this.authToken +
          '&method=website&userId=' +
          this.userId +
          '&prev=' +
          encodeURIComponent(ref),
        'record',
        option
      );
      if (!this.attachedRecordCallback) {
        this.attachedRecordCallback = true;
        window.addEventListener('message', this.recordCallback);
      }
    } else {
      this.popup.focus();
    }
  }

  attachedRecordCallback = false;
  recordCallback = (e) => {
    if (e?.data?._id) {
      try {
        const url = `${environment.website}/video?video=${e.data._id}`;
        this.textAreaEl.nativeElement.focus();
        const field = this.textAreaEl.nativeElement;
        if (!this.action['content'].replace(/(\r\n|\n|\r|\s)/gm, '')) {
          field.select();
          document.execCommand('insertText', false, url);
          return;
        }
        if (field.selectionEnd || field.selectionEnd === 0) {
          if (this.action['content'][field.selectionEnd - 1] === '\n') {
            document.execCommand('insertText', false, url);
          } else {
            document.execCommand('insertText', false, '\n' + url);
          }
        } else {
          if (this.action['content'].slice(-1) === '\n') {
            document.execCommand('insertText', false, url);
          } else {
            document.execCommand('insertText', false, '\n' + url);
          }
        }
      } catch (err) {
        console.log('Insert Material is failed', err);
      }
    }
    return;
  };

  selectCalendly(url: string): void {
    this.textAreaEl.nativeElement.focus();
    const field = this.textAreaEl.nativeElement;
    const prefix = environment.isSspa
      ? environment.Vortex_Scheduler
      : environment.domain.scheduler;
    const fullUrl = url.includes('https://') ? url : `https://${prefix + url}`;
    if (!this.action['content'].replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, fullUrl);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.action['content'][field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, fullUrl);
      } else {
        document.execCommand('insertText', false, '\n' + url);
      }
    } else {
      if (this.action['content'].slice(-1) === '\n') {
        document.execCommand('insertText', false, fullUrl);
      } else {
        document.execCommand('insertText', false, '\n' + fullUrl);
      }
    }
  }

  createSMSTemplate(): void {
    this.templatePortal = new TemplatePortal(
      this.createNewSMSContent,
      this._viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        return;
      } else {
        this.overlayRef.attach(this.templatePortal);
        return;
      }
    } else {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'template-backdrop',
        panelClass: 'template-panel',
        width: '96vw',
        maxWidth: '480px'
      });
      this.overlayRef.outsidePointerEvents().subscribe((event) => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  createEmailTemplate(): void {
    this.templatePortal = new TemplatePortal(
      this.createNewEmailContent,
      this._viewContainerRef
    );
    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        return;
      } else {
        this.overlayRef.attach(this.templatePortal);
        return;
      }
    } else {
      this.overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'template-backdrop',
        panelClass: 'template-panel',
        width: '96vw',
        maxWidth: '480px'
      });
      this.overlayRef.outsidePointerEvents().subscribe((event) => {
        this.overlayRef.detach();
        return;
      });
      this.overlayRef.attach(this.templatePortal);
    }
  }

  closeOverlay(flag: boolean): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.detachBackdrop();
    }
    if (flag) {
      // this.toastr.success('', 'New template is created successfully.', {
      //   closeButton: true
      // });
      setTimeout(() => {
        this.appRef.tick();
      }, 1);
    }
    this.cdr.detectChanges();
  }

  hasEmailMaterial(): boolean {
    const content = this.action['content'];
    const materials = this.helperSerivce.getMaterials(content);
    if (materials && materials.length > 0) {
      return true;
    }
    return false;
  }

  hasSMSMaterial(): boolean {
    const content = this.action['content'];
    const { materials } = this.helperSerivce.getSMSMaterials(content);
    if (materials && materials.length > 0) {
      return true;
    }
    return false;
  }

  isDisableEmailMaterial(): boolean {
    // if (this.materialType !== '' && this.hasEmailMaterial()) {
    //   return true;
    // }
    return false;
  }

  isDisableSMSMaterial(): boolean {
    // if (this.materialType !== '' && this.hasSMSMaterial()) {
    //   return true;
    // }
    return false;
  }

  openSMSMaterialsDlg(): void {
    const content = this.action['content'];
    const { materials } = this.helperSerivce.getSMSMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        multiple: true,
        title: 'Insert material',
        hideMaterials: materials
        // material_type: this.materialType
      }
    });
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials && res.materials.length) {
        res.materials.forEach((e, index) => {
          let url;
          switch (e.material_type) {
            case 'video':
              url = `${environment.website}/video/${e._id}`;
              break;
            case 'pdf':
              url = `${environment.website}/pdf/${e._id}`;
              break;
            case 'image':
              url = `${environment.website}/image/${e._id}`;
              break;
          }
          // first element insert
          if (
            index === 0 &&
            (!this.action['content'] ||
              this.action['content'].slice(-1) === '\n')
          ) {
            this.action['content'] = this.action['content'] + '\n' + url;
            return;
          }
          if (index === 0) {
            this.action['content'] = this.action['content'] + '\n\n' + url;
            return;
          }
          // middle element insert
          this.action['content'] = this.action['content'] + '\n' + url;

          if (index === res.materials.length - 1) {
            this.action['content'] += '\n';
          }
        });
      }
    });
  }

  openEmailMaterialsDlg(): void {
    const content = this.action['content'];
    const materials = this.helperSerivce.getMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: materials,
        title: 'Insert material',
        multiple: true
        // material_type: this.materialType
      }
    });
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials) {
        this.materials = _.intersectionBy(this.materials, materials, '_id');
        this.materials = [...this.materials, ...res.materials];
        this.htmlEditor.insertBeforeMaterials();
        for (let i = 0; i < res.materials.length; i++) {
          const material = res.materials[i];
          this.htmlEditor.insertMaterials(material);
        }
        // this.htmlEditor.insertAfterMaterials();
      }
    });
  }

  onAttachmentChange(attachments: any[]): void {
    this.attachments = attachments;
    this.action['attachments'] = this.attachments;
  }

  onRecordCompleted($event): void {
    this.materials.push($event);
  }

  selectSMSTemplate(template: Template): void {
    this.selectedTemplate = template;
    this.action['content'] = convertIdToUrlOnSMS(this.selectedTemplate.content);
  }

  selectEmailTemplate(template: Template): void {
    this.selectedTemplate = template;
    this.htmlEditor.selectTemplate(template);
    this.action['subject'] = template.subject;
    if (template.attachments?.length) {
      template.attachments.forEach((e) => {
        this.attachments.push(e);
      });
    }
    this.action['attachments'] = this.attachments;
  }

  getTitle(title): string {
    if (title) {
      return title.replace('New', 'Edit');
    }
    return '';
  }

  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt._id;
  }

  handleAddressChange(evt: any): void {
    this.action.appointment.location = evt.formatted_address;
  }

  changeTimeDelayType(value): void {
    this.timeDelayType = value;
  }

  changeTimeUntilType(value): void {
    this.timeUntilType = value;
  }

  closeDrawer(): void {
    this.onClose.emit();
  }

  getFollowDuration(follow): string {
    if (follow.due_duration) {
      if (follow.due_duration >= 48) {
        const day = Math.floor(follow.due_duration / 24);
        if (day * 24 == follow.due_duration) {
          return day + ' Days';
        } else {
          return follow.due_duration + ' Hours';
        }
      } else {
        return follow.due_duration + ' Hours';
      }
    } else {
      return 'Immediately';
    }
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  changeAssignedListSearchStr(): void {
    this.filteredAssignedList = [];
    if (this.searchAssignedListStr) {
      if (this.selectedTab.id === 'contacts') {
        for (const contact of this.assignedList) {
          if (
            contact.fullName &&
            contact.fullName
              .toLowerCase()
              .indexOf(this.searchAssignedListStr.toLowerCase()) >= 0
          ) {
            this.filteredAssignedList.push(contact);
          }
        }
      } else if (this.selectedTab.id === 'deals') {
        for (const deal of this.assignedList) {
          if (
            deal.title &&
            deal.title
              .toLowerCase()
              .indexOf(this.searchAssignedListStr.toLowerCase()) >= 0
          ) {
            this.filteredAssignedList.push(deal);
          }
        }
      }
    } else {
      this.filteredAssignedList = [...this.assignedList];
    }
    this.filteredResult = [...this.filteredAssignedList];
    this.filteredFiles = [...this.assignedList];
  }

  clearAssignedListSearchStr(): void {
    this.searchAssignedListStr = '';
    this.filteredAssignedList = [...this.assignedList];
    this.filteredResult = [...this.assignedList];
    this.filteredFiles = [...this.assignedList];
  }

  /**
   * Insert the audio note to the content
   * @param $event: {file, url, content}
   */
  insertAudioNote($event: any): void {
    if ($event.file) {
      // this.htmlEditor.insertNote({
      //   content: '',
      //   created_at: moment().format('YYYY-MM-DD HH:mm a')
      // });
      this.audioFile = $event.file;
    }
  }

  /**
   * Remove the audio note from content
   */
  removeAudioNote(): void {
    this.action['audio'] = '';
    const contents = this.htmlEditor.emailEditor.quillEditor.getContents();
    const ops = contents.ops || [];
    contents.ops.some((e, index) => {
      if (e.insert?.audioNote) {
        ops.splice(index, 1);
        this.htmlEditor.emailEditor.quillEditor.setContents({ ops });
        this.htmlEditor.removeAudio();
        return true;
      }
    });
  }

  startRecordingAudioNote(): void {
    this.recordingAudio = true;
  }

  stopRecordingAudioNote(): void {
    this.recordingAudio = false;
  }

  setContactConditionType(type): void {
    this.action['condition_field'] = type;
    // if (type === 'tags') {
    //   this.contactConditions = [[]];
    // } else if (type === 'automation') {
    //   this.contactConditions = [{}];
    // } else {
    //   this.contactConditions = [''];
    // }
    this.duplicateValues = [];
    for (let i = 0; i < this.mapConditions.length; i++) {
      this.mapConditions[i] = 'remove';
    }
    this.addContactCondition();
  }

  conditionHandleCityChange(evt: any, index): void {
    for (const component of evt.address_components) {
      if (!component['types']) {
        continue;
      }
      if (
        component['types'].indexOf('sublocality_level_1') > -1 ||
        component['types'].indexOf('locality') > -1
      ) {
        this.contactConditions[index].answer = component['long_name'];
      }
    }
  }

  addContactCondition(): void {
    if (this.action['condition_field'] === 'automation') {
      this.contactConditions.push({});
    } else if (this.type === 'contact_condition') {
      this.contactConditions.push({ answer: '', ref: '' });
    } else {
      this.contactConditions.push('');
    }
    this.mapConditions.push('add');
    this.identify++;
  }

  availableActions(): number {
    const removeCount = this.mapConditions.filter(
      (condition) => condition === 'remove'
    ).length;
    return this.contactConditions.length - removeCount;
  }

  removeContactCondition(index): void {
    this.mapConditions[index] = 'remove';
    this.duplicateValues[index] = false;
  }

  selectContactConditionAutomation(automation: Automation, index): void {
    if (automation) {
      this.contactConditions[index].answer = automation._id;
    }
  }

  counter(i: number): any {
    return new Array(i);
  }

  isEmptyContactCondition(): boolean {
    const filteredContactConditions = this.contactConditions.filter(
      (_, index) => this.mapConditions[index] !== 'remove'
    );
    if (
      filteredContactConditions.some(
        (condition) => condition === null || condition === ''
      )
    ) {
      return true;
    }
  }
  isDuplicateContactCondition(): boolean {
    const filteredContactConditions = this.contactConditions.filter(
      (_, index) => this.mapConditions[index] !== 'remove'
    );
    return filteredContactConditions.some((item, index) => {
      return (
        filteredContactConditions.findIndex((el, i) => {
          return (
            i !== index &&
            JSON.stringify(el.answer) === JSON.stringify(item.answer)
          );
        }) !== -1
      );
    });
  }

  initVariables(): void {
    this.category = null;
    this.type = '';
    this.action = {};
    this.submitted = false;
    this.isCalendly = false;

    this.materials = [];
    this.materialsLoading = false;
    this.materialsError = ''; // Load Error
    this.materialError = ''; // Select Error

    this.isProcessing = true;
    this.templates = null;
    this.templateLoadError = '';
    this.myControl = new UntypedFormControl();
    this.selectedTemplate = new Template();

    this.due_date = moment();
    this.due_duration = 1;
    this.times = TIMES;
    this.followDueOption = 'date';

    // Contact Update
    this.contactUpdateOption = 'update_label';
    this.labels = [];
    this.labelsLoading = false;
    this.labelsLoadError = '';
    this.commandLabel = ''; // Label
    this.commandTags = []; // Tags
    this.selectedTags = [];

    this.mediaType = '';
    this.materialType = '';
    this.material = null;

    this.default = {
      sms: '',
      email: ''
    };

    this.periodOption = 'gap';
    this.parentId = false;

    this.plan_time = { day: 0, hour: 1, min: 0 };
    this.plan_time_delay = 1;

    this.attachmentLimit = AUTOMATION_ATTACH_SIZE;

    this.error = '';

    this.selectedFollow = null;
    this.followUpdateOption = 'update_follow_up';
    this.updateFollowDueOption = 'date';
    this.selectedDate = '';

    const current = new Date();
    this.minDate = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };

    this.update_due_duration = 0;
    this.task = new Task();

    this.searchStr = '';
    this.filterMaterials = [];

    this.set = 'twitter';
    this.templateSubject = '';
    this.templateValue = '';
    this.deal_name = '';
    this.deal_stage = '';
    this.popup = null;

    this.authToken = '';
    this.userId = '';
    this.attachments = [];
    this.smsContentCursorStart = 0;
    this.smsContentCursorEnd = 0;
    this.smsContent = '';
    this.subjectFocus = false;
    this.contentFocus = false;

    this.dealNameCursorStart = 0;
    this.dealNameCursorEnd = 0;
    this.dealNameFocus = false;

    this.nodes = [];
    this.edges = [];

    this.moveDealOption = 'next';
    this.automation_type = '';
    this.automation_label = 'contact';
    this.automation = null;
    this.selectedAutomation = '';

    this.calendar_durations = CALENDAR_DURATION;
    this.appointmentDueOption = 'delay';
    this.timeDelayType = 'hour';

    this.assignedList = [];
    this.filteredAssignedList = [];
    this.searchAssignedListStr = '';
    this.tabs = [this.actionTab];
    this.selectedTab = this.tabs[0];
    this.updateTimeline = 'update';

    this.audioFile = null;
    this.uploadingAudio = false;
    this.contactConditions = [];
    this.mapConditions = [];

    this.sortType = this.SORT_TYPES[0];
    this.selectedFiles = [];

    this.selectedMoveOption = this.moveOptions[0];
    this.selectedMoveOptionId = 1;
    this.internalTeamCount = 0;
    this.communityCount = 0;
    this.selectedTeam = null;
    this.members = [];
    this.selectedMember = null;
    this.role = 'viewer';
  }

  initDialog(): void {
    this.userService.garbage$.subscribe((res) => {
      const garbage = res;
      const cannedTemplate = garbage && garbage.canned_message;
      this.default.email = cannedTemplate && cannedTemplate.email;
      this.default.sms = cannedTemplate && cannedTemplate.sms;

      const current = new Date();
      this.minDate = {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        day: current.getDate()
      };
      if (
        garbage?.calendly &&
        Object.keys(garbage?.calendly).length &&
        !environment.isSspa
      ) {
        this.isCalendly = true;
      } else {
        this.isCalendly = false;
      }
    });

    this.appointmentService.loadCalendars(false, false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
    });

    this.templatesService.loadAll(false);

    this.duplicateValues = [];

    this.authToken = this.userService.getToken();
    this.userId = this.userService.profile.getValue()._id;

    if (this.data) {
      if (this.data.nodes) {
        this.nodes = this.data.nodes;
      }
      if (this.data.edges) {
        this.edges = this.data.edges;
      }
      if (this.data.condition_refs) {
        this.condition_refs = this.data.condition_refs;
      }
      if (this.data.automation_type) {
        this.automation_type = this.data.automation_type;
      }
      if (this.data.automation_label) {
        this.automation_label = this.data.automation_label;
      }
      if (this.data.automation) {
        this.automation = this.data.automation;
      }

      if (this.data.timelines) {
        this.timelines = this.data.timelines;
        if (this.automation_type === 'contact') {
          this.assignedList = this.timelines.map((item) => {
            return { ...item.contact, timeline: item._id, status: item.status };
          });
        } else {
          this.assignedList = this.timelines.map((item) => {
            return { ...item.deal, timeline: item._id, status: item.status };
          });
        }
        this.filteredAssignedList = [...this.assignedList];
        this.filteredResult = [...this.assignedList];
        this.filteredFiles = [...this.assignedList];
      }

      if (this.data.activeTab) {
        if (this.data.activeTab === 'list') {
          this.selectedTab = this.tabs[1];
        }
      }

      if (this.data.action) {
        if (this.data.action.type.indexOf('email') !== -1) {
          this.mediaType = 'email';
        } else {
          this.mediaType = 'text';
        }
        if (this.data.action.type.indexOf('video') !== -1) {
          this.materialType = 'video';
        }
        if (this.data.action.type.indexOf('pdf') !== -1) {
          this.materialType = 'pdf';
        }
        if (this.data.action.type.indexOf('image') !== -1) {
          this.materialType = 'image';
        }
        if (this.data.action.type.indexOf('material') !== -1) {
          this.materialType = '';
        }
        if (this.data.action.type === 'follow_up') {
          this.task.type = this.data.action.task_type;
          if (this.data.action.due_duration) {
            this.due_duration = this.data.action.due_duration;
            this.followDueOption = 'delay';
          } else if (this.data.action.due_date) {
            this.followDueOption = 'date';
            this.selectedTimezone = this.data.action.timezone;
            const due_date = moment.tz(
              this.data.action.due_date,
              this.selectedTimezone
            );
            this.due_date = due_date;
            const hour = due_date.get('hour');
            const min = due_date.get('minute');
            const hour_s = hour < 10 ? '0' + hour : hour;
            const min_s = min < 10 ? '0' + min : min;
            const time = `${hour_s}:${min_s}:00.000`;
            this.times.some((e) => {
              if (e.id === time) {
                this.due_time = e.id;
                return true;
              }
            });
          }
        }
        if (this.data.action.type === 'update_contact') {
          this.contactUpdateOption = this.data.action.commands
            ? this.data.action.commands[0]
            : 'update_label';
          this.commandLabel = this.data.action.content[0];
          this.labelService.allLabels$.subscribe((res) => {
            this.labels = res;
          });
          const label = this.labels.find((e) => e._id === this.commandLabel);
          this.commandName = label?.name;
          this.pushCommandTags = this.data.action.content[1];
          this.pullCommandTags = this.data.action.content[2];
        }

        if (this.data.action.type === 'update_follow_up') {
          this.task.type = this.data.action.task_type;
          if (this.data.action.due_date) {
            this.updateFollowDueOption = 'update_due_date';
            const due_date = moment.tz(
              this.data.action.due_date,
              this.selectedTimezone
            );
            this.due_date = due_date;
            const hour = due_date.get('hour');
            const min = due_date.get('minute');
            const hour_s = hour < 10 ? '0' + hour : hour;
            const min_s = min < 10 ? '0' + min : min;
            const time = `${hour_s}:${min_s}:00.000`;
            this.times.some((e) => {
              if (e.id === time) {
                this.due_time = e.id;
                return true;
              }
            });
          } else if (typeof this.data.action.due_duration === 'undefined') {
            this.updateFollowDueOption = 'no_update';
          } else {
            this.updateFollowDueOption = 'update_due_duration';
            this.update_due_duration = this.data.action.due_duration;
          }
          if (this.data.follows && this.data.follows.length) {
            this.data.follows.some((e) => {
              if (e.id === this.data.action.ref_id) {
                this.selectedFollow = e;
                return true;
              }
            });
          }
          this.followUpdateOption = this.data.action.command
            ? this.data.action.command
            : 'update_label';
        }

        if (this.data.action.type === 'move_deal') {
          if (this.data.action['deal_stage']) {
            this.moveDealOption = 'other';
          }
        }

        if (this.data.action.type === 'automation') {
          this.selectedAutomation = this.data.action['automation_id'];
        }

        if (this.data.action.type === 'contact_condition') {
          this.contactConditions = this.data.condition_refs;
          this.identify = this.contactConditions.length + 1;
          this.mapConditions = [];
          for (let i = 0; i < this.contactConditions.length; i++) {
            this.mapConditions.push('origin');
          }
        }

        if (
          this.data.action.type === 'appointment' ||
          this.data.action.type === 'update_appointment'
        ) {
          for (
            let i = 0;
            i < this.data.action.appointment.contacts.length;
            i++
          ) {
            const contactObj = new Contact().deserialize(
              this.data.action.appointment.contacts[i]
            );
            this.data.action.appointment.contacts.splice(i, 1, contactObj);
          }
          if (this.data.action.due_duration) {
            this.due_duration = this.data.action.due_duration;
            this.appointmentDueOption = 'delay';
          } else if (this.data.action.due_date) {
            this.appointmentDueOption = 'date';
            const timezoneName = getUserTimezone(this.currentUser);
            const timezone = parseFloat(
              moment().tz(timezoneName).format('Z').replace(':', '.')
            );
            const date = new Date(this.data.action.due_date);
            const utc = date.getTime() + date.getTimezoneOffset() * 60000;
            const nd = new Date(utc + 3600000 * timezone);
            this.due_date = this.due_date = moment.tz(
              `${nd.getFullYear()}-${nd.getMonth() + 1}-${nd.getDate()} ${
                this.due_time
              }`,
              this.selectedTimezone
            );
            const hour = nd.getHours();
            const min = nd.getMinutes();
            const hour_s = hour < 10 ? '0' + hour : hour;
            const min_s = min < 10 ? '0' + min : min;
            const time = `${hour_s}:${min_s}:00.000`;
            this.times.some((e) => {
              if (e.id === time) {
                this.due_time = e.id;
                return true;
              }
            });
          }
        }

        if (
          this.data.action.type === 'share_contact' ||
          this.data.action.type === 'move_contact'
        ) {
          this.selectedMoveOptionId = this.data.action['share_type'];
          const shareTypeIndex = this.moveOptions.findIndex(
            (item) => item.id === this.selectedMoveOptionId
          );
          if (shareTypeIndex >= 0) {
            this.selectedMoveOption = this.moveOptions[shareTypeIndex];
          }
          const team = this.data.action['share_team'];
          const teams = this.teamService.teams.getValue();
          const teamIndex = teams.findIndex((item) => item._id === team);
          if (teamIndex >= 0) {
            this.selectedTeam = teams[teamIndex];
            this.selectTeam(this.selectedTeam);
          }
        }

        if (this.data.action.type.indexOf('send_text') !== -1) {
          // REMOVED: Correction the content of automation text
        }

        // this.isAvailableAssignAt = this.data.moveDeal;
        this.type = this.data.action.type;
        this.parentId = this.data.action.parent_id;
        const fullContent = this.convertActionContentToFullUrl(
          this.data.action,
          this.type
        );
        this.action = { ...this.data.action, content: fullContent };
        this.attachments = this.action['attachments'];

        if (
          !(
            this.action['period'] == '0.17' ||
            this.action['period'] == '0.5' ||
            this.action['period'] == '1' ||
            this.action['period'] == '6' ||
            this.action['period'] == '12' ||
            this.action['period'] == '24' ||
            this.action['period'] == '48' ||
            this.action['period'] == '72' ||
            this.action['period'] == '168' ||
            this.action['period'] == '336' ||
            this.action['period'] == '0'
          )
        ) {
          const period = this.action['period'];
          // this.plan_time['day'] = Math.floor(period / 24);
          // period = period % 24;
          const min = period - Math.floor(period);
          this.plan_time['min'] = parseFloat(min.toFixed(2));
          this.plan_time['hour'] = Math.floor(period);
          if (period >= 48) {
            this.timeDelayType = 'day';
            this.plan_time_delay = Math.floor(period / 24);
          } else {
            this.timeDelayType = 'hour';
            this.plan_time_delay = period;
          }
          this.action['period'] = 'custom_date';
        }

        if (this.action.due_duration) {
          const due_duration = this.action.due_duration || 0;
          if (due_duration >= 48 && due_duration % 24 == 0) {
            this.timeUntilType = 'day';
            this.due_duration = due_duration / 24;
          } else {
            this.timeUntilType = 'hour';
          }
        }

        this.handlerService.pageName.next('detail');
        this.garbageSubscription = this.userService.garbage$.subscribe(
          (_garbage) => {
            this.lead_fields = _garbage.additional_fields.map((e) => e);
            this.templateTokens = DEFAULT_TEMPLATE_TOKENS;

            if (this.automation_label === 'scheduler') {
              this.templateTokens = [
                ...this.templateTokens,
                SCHEDULED_TIME_TOKEN
              ];
            }

            const user = this.userService.profile.getValue();
            if (!user?.assignee_info?.is_enabled) {
              this.templateTokens = this.templateTokens.filter((token) => {
                return token.id < 10; // subtract assignee tokens
              });
            }

            this.templateTokens = [
              ...this.templateTokens,
              ..._garbage.template_tokens
            ];
            this.tokens = this.templateTokens.map((e) => e.name);
          }
        );

        // const _SELF = this;
        setTimeout(() => {
          if (this.htmlEditor && this.action.content) {
            this.htmlEditor.setValue(this.action.content);
          }
          if (this.searchField) {
            this.searchField.nativeElement.blur();
          }
          if (this.data.action && !this.data.action['group']) {
            this.action['group'] = '';
          }
          if (this.memberSelector) {
            if (this.data.action['share_all_member']) {
              this.selectedMember = 'allMembers';
            } else if (this.data.action['round_robin']) {
              this.selectedMember = 'round_robin';
            } else {
              const users = this.data.action['share_users'];
              if (users.length > 0) {
                const memberIndex = this.members.findIndex(
                  (item) => item._id === users[0]
                );
                if (memberIndex >= 0) {
                  this.selectedMember = this.members[memberIndex];
                }
              }
            }
            this.memberSelector.setSelectedMember(this.selectedMember);
          }
          this.loadTeam();
        }, 500);

        this.loadSubscription = this.storeService.materials$.subscribe(
          (materials) => {
            if (materials.length > 0) {
              this.materialsLoading = false;
              if (this.materialType === '') {
                this.materials = [...materials];
                this.filterMaterials = [...materials];
              } else {
                const material = materials.filter(
                  (item) => item.material_type === this.materialType
                );
                this.materials = material;
                this.filterMaterials = material;
              }
            }
          }
        );
      }
    }
  }

  selectTimezone($event): void {
    this.selectedTimezone = $event;
  }

  setUpdateTimeline(option): void {
    this.updateTimeline = option;
  }

  isCustomContactField(field): boolean {
    const index = this.lead_fields.findIndex((item) => item.name === field);
    if (index >= 0) {
      return true;
    }
    return false;
  }

  getCustomContactField(field): any {
    const index = this.lead_fields.findIndex((item) => item.name === field);
    if (index >= 0) {
      return this.lead_fields[index];
    }
    return null;
  }

  onEmailSubjectTokenSelected(token: TemplateToken): void {
    setTimeout(() => {
      this.action['subject'] = this.action['subject'].replace(
        `#${token.name}`,
        `{${token.name}}`
      );
    }, 50);
  }

  onTextContentTokenSelected(token: TemplateToken): void {
    setTimeout(() => {
      this.action['content'] = this.action['content'].replace(
        `#${token.name}`,
        `{${token.name}}`
      );
    }, 50);
  }

  onCreateToken(): void {
    this.dialog
      .open(CreateTokenComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          tokens: this.templateTokens
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.toastr.success('New token created successfully');
        }
      });
  }

  isEmailError(email): boolean {
    if (this.submitted) {
      if (email) {
        if (validateEmail(email)) {
          return false;
        }
        return true;
      }
    }
    return false;
  }

  emailError(email): string {
    if (email) {
      if (!validateEmail(email)) {
        return 'Email is invalid';
      }
    } else {
      return 'Email is Required';
    }
    return '';
  }

  changeEmailTemplateSearchStr(): void {
    this.emailSearchResult = [];
    if (this.emailTemplateSearchStr) {
      this.emailTemplates.forEach((e) => {
        if (
          e.title
            .toLowerCase()
            .includes(this.emailTemplateSearchStr.toLowerCase())
        ) {
          this.emailSearchResult.push(e);
        }
      });
    } else {
      this.emailSearchResult = this.emailTemplates;
    }
  }

  clearEmailTemplateSearchStr(): void {
    this.emailTemplateSearchStr = '';
    this.changeEmailTemplateSearchStr();
  }

  changeTextTemplateSearchStr(): void {
    this.textSearchResult = [];
    if (this.textTemplateSearchStr) {
      this.textTemplates.forEach((e) => {
        if (
          e.title
            .toLowerCase()
            .includes(this.textTemplateSearchStr.toLowerCase())
        ) {
          this.textSearchResult.push(e);
        }
      });
    } else {
      this.textSearchResult = this.textTemplates;
    }
  }

  clearTextTemplateSearchStr(): void {
    this.textTemplateSearchStr = '';
    this.changeTextTemplateSearchStr();
  }

  getSelectedDateTime(): string {
    return `${this.due_date.format('YYYY-MM-DD')} ${this.due_time}`;
  }

  getSelectedDate(): string {
    return this.due_date.format('YYYY-MM-DD');
  }

  onSelectDateTime(dateTime): void {
    this.due_date = dateTime.date;
    this.due_time = dateTime.time;
    this.selectedTimezone = dateTime.timezone;
  }
  isAllSelected(): boolean {
    // const selectionLength =
    //   this.selectedFolders.length + this.selectedFiles.length;
    // return (
    //   this.filteredMaterials.length &&
    //   selectionLength === this.filteredMaterials.length
    // );
    return this.filteredFiles.length === this.selectedFiles.length;
  }

  pageMasterToggle(): void {
    const start = (this.page - 1) * this.pageSize.id;
    const end = start + this.pageSize.id;
    const pageMaterials = this.filteredResult.slice(start, end);
    const selectedPageMaterials = _.intersectionWith(
      this.selectedFiles,
      pageMaterials,
      (a, b) => a === b._id
    );
    if (selectedPageMaterials.length === pageMaterials.length) {
      this.selectedFiles = [];
    } else {
      const pageMaterialIds = pageMaterials.map((e) => e._id);
      this.selectedFiles = _.union(this.selectedFiles, pageMaterialIds);
    }
    // this.changeCaptureAction();
    this.getBulkActions();
  }

  isPageSelected(): boolean {
    const start = (this.page - 1) * this.pageSize.id;
    const end = start + this.pageSize.id;
    const pageMaterials = this.filteredResult.slice(start, end);
    const selectedPageMaterials = _.intersectionWith(
      this.selectedFiles,
      pageMaterials,
      (a, b) => a === b._id
    );
    if (pageMaterials.length) {
      return selectedPageMaterials.length === pageMaterials.length;
    } else {
      return false;
    }
  }

  isSelected(element: Automation): boolean {
    const pos = [...this.selectedFiles].indexOf(element._id);
    if (pos !== -1) {
      return true;
    } else {
      return false;
    }
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedFiles = [];
    } else {
      this.selectedFiles = this.filteredFiles.map((e) => e._id);
    }
    // this.changeCaptureAction();
    this.getBulkActions();
  }

  toggleElement(element: Automation): void {
    const selectionTemp = this.selectedFiles;
    const pos = selectionTemp.indexOf(element._id);
    if (pos !== -1) {
      selectionTemp.splice(pos, 1);
    } else {
      selectionTemp.push(element._id);
    }
    // this.changeCaptureAction();
    this.getBulkActions();
  }

  changePage(page: number): void {
    this.page = page;
  }

  changePageSize(type: any): void {
    this.pageSize = type;
  }

  changeSort(type: any): void {
    this.sortType = type;
    if (this.sortType.id === '') {
      this.filteredResult = [...this.assignedList];
    } else {
      this.filteredResult = this.assignedList.filter(
        (item) => item.status === this.sortType.id
      );
    }
    this.selectedFiles = [];
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

  getBulkActions(): void {
    this.ACTIONS = [];
    const activeTimelines = [];
    const pauseTimelines = [];
    for (const selected of this.selectedFiles) {
      const index = this.filteredResult.findIndex(
        (item) => item._id == selected
      );
      if (index >= 0) {
        if (this.filteredResult[index].status === 'active') {
          activeTimelines.push(selected);
        } else if (this.filteredResult[index].status === 'paused') {
          pauseTimelines.push(selected);
        }
      }
    }
    if (activeTimelines.length === this.selectedFiles.length) {
      this.ACTIONS = [BulkActions.Timeline[0]];
    } else if (pauseTimelines.length === this.selectedFiles.length) {
      this.ACTIONS = [BulkActions.Timeline[1]];
    }
  }

  changeBulkActionLoading(command, loading): void {
    const index = this.ACTIONS.findIndex((item) => item.command === command);
    if (index >= 0) {
      this.ACTIONS[index].loading = loading;
    }
  }

  updateTimelineStatus(status): void {
    for (const selected of this.selectedFiles) {
      const filteredIndex = this.filteredResult.findIndex(
        (item) => item._id === selected
      );
      if (filteredIndex >= 0) {
        this.filteredResult[filteredIndex].status = status;
      }
      const assignedIndex = this.assignedList.findIndex(
        (item) => item._id === selected
      );
      if (assignedIndex >= 0) {
        this.assignedList[assignedIndex].status = status;
      }
    }
    this.filteredResult = [...this.filteredResult];
  }

  doAction(evt: any): void {
    const ids = [];
    for (const selected of this.selectedFiles) {
      const filteredIndex = this.filteredResult.findIndex(
        (item) => item._id === selected
      );
      if (filteredIndex >= 0) {
        ids.push(this.filteredResult[filteredIndex].timeline);
      }
    }
    const data = { ids };

    if (evt.command === 'pause') {
      data['status'] = 'paused';
      this.changeBulkActionLoading(evt.command, true);
      this.updateTimelineSubscription?.unsubscribe();
      this.updateTimelineSubscription = this.automationService
        .updateTimelineStatus(data)
        .subscribe((res) => {
          this.changeBulkActionLoading(evt.command, false);
          if (res && res.data) {
            this.updateTimelineStatus('paused');
            this.selectedFiles = [];
            this.getBulkActions();
          }
        });
    } else if (evt.command === 'retry') {
      this.dialog
        .open(ResetDateTimeComponent, {
          ...DialogSettings.NOTE,
          data: {
            title: 'Set Date&Time'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.changeBulkActionLoading(evt.command, true);
            this.updateTimelineSubscription?.unsubscribe();
            data['status'] = 'active';
            data['due_date'] = res.due_date;
            this.updateTimelineSubscription = this.automationService
              .updateTimelineStatus(data)
              .subscribe((response) => {
                this.changeBulkActionLoading(evt.command, false);
                if (response && response.data) {
                  this.updateTimelineStatus('active');
                  this.selectedFiles = [];
                  this.getBulkActions();
                }
              });
          }
        });
    }
  }

  selectMoveOptions(): void {
    this.selectedMoveOption = this.moveOptions[this.selectedMoveOptionId - 1];
  }

  selectTeam($event): void {
    if ($event) {
      this.selectedTeam = $event;
      this.members = [];
      for (const owner of this.selectedTeam.owner) {
        this.members.push(owner);
        if (owner._id === this.userId) {
          this.role = 'owner';
        }
      }
      for (const editor of this.selectedTeam.editors) {
        this.members.push(editor);
        if (editor._id === this.userId) {
          this.role = 'editor';
        }
      }
      for (const member of this.selectedTeam.members) {
        this.members.push(member);
        if (member._id === this.userId) {
          this.role = 'viewer';
        }
      }

      // remove yourself from members.
      const index = this.members.findIndex((item) => item._id === this.userId);
      if (index >= 0) {
        this.members.splice(index, 1);
      }
    } else {
      this.selectedTeam = null;
      this.members = [];
    }
  }

  selectMember($event): void {
    if ($event) {
      this.selectedMember = $event;
    } else {
      this.selectedMember = null;
    }
  }

  convertActionContentToFullUrl(node: any, type: string): string {
    if (type.includes('text')) {
      return convertIdToUrlOnSMS(node?.content ?? '');
    }
    return node?.content ?? '';
  }
  onChangeStage(evt: any): void {
    this.action['deal_stage'] = evt;
  }
}
