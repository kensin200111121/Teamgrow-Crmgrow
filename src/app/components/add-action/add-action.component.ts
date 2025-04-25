import {
  Component,
  OnInit,
  ViewChild,
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
  ACTION_CAT,
  TIMES,
  DefaultMessage,
  AUTOMATION_ICONS,
  STATUS,
  CALENDAR_DURATION,
  AUTOMATION_ATTACH_SIZE,
  CONTACT_PROPERTIES,
  PHONE_COUNTRIES,
  DEFAULT_TEMPLATE_TOKENS,
  SCHEDULED_TIME_TOKEN,
  REGIONS,
  HOURS,
  orderOriginal,
  DialogSettings,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { MaterialService } from '@services/material.service';
import { Subscription } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { UserService } from '@services/user.service';
import { FileService } from '@services/file.service';
import { TabItem, TemplateToken } from '@utils/data.types';
import { Task } from '@models/task.model';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import moment from 'moment-timezone';
import { Template } from '@models/template.model';
import {
  getNextBusinessDate,
  getUserTimezone,
  searchReg,
  validateEmail
} from '@app/helper';
import { StoreService } from '@services/store.service';
import { TemplatesService } from '@services/templates.service';
import { ConnectService } from '@services/connect.service';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ToastrService } from 'ngx-toastr';
import { DealsService } from '@services/deals.service';
import { environment } from '@environments/environment';
import { HelperService } from '@services/helper.service';
import * as _ from 'lodash';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { CaseMaterialConfirmComponent } from '@components/case-material-confirm/case-material-confirm.component';
import { CaseConfirmPercentComponent } from '@components/case-confirm-percent/case-confirm-percent.component';
import { AppointmentService } from '@services/appointment.service';
import { LabelService } from '@services/label.service';
import { DialerService } from '@services/dialer.service';
import { TagService } from '@services/tag.service';
import { AudioNoteComponent } from '@components/audio-note/audio-note.component';
import { Contact } from '@models/contact.model';
import { AutomationService } from '@services/automation.service';
import { CountryISO } from 'ngx-intl-tel-input';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { ContactService } from '@services/contact.service';
import { Automation } from '@models/automation.model';
import { HandlerService } from '@services/handler.service';
import { CreateTokenComponent } from '@components/create-token/create-token.component';
import { TeamService } from '@services/team.service';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { convertIdToUrlOnSMS, convertURLToIdOnSMS } from '@app/utils/functions';
import { SegmentedMessage } from 'sms-segments-calculator';

@Component({
  selector: 'app-add-action',
  templateUrl: './add-action.component.html',
  styleUrls: ['./add-action.component.scss']
})
export class AddActionComponent implements OnInit, OnDestroy {
  minDate;

  stepIndex = 1; // ACTION DEFINE STEP | 1: Action List View, 2: Action Detail Setting
  type = ''; // ACTION TYPE
  category; // ACTION CATEGORY
  action = {}; // ACTION CONTENT
  submitted = false; // SUBMITTING FALSE
  conditionAction = []; // Condition Case Action corresponds the prev action
  material_type = '';
  STATUS = STATUS;
  isCalendly = false;

  videos = [];
  videosLoading = false;

  pdfs = [];
  pdfsLoading = false;

  images = [];
  imagesLoading = false;

  materialError = '';
  templateLoadingSubscription: Subscription;
  isProcessing = true;
  templates;
  templateLoadError = '';
  myControl = new UntypedFormControl();
  selectedTemplate: Template = new Template();
  // Follow Create
  due_date;
  due_time = '12:00:00.000';
  due_duration = 1;
  times = TIMES;
  followDueOption = 'delay';
  plan_time = { day: 0, hour: 1, min: 0 };
  plan_time_delay = 1;
  // Contact Update
  contactUpdateOption = 'update_label';
  labels = [];
  labelsLoading = false;
  labelsLoadError = '';
  commandLabel = ''; // Label
  pushCommandTags = [];
  pullCommandTags = [];
  actionData;
  mediaType = '';
  materialType = '';
  hasInternal = true;
  duplicateValues: boolean[] = [];
  segments = 0;
  redirectArticleURL =
    'https://kb1.crmgrow.com/kb/guide/en/sms-texting-character-limits-8DWOLjE5ZS/Steps/4023017';
  default = {
    sms: '',
    email: ''
  };

  // periodOption = 'gap'
  // condPeriodOption = 'limit';

  currentUser;
  task = new Task();
  attachLimit = AUTOMATION_ATTACH_SIZE;

  selectedTimezone = moment()['_z']?.name
    ? moment()['_z'].name
    : moment.tz.guess();

  emailTemplateSearchStr = '';
  textTemplateSearchStr = '';
  emailTemplates: Template[] = [];
  textTemplates: Template[] = [];
  emailSearchResult: Template[] = [];
  textSearchResult: Template[] = [];

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  @ViewChild('searchInput') searchField: ElementRef;
  @ViewChild('subjectField') subjectField: ElementRef;
  error = '';

  selectedFollow: any;
  followUpdateOption = 'no_update';
  updateFollowDueOption = 'date';
  update_due_duration = 0;
  selectedDate = '';

  searchStr = '';
  filterVideos = [];
  filterPdfs = [];
  filterImages = [];
  commandName;
  templateSubscription: Subscription;
  loadSubscription: Subscription;
  profileSubscription: Subscription;
  dialerSubscription: Subscription;

  @ViewChild('smsContentField') textAreaEl: ElementRef;

  set = 'twitter';
  templatePortal: TemplatePortal;
  @ViewChild('createNewSMSContent') createNewSMSContent: TemplateRef<unknown>;
  @ViewChild('createNewEmailContent')
  createNewEmailContent: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templateSubject = '';
  templateValue = '';
  deal_name = '';
  deal_stage = '';
  popup;
  recordUrl = 'https://crmgrow-record.s3-us-west-1.amazonaws.com';
  authToken = '';
  userId = '';
  attachments = [];
  materials = [];
  rvms = [];

  smsContentCursorStart = 0;
  smsContentCursorEnd = 0;
  smsContent = '';
  subjectFocus = false;
  contentFocus = false;

  dealNameCursorStart = 0;
  dealNameCursorEnd = 0;
  dealNameFocus = false;

  parentAction = {};
  childRef = null;

  moveDealOption = 'next';
  automation_type = 'any';
  automation_label = 'contact';
  currentAutomationType = 'any';
  selectedAutomation = '';
  automation = null;
  isAvailableAssignAt: false;

  calendar_durations = CALENDAR_DURATION;
  appointmentEvent = {
    title: '',
    duration: 0.5,
    contacts: [],
    calendar: null,
    location: '',
    description: ''
  };
  appointmentDueOption = 'delay';
  timeDelayType = 'hour';
  timeUntilType = 'hour';
  selectedVoiceMail = null;
  @Input('automationId') automationId = '';
  @Output() onClose = new EventEmitter();
  @Output() onOpen = new EventEmitter();
  data;
  actionInputSubscription: Subscription;

  getActionTimelineSubscription: Subscription;
  loadingTimelines = false;
  timelines = [];
  assignedList = [];
  actionTab = { icon: '', label: 'Action', id: 'action' };
  tabs: TabItem[] = [];
  selectedTab: TabItem = this.tabs[0];
  updateTimeline = 'update';

  filteredAssignedList = [];
  searchAssignedListStr = '';

  audioFile;
  uploadingAudio = false;
  recordingAudio = false;

  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;
  @ViewChild('secondPhoneControl') secondPhoneControl: PhoneInputComponent;
  @ViewChild('cityplacesRef') cityPlaceRef: GooglePlaceDirective;

  contactProperties = CONTACT_PROPERTIES;
  contactConditions = [];
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  LOCATION_COUNTRIES = ['US', 'CA'];
  COUNTRIES: { code: string; name: string }[] = [];
  COUNTRY_REGIONS = {};
  orderOriginal = orderOriginal;
  lead_fields: any[] = [];
  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name'
  };
  templateTokens: TemplateToken[] = [];
  tokens: string[] = [];
  garbageSubscription: Subscription;

  startTime = HOURS[0].id;
  endTime = HOURS[23].id;

  businessDay = {
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true
  };
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
  filteredResult: Contact[] = [];
  filteredFiles: any[] = [];
  selectedFiles: any[] = [];
  selectedSort = 'status';
  ACTIONS = [];
  sortType = this.SORT_TYPES[0];
  readAssign = true;

  editType = 'action';

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

  constructor(
    private dialog: MatDialog,
    public materialService: MaterialService,
    private userService: UserService,
    public templatesService: TemplatesService,
    private _viewContainerRef: ViewContainerRef,
    public connectService: ConnectService,
    private toastr: ToastrService,
    private overlay: Overlay,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private helperSerivce: HelperService,
    public labelService: LabelService,
    public storeService: StoreService,
    private appointmentService: AppointmentService,
    private dialerService: DialerService,
    private tagService: TagService,
    private automationService: AutomationService,
    private contactService: ContactService,
    private handlerService: HandlerService,
    private teamService: TeamService
  ) {
    this.tagService.getAllTags(false);
    this.tagService.tags$.subscribe((tags) => {
      this.filteredTags = tags;
    });
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile.time_zone_info) {
          this.selectedTimezone = getUserTimezone(profile, false);
          this.due_date = getNextBusinessDate(
            this.businessDay,
            this.selectedTimezone
          );
        }
      }
    );

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

      if (garbage.business_time) {
        this.startTime = garbage.business_time.start_time;
        this.endTime = garbage.business_time.end_time;
      }
      if (garbage.business_day) {
        const availableDays = Object.values(garbage.business_day).filter(
          (item) => item
        );
        if (availableDays.length > 0) {
          this.businessDay = garbage.business_day;
        }
      }
      this.due_date = getNextBusinessDate(
        this.businessDay,
        this.selectedTimezone
      );
      this.due_time = this.startTime;
    });
    this.labelService.allLabels$.subscribe((res) => {
      this.labels = res;
    });
    // this.appointmentService.loadCalendars(false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
    });

    this.templatesService.loadAll(false);

    this.duplicateValues = [];

    this.dialerSubscription && this.dialerSubscription.unsubscribe();
    this.dialerSubscription = this.dialerService.rvms$.subscribe((res) => {
      if (res && res['success']) {
        this.rvms = res['messages'];
      }
    });

    this.authToken = this.userService.getToken();
    this.userId = this.userService.profile.getValue()._id;

    this.storeService.actionInputData$.subscribe((res) => {
      if (res) {
        this.initVariables();
        this.data = res;
        this.editType = 'action';
        this.initDialog();
      }
    });

    this.storeService.timelineInputData$.subscribe((res) => {
      if (res) {
        this.initVariables();
        this.data = res;
        this.editType = 'timeline';
        this.initDialog();
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
    const profile = this.userService.profile.getValue();
    if (environment.isSspa) {
      this.internalOnly = true;
    } else if (profile?.user_version < 2.3) {
      this.internalOnly = false;
    }

    // Enable the corresponding the condition option

    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });

    this.videosLoading = true;
    this.pdfsLoading = true;
    this.imagesLoading = true;

    this.action['period'] = 0;
    this.action['group'] = undefined;

    this.COUNTRIES = this.contactService.COUNTRIES;
    this.COUNTRY_REGIONS = REGIONS;

    if (this.data) {
      if (this.data.currentAction === 'email') {
        this.conditionAction = ['opened_email'];
      }
      if (
        this.data.currentAction === 'follow_up' ||
        this.data.currentAction === 'update_follow_up'
      ) {
        this.conditionAction = ['task_check'];
      }
      if (
        this.data.currentAction === 'send_text_video' ||
        this.data.currentAction === 'send_email_video'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_pdf' ||
        this.data.currentAction === 'send_email_pdf'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_image' ||
        this.data.currentAction === 'send_email_image'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_material' ||
        this.data.currentAction === 'send_email_material'
      ) {
        this.conditionAction = ['watched_material'];
      }

      //set time delay to 1 day for no case
      if (
        this.data.conditionHandler &&
        this.data.conditionHandler == 'falseCase'
      ) {
        this.action['period'] = 24;
      }
    }

    setTimeout(() => {
      if (this.searchField) {
        this.searchField.nativeElement.blur();
      }
    }, 300);

    this.loadTeam();
  }

  ngOnDestroy(): void {
    this.templateSubscription && this.templateSubscription.unsubscribe();
    window.removeEventListener('message', this.recordCallback);
  }

  isConditionAction(type): boolean {
    if (this.conditionAction.length > 0) {
      if (this.conditionAction.indexOf(type) >= 0) {
        return true;
      }
    }
    return false;
  }

  removeError(): void {
    this.error = '';
  }

  fillContent(action): void {
    this.stepIndex++;
    if (this.type !== action.type) {
      this.submitted = false;
      this.type = action.type;
      this.category = action.category;

      if (this.type.indexOf('deal') < 0) {
        this.action['content'] = '';
        this.action['videos'] = {};
        this.action['pdfs'] = {};
        this.action['images'] = {};
        this.action['subject'] = '';
      }
    }
    if (this.type === 'update_follow_up') {
      this.selectedFollow = undefined;
      this.followUpdateOption = 'update_follow_up';
      this.updateFollowDueOption = 'no_update';
      this.update_due_duration = 0;
      if (this.data.follows && this.data.follows.length > 0) {
        this.selectedFollow = this.data.follows[0];
      }
    }
    if (
      (action.type === 'send_text_material' ||
        action.type === 'send_email_material') &&
      !this.videos.length &&
      !this.pdfs.length &&
      !this.images.length
    ) {
      if (action.type === 'send_text_material') {
        this.type = 'send_text_video';
        this.material_type = 'text';
      } else {
        this.type = 'send_email_video';
        this.material_type = 'email';
      }
    }
    if (action.type === 'audio') {
      this.action['voicemail'] = 'voicemailcreate';
    }
    if (action.type === 'contact_condition') {
      this.action['group'] = 'primary';
    }

    this.loadSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        if (materials.length > 0) {
          this.videosLoading = false;
          this.pdfsLoading = false;
          this.imagesLoading = false;

          const video = materials.filter(
            (item) => item.material_type === 'video'
          );
          this.videos = video;
          this.filterVideos = video;

          const pdf = materials.filter((item) => item.material_type === 'pdf');
          this.pdfs = pdf;
          this.filterPdfs = pdf;

          const image = materials.filter(
            (item) => item.material_type === 'image'
          );
          this.images = image;
          this.filterImages = image;
        }
      }
    );
    this.loadTemplates();
  }

  toggleVideo(video): void {
    this.action['videos'] = video;
    this.action['pdfs'] = null;
    this.action['images'] = null;
    this.materialError = '';
  }

  togglePdf(pdf): void {
    this.action['pdfs'] = pdf;
    this.action['videos'] = null;
    this.action['images'] = null;
    this.materialError = '';
  }

  toggleImage(image): void {
    this.action['images'] = image;
    this.action['videos'] = null;
    this.action['pdfs'] = null;
    this.materialError = '';
  }

  prevStep(): void {
    this.stepIndex--;
    this.materialError = '';
  }
  decideCaseAction(action_type): void {
    if (
      this.parentAction &&
      this.parentAction['id'] &&
      action_type.type === 'task_check'
    ) {
      const data = {
        category: ACTION_CAT.CONDITION,
        ...action_type
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.close();
    } else if (
      this.parentAction &&
      this.parentAction['id'] &&
      action_type.type !== 'opened_email'
    ) {
      const content = this.parentAction['content'];
      let materials;
      if (
        this.parentAction['type'] === 'send_text_video' ||
        this.parentAction['type'] === 'send_text_pdf' ||
        this.parentAction['type'] === 'send_text_image' ||
        this.parentAction['type'] === 'send_text_material' ||
        this.parentAction['type'] === 'text'
      ) {
        const fullContent = convertIdToUrlOnSMS(
          this.parentAction['content'] ?? ''
        );
        materials =
          this.helperSerivce.getSMSMaterials(fullContent).materials || [];
      } else if (
        this.parentAction['type'] === 'send_email_pdf' ||
        this.parentAction['type'] === 'send_email_video' ||
        this.parentAction['type'] === 'send_email_image' ||
        this.parentAction['type'] === 'send_email_material' ||
        this.parentAction['type'] === 'email'
      ) {
        materials = this.helperSerivce.getMaterials(content);
      }

      if (materials) {
        if (materials.length > 1) {
          const confirmDialog = this.dialog.open(CaseMaterialConfirmComponent, {
            width: '90vw',
            maxWidth: '500px',
            disableClose: true,
            data: { materials }
          });
          this.closeDrawer();
          confirmDialog.afterClosed().subscribe((res) => {
            if (res) {
              const review = res.review;
              if (res.review === 0) {
                const data = {
                  category: ACTION_CAT.CONDITION,
                  ...action_type,
                  multipleReview: true,
                  review
                };
                this.actionData = data;
              } else if (res.review === 1) {
                const data = {
                  category: ACTION_CAT.CONDITION,
                  ...action_type,
                  multipleReview: false,
                  review
                };
                this.actionData = data;
              } else if (res.review === 2) {
                const data = {
                  category: ACTION_CAT.CONDITION,
                  ...action_type,
                  multipleReview: false,
                  primary: res.primary,
                  review
                };
                this.actionData = data;
              }
              const videos = materials.filter(
                (item) =>
                  item.type === 'video' || item.material_type === 'video'
              ).length;
              let selectedMaterial = null;
              if (res.review === 2 && res.primary) {
                const index = materials.findIndex(
                  (item) => item._id === res.primary
                );
                if (index >= 0) {
                  selectedMaterial = materials[index];
                }
              }
              if (
                (res.review !== 2 && videos === 1) ||
                (res.review === 2 && selectedMaterial?.type === 'video')
              ) {
                const confirmDialog = this.dialog.open(
                  CaseConfirmPercentComponent,
                  {
                    width: '90vw',
                    maxWidth: '500px'
                  }
                );
                this.closeDrawer();
                confirmDialog.afterClosed().subscribe((res) => {
                  if (res['status'] === true) {
                    const data = {
                      ...this.actionData,
                      percent: res['percent']
                    };
                    if (this.editType === 'timeline') {
                      this.storeService.timelineOutputData.next(data);
                    } else {
                      this.storeService.actionOutputData.next(data);
                    }
                    this.close();
                    this.openDrawer();
                  } else if (res['status'] === false) {
                    if (res['setPercent']) {
                      this.close();
                      this.openDrawer();
                    } else {
                      this.storeService.actionOutputData.next(this.actionData);
                      this.close();
                      this.openDrawer();
                    }
                  }
                });
              } else {
                this.storeService.actionOutputData.next(this.actionData);
              }
            } else {
              this.close();
              this.openDrawer();
            }
          });
        } else {
          const material = materials[0];
          if (material.material_type === 'video') {
            const confirmDialog = this.dialog.open(
              CaseConfirmPercentComponent,
              {
                width: '90vw',
                maxWidth: '500px'
              }
            );
            this.closeDrawer();
            confirmDialog.afterClosed().subscribe((res) => {
              if (res['status'] === true) {
                const data = {
                  category: ACTION_CAT.CONDITION,
                  ...action_type,
                  multipleReview: false,
                  percent: res['percent']
                };
                if (this.editType === 'timeline') {
                  this.storeService.timelineOutputData.next(data);
                } else {
                  this.storeService.actionOutputData.next(data);
                }
                this.close();
                this.openDrawer();
              } else if (res['status'] === false) {
                if (res['setPercent']) {
                  this.close();
                  this.openDrawer();
                } else {
                  const data = {
                    category: ACTION_CAT.CONDITION,
                    ...action_type,
                    multipleReview: false
                  };
                  if (this.editType === 'timeline') {
                    this.storeService.timelineOutputData.next(data);
                  } else {
                    this.storeService.actionOutputData.next(data);
                  }
                  this.close();
                  this.openDrawer();
                }
              }
            });
          } else {
            const data = {
              category: ACTION_CAT.CONDITION,
              ...action_type,
              multipleReview: false
            };
            if (this.editType === 'timeline') {
              this.storeService.timelineOutputData.next(data);
            } else {
              this.storeService.actionOutputData.next(data);
            }
          }
        }
      } else {
        const data = {
          category: ACTION_CAT.CONDITION,
          ...action_type,
          multipleReview: false
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.close();
      }
    } else {
      const data = {
        category: ACTION_CAT.CONDITION,
        ...action_type
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.close();
      // this.dialogRef.close({ category: ACTION_CAT.CONDITION, ...action_type });
    }
  }

  decideAction(): void {
    if (
      this.isDuplicateContactCondition() ||
      this.isEmptyContactCondition() ||
      this.duplicateValues.some((value) => value === true)
    )
      return;
    let period = this.action['period'] || 0;
    if (this.action['period'] == 'custom_date') {
      if (this.timeDelayType === 'hour') {
        period = this.plan_time_delay;
      } else {
        period = this.plan_time_delay * 24;
      }

      if (!period) {
        return;
      }
    }

    this.action['videos'] = [];
    this.action['pdfs'] = [];
    this.action['images'] = [];
    if (this.type === 'email') {
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
            } else if (this.materials[index].material_type === 'pdf') {
              this.type = 'send_email_pdf';
            } else if (this.materials[index].material_type === 'image') {
              this.type = 'send_email_image';
            }
          }
        } else {
          this.type = 'send_email_material';
        }

        for (const material of insertedMaterials) {
          const index = this.materials.findIndex(
            (item) => item._id === material._id
          );
          if (index >= 0) {
            if (this.materials[index].material_type === 'video') {
              if (this.action['videos']) {
                if (Array.isArray(this.action['videos'])) {
                  this.action['videos'] = [
                    ...this.action['videos'],
                    material._id
                  ];
                } else {
                  this.action['videos'] = [material._id];
                }
              } else {
                this.action['videos'] = [];
              }
            } else if (this.materials[index].material_type === 'pdf') {
              if (this.action['pdfs']) {
                if (Array.isArray(this.action['pdfs'])) {
                  this.action['pdfs'] = [...this.action['pdfs'], material._id];
                } else {
                  this.action['pdfs'] = [material._id];
                }
              } else {
                this.action['pdfs'] = [];
              }
            } else if (this.materials[index].material_type === 'image') {
              if (this.action['images']) {
                if (Array.isArray(this.action['images'])) {
                  this.action['images'] = [
                    ...this.action['images'],
                    material._id
                  ];
                } else {
                  this.action['images'] = [material._id];
                }
              } else {
                this.action['images'] = [];
              }
            }
          }
        }
      }
    }
    if (this.type === 'text') {
      const content = this.action['content'];
      if (content.length > 1600) {
        return;
      }
      const { materials: insertedMaterials } =
        this.helperSerivce.getSMSMaterials(content);
      if (insertedMaterials && insertedMaterials.length > 0) {
        if (insertedMaterials && insertedMaterials.length === 1) {
          const index = this.materials.findIndex(
            (item) => item._id === insertedMaterials[0]._id
          );
          if (index >= 0) {
            if (this.materials[index].material_type === 'video') {
              this.type = 'send_text_video';
            } else if (this.materials[index].material_type === 'pdf') {
              this.type = 'send_text_pdf';
            } else if (this.materials[index].material_type === 'image') {
              this.type = 'send_text_image';
            }
          }
        } else {
          this.type = 'send_text_material';
        }

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
        this.action['content'] = convertURLToIdOnSMS(content);
      }
    }
    if (this.type === 'follow_up') {
      if (this.followDueOption === 'date') {
        if (!this.selectedTimezone) {
          return;
        }
        const due_date = moment
          .tz(this.getSelectedDateTime(), this.selectedTimezone)
          .format();
        const data = {
          ...this.action,
          type: this.type,
          task_type: this.task.type,
          category: this.category,
          due_date: due_date,
          period,
          timezone: this.selectedTimezone,
          updateTimeline: this.updateTimeline,
          is_assigned: this.timelines.length > 0,
          actionTimelines: this.timelines
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.close();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   task_type: this.task.type,
        //   category: this.category,
        //   due_date: due_date,
        //   period
        // });
      } else {
        const data = {
          ...this.action,
          type: this.type,
          task_type: this.task.type,
          category: this.category,
          due_duration:
            this.timeUntilType === 'hour'
              ? this.due_duration
              : this.due_duration * 24,
          period,
          updateTimeline: this.updateTimeline,
          is_assigned: this.timelines.length > 0,
          actionTimelines: this.timelines
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.close();
        // this.dialogRef.close({
        //   ...this.action,
        //   type: this.type,
        //   task_type: this.task.type,
        //   category: this.category,
        //   due_duration: this.due_duration,
        //   period
        // });
      }
      return;
    }
    if (this.type === 'update_contact') {
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
        const data = {
          type: this.type,
          category: this.category,
          period,
          commands,
          content,
          updateTimeline: this.updateTimeline,
          is_assigned: this.timelines.length > 0,
          actionTimelines: this.timelines
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.close();
        // this.dialogRef.close({
        //   type: this.type,
        //   category: this.category,
        //   period,
        //   command,
        //   content
        // });
        return;
      }
    }
    if (this.type === 'deal') {
      this.action['deal_name'] = this.deal_name;
      this.action['deal_stage'] = this.deal_stage;
      const data = {
        ...this.action,
        type: this.type,
        category: this.category,
        period,
        updateTimeline: this.updateTimeline,
        is_assigned: this.timelines.length > 0,
        actionTimelines: this.timelines
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.close();
      return;
      // this.dialogRef.close({
      //   ...this.action,
      //   type: this.type,
      //   category: this.category,
      //   period
      // });
    }
    if (this.type === 'move_deal') {
      if (this.moveDealOption === 'other') {
        this.action['deal_stage'] = this.deal_stage;
      }
      const data = {
        ...this.action,
        type: this.type,
        category: this.category,
        period,
        updateTimeline: this.updateTimeline,
        is_assigned: this.timelines.length > 0,
        actionTimelines: this.timelines
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.close();
      return;
    }
    if (this.type === 'update_follow_up') {
      if (this.followUpdateOption === 'update_follow_up') {
        if (this.updateFollowDueOption === 'no_update') {
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            category: this.category,
            due_duration: undefined,
            due_date: undefined,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id,
            updateTimeline: this.updateTimeline,
            is_assigned: this.timelines.length > 0,
            actionTimelines: this.timelines
          };
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.close();
        } else if (this.updateFollowDueOption === 'update_due_date') {
          const due_date = moment
            .tz(this.getSelectedDateTime(), this.selectedTimezone)
            .format();
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            category: this.category,
            due_date: due_date,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id,
            timeZone: this.selectedTimezone,
            updateTimeline: this.updateTimeline,
            is_assigned: this.timelines.length > 0,
            actionTimelines: this.timelines
          };
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.close();
        } else {
          const data = {
            ...this.action,
            type: this.type,
            task_type: this.task.type,
            category: this.category,
            due_duration:
              this.timeUntilType === 'hour'
                ? this.update_due_duration || 0
                : this.update_due_duration * 24 || 0,
            period,
            command: 'update_follow_up',
            ref_id: this.selectedFollow.id,
            updateTimeline: this.updateTimeline,
            is_assigned: this.timelines.length > 0,
            actionTimelines: this.timelines
          };
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.close();
        }
      } else {
        const data = {
          ...this.action,
          type: this.type,
          task_type: this.task.type,
          category: this.category,
          period,
          command: 'complete_follow_up',
          ref_id: this.selectedFollow.id,
          updateTimeline: this.updateTimeline,
          is_assigned: this.timelines.length > 0,
          actionTimelines: this.timelines
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.close();
      }
      return;
    } else if (this.type === 'note') {
      if (this.action['content'] === '') {
        return;
      } else {
        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          period,
          updateTimeline: this.updateTimeline,
          is_assigned: this.timelines.length > 0,
          actionTimelines: this.timelines
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
            this.close();
            return;
          });
        } else {
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.close();
          return;
        }
      }
    } else if (this.type === 'automation') {
      if (this.selectedAutomation) {
        if (this.automation?.parent_id === this.selectedAutomation) {
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
                  category: this.category,
                  period,
                  updateTimeline: this.updateTimeline,
                  is_assigned: this.timelines.length > 0,
                  actionTimelines: this.timelines
                };
                if (this.editType === 'timeline') {
                  this.storeService.timelineOutputData.next(data);
                } else {
                  this.storeService.actionOutputData.next(data);
                }
                this.close();
                return;
              }
            });
        } else {
          this.action['automation_id'] = this.selectedAutomation;
          const data = {
            ...this.action,
            type: this.type,
            category: this.category,
            period,
            updateTimeline: this.updateTimeline,
            is_assigned: this.timelines.length > 0,
            actionTimelines: this.timelines
          };
          if (this.editType === 'timeline') {
            this.storeService.timelineOutputData.next(data);
          } else {
            this.storeService.actionOutputData.next(data);
          }
          this.close();
          return;
        }
      } else {
        return;
      }
    } else if (
      this.type === 'appointment' ||
      this.type === 'update_appointment'
    ) {
      if (this.appointmentDueOption === 'date') {
        const due_date = moment
          .tz(this.getSelectedDateTime(), this.selectedTimezone)
          .format();
        this.action['appointment'] = this.appointmentEvent;
        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          due_date: due_date,
          period,
          updateTimeline: this.updateTimeline,
          is_assigned: this.timelines.length > 0,
          actionTimelines: this.timelines
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.close();
      } else {
        this.action['appointment'] = this.appointmentEvent;
        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          due_duration:
            this.timeUntilType === 'hour'
              ? this.due_duration
              : this.due_duration * 24,
          period,
          updateTimeline: this.updateTimeline,
          is_assigned: this.timelines.length > 0,
          actionTimelines: this.timelines
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.close();
      }
      return;
    } else if (this.type === 'contact_condition') {
      if (this.contactConditions && this.contactConditions.length > 0) {
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
            let phone_number = item.internationalNumber.replace(/\D/g, '');
            return (phone_number = '+' + phone_number);
          });
          this.action['contact_conditions'] = formattedPhones;
        } else if (
          this.action['condition_field'] === 'website' ||
          this.action['condition_field'] === 'email' ||
          this.action['condition_field'] === 'primary_email' ||
          this.action['condition_field'] === 'secondary_email'
        ) {
          this.action['contact_conditions'] = this.contactConditions.map(
            (item) => item.trim()
          );
        } else if (isDateField) {
          const formattedDates = [];
          for (const condition of this.contactConditions) {
            const date = new Date();
            date.setDate(condition.day);
            date.setMonth(condition.month - 1);
            date.setFullYear(condition.year);
            date.setHours(0, 0, 0, 0);
            formattedDates.push(date.toISOString());
          }
          this.action['contact_conditions'] = formattedDates;
        } else {
          this.action['contact_conditions'] = this.contactConditions;
        }

        const data = {
          ...this.action,
          type: this.type,
          category: this.category,
          period,
          updateTimeline: this.updateTimeline,
          is_assigned: this.timelines.length > 0,
          actionTimelines: this.timelines
        };
        if (this.editType === 'timeline') {
          this.storeService.timelineOutputData.next(data);
        } else {
          this.storeService.actionOutputData.next(data);
        }
        this.close();
        return;
      } else {
        return;
      }
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
        category: this.category,
        period,
        updateTimeline: this.updateTimeline,
        is_assigned: this.timelines.length > 0,
        actionTimelines: this.timelines
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.close();
      return;
    } else {
      const data = {
        ...this.action,
        type: this.type,
        category: this.category,
        period,
        updateTimeline: this.updateTimeline,
        is_assigned: this.timelines.length > 0,
        actionTimelines: this.timelines
      };
      if (this.editType === 'timeline') {
        this.storeService.timelineOutputData.next(data);
      } else {
        this.storeService.actionOutputData.next(data);
      }
      this.close();
    }
  }

  loadTeam(): void {
    this.teamService.teams$.subscribe((res) => {
      const teams = res;
      const internalTeam = teams.filter((e) => e.is_internal);
      if (internalTeam.length) {
        this.internalTeamCount = internalTeam.length;
        this.communityCount = teams.length - internalTeam.length;
        this.selectTeam(internalTeam[0]);
        this.hasInternal = true;
      } else {
        this.communityCount = teams.length;
        this.hasInternal = false;
      }

      if (this.internalOnly) {
        this.communityCount = 0;
      }
    });
    this.teamService.loadAll(false);
  }

  checkDuplicateValues(index: number) {
    if (
      this.contactConditions.filter(
        (value, i) => value === this.contactConditions[index] && i !== index
      ).length > 0
    ) {
      this.duplicateValues[index] = true;
    } else {
      this.duplicateValues[index] = false;
    }
  }

  loadTemplates(): any {
    switch (this.type) {
      case 'send_text_video':
        this.mediaType = 'text';
        this.materialType = 'video';
        break;
      case 'send_email_video':
        this.mediaType = 'email';
        this.materialType = 'video';
        break;
      case 'send_text_pdf':
        this.mediaType = 'text';
        this.materialType = 'pdf';
        break;
      case 'send_email_pdf':
        this.mediaType = 'email';
        this.materialType = 'pdf';
        break;
      case 'send_text_image':
        this.mediaType = 'text';
        this.materialType = 'image';
        break;
      case 'send_email_image':
        this.mediaType = 'email';
        this.materialType = 'image';
        break;
      case 'send_email':
        this.mediaType = 'email';
        this.materialType = '';
        break;
      default:
        this.mediaType = '';
        this.materialType = '';
        break;
    }
  }

  displayFn(template): string {
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
    this.updateFollowDueOption = 'no_update';
  }

  initMessage(): any {
    if (
      this.mediaType === 'email' &&
      (this.selectedTemplate.subject || this.selectedTemplate.content)
    ) {
      this.setMessage();
      return;
    }
    if (
      this.mediaType === 'text' &&
      (this.selectedTemplate.subject || this.selectedTemplate.content)
    ) {
      this.setMessage();
      return;
    }
    if (this.materialType) {
      if (this.mediaType === 'email') {
        // Set the subject and content
        if (this.materialType === 'video') {
          this.action['subject'] = 'Video: {video_title}';
          this.action['content'] = this.autoFill(
            DefaultMessage.AUTO_VIDEO_EMAIL
          );
        } else if (this.materialType === 'pdf') {
          this.action['subject'] = 'PDF: {pdf_title}';
          this.action['content'] = this.autoFill(DefaultMessage.AUTO_PDF_EMAIL);
        } else if (this.materialType === 'image') {
          this.action['subject'] = 'Image: {image_title}';
          this.action['content'] = this.autoFill(
            DefaultMessage.AUTO_IMAGES_EMAIL
          );
        }
      } else {
        // Set only content
        if (this.materialType === 'video') {
          this.action['content'] = this.autoFill(
            DefaultMessage.AUTO_VIDEO_TEXT1
          );
        } else if (this.materialType === 'pdf') {
          this.action['content'] = this.autoFill(DefaultMessage.AUTO_PDF_TEXT1);
        } else if (this.materialType === 'image') {
          this.action['content'] = this.autoFill(
            DefaultMessage.AUTO_IMAGE_TEXT1
          );
        }
      }
    }
  }
  autoFill(text): void {
    let result = text;
    const user_name = this.currentUser.user_name;
    const user_phone = this.currentUser.cell_phone;
    const user_email = this.currentUser.email;
    result = result.replace(/{user_name}/g, user_name || '');
    result = result.replace(/{user_phone}/g, user_phone || '');
    result = result.replace(/{user_email}/g, user_email || '');

    return result;
  }

  setMessage(): void {
    this.action['subject'] = this.selectedTemplate.subject;
    this.action['content'] = this.selectedTemplate.content;
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

  getSmsContentCursor(field): void {
    if (field.selectionStart || field.selectionStart === '0') {
      this.smsContentCursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      this.smsContentCursorEnd = field.selectionEnd;
    }
  }

  /**=======================================================
   *
   * Deal Name Field
   *
   ========================================================*/
  /**
   *
   * @param field : Input text field of the subject
   */
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

  insertSmsContentValue(value, field, token = false): void {
    let iValue = value;
    if (token) iValue = `{${value}}`;
    let smsContent = this.action['content'] || '';
    smsContent =
      smsContent.substr(0, this.smsContentCursorStart) +
      iValue +
      smsContent.substr(
        this.smsContentCursorEnd,
        smsContent.length - this.smsContentCursorEnd
      );
    this.action['content'] = smsContent;
    this.smsContentCursorStart = this.smsContentCursorStart + iValue.length;
    this.smsContentCursorEnd = this.smsContentCursorStart;
    field.focus();
  }

  insertDealNameValue(value, field): void {
    let dealName = this.deal_name || '';
    dealName =
      dealName.substr(0, this.dealNameCursorStart) +
      '{' +
      value +
      '}' +
      dealName.substr(
        this.dealNameCursorEnd,
        dealName.length - this.dealNameCursorEnd
      );
    this.deal_name = dealName;
    this.dealNameCursorStart = this.dealNameCursorStart + value.length;
    this.dealNameCursorEnd = this.dealNameCursorStart;
    field.focus();
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

  numPad(num): any {
    if (num < 10) {
      return '0' + num;
    }
    return num + '';
  }

  changeLabelSelect($event, i): void {
    this.contactConditions[i] = $event;
    this.checkDuplicateValues(i);
  }

  changeCommandLabel($event): void {
    this.commandLabel = $event;
    const label = this.labels.find((e) => e._id === $event);
    this.commandName = label.name;
    this.error = '';
  }
  remove(): void {
    this.commandLabel = '';
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
  filter(): void {
    this.filterVideos = this.videos.filter((video) => {
      return searchReg(video.title, this.searchStr);
    });
    this.filterPdfs = this.pdfs.filter((pdf) => {
      return searchReg(pdf.title, this.searchStr);
    });
    this.filterImages = this.images.filter((image) => {
      return searchReg(image.title, this.searchStr);
    });
  }

  onChangeTemplate(template: Template): void {
    this.action['subject'] = template.subject;
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

  selectTextTemplate(template: Template): void {
    this.textAreaEl.nativeElement.focus();
    const field = this.textAreaEl.nativeElement;
    if (!this.action['content'].replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, template.content);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.action['content'][field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    } else {
      if (this.action['content'].slice(-1) === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    }
  }

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
        document.execCommand('insertText', false, '\n' + fullUrl);
      }
    } else {
      if (this.action['content'].slice(-1) === '\n') {
        document.execCommand('insertText', false, fullUrl);
      } else {
        document.execCommand('insertText', false, '\n' + fullUrl);
      }
    }
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

  openEmailMaterialsDlg(): void {
    const content = this.action['content'];
    const materials = this.helperSerivce.getMaterials(content);
    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: materials,
        title: 'Insert material',
        multiple: true,
        onlyMine: false
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

  isShowTimeDelay(): boolean {
    if (this.parentAction && this.parentAction['condition']) {
      if (!this.parentAction['condition'].answer) {
        return true;
      }
    }
    // if (
    //   this.type === 'note' ||
    //   this.type === 'follow_up' ||
    //   this.type === 'update_follow_up' ||
    //   this.type === 'deal' ||
    //   this.type === 'move_deal'
    // ) {
    //   return false;
    // }
    return true;
  }

  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt._id;
  }

  handleAddressChange(evt: any): void {
    this.appointmentEvent.location = evt.formatted_address;
  }

  changeTimeDelayType(value): void {
    this.timeDelayType = value;
  }

  changeTimeUntilType(value): void {
    this.timeUntilType = value;
  }

  selectVoiceMail(): any {
    if (this.action['voicemail']) {
      const index = this.rvms.findIndex(
        (item) => item.id === this.action['voicemail']
      );
      if (index >= 0) {
        this.selectedVoiceMail = this.rvms[index];
      } else {
        this.selectedVoiceMail = null;
      }
    }
  }

  closeDrawer(): void {
    this.initVariables();
    this.onClose.emit();
  }
  openDrawer(): void {
    this.onOpen.emit();
  }

  close(): void {
    setTimeout(() => {
      this.actionInputSubscription &&
        this.actionInputSubscription.unsubscribe();
      this.actionInputSubscription =
        this.storeService.actionInputData$.subscribe((res) => {
          if (res) {
            this.initVariables();
            this.data = res;
            this.editType = 'action';
            this.initDialog();
          }
        });
    }, 300);
    this.onClose.emit();
  }

  back(): void {
    if (this.stepIndex !== 1) {
      this.actionInputSubscription &&
        this.actionInputSubscription.unsubscribe();
      this.actionInputSubscription =
        this.storeService.actionInputData$.subscribe((res) => {
          if (res) {
            this.initVariables();
            this.data = res;
            this.editType = 'action';
            this.initDialog();
          }
        });
    }
    this.onClose.emit();
  }

  initVariables(): void {
    this.stepIndex = 1; // ACTION DEFINE STEP | 1: Action List View, 2: Action Detail Setting
    this.type = ''; // ACTION TYPE
    this.category = null; // ACTION CATEGORY
    this.action = {}; // ACTION CONTENT
    this.submitted = false; // SUBMITTING FALSE
    this.conditionAction = []; // Condition Case Action corresponds the prev action
    this.contactConditions = [];
    this.material_type = '';
    this.STATUS = STATUS;
    this.isCalendly = false;
    this.pushCommandTags = [];
    this.pullCommandTags = [];
    this.videos = [];
    this.videosLoading = false;

    this.pdfs = [];
    this.pdfsLoading = false;

    this.images = [];
    this.imagesLoading = false;

    this.materialError = '';
    this.isProcessing = true;
    this.myControl = new UntypedFormControl();
    this.selectedTemplate = new Template();

    // Follow Create
    this.due_date = moment();
    this.hasInternal = true;
    this.due_duration = 1;
    this.times = TIMES;
    this.followDueOption = 'delay';
    this.plan_time = { day: 0, hour: 1, min: 0 };
    this.plan_time_delay = 1;
    // Contact Update
    this.contactUpdateOption = 'update_label';
    this.labelsLoading = false;
    this.labelsLoadError = '';
    this.commandLabel = ''; // Label
    this.mediaType = '';
    this.materialType = '';

    this.default = {
      sms: '',
      email: ''
    };

    // periodOption = 'gap'
    // condPeriodOption = 'limit';

    this.task = new Task();
    this.attachLimit = AUTOMATION_ATTACH_SIZE;

    this.selectedFollow = null;
    this.followUpdateOption = 'no_update';
    this.updateFollowDueOption = 'date';
    this.update_due_duration = 0;
    this.selectedDate = '';

    this.searchStr = '';
    this.filterVideos = [];
    this.filterPdfs = [];
    this.filterImages = [];
    this.set = 'twitter';
    this.templateSubject = '';
    this.templateValue = '';
    this.deal_name = '';
    this.deal_stage = '';
    this.popup = null;
    this.authToken = '';
    this.userId = '';
    this.attachments = [];
    this.materials = [];

    this.smsContentCursorStart = 0;
    this.smsContentCursorEnd = 0;
    this.smsContent = '';
    this.subjectFocus = false;
    this.contentFocus = false;

    this.dealNameCursorStart = 0;
    this.dealNameCursorEnd = 0;
    this.dealNameFocus = false;

    this.parentAction = {};

    this.moveDealOption = 'next';
    this.automation_type = 'any';
    this.automation_label = 'contact';
    this.selectedAutomation = '';
    this.automation = null;

    this.calendar_durations = CALENDAR_DURATION;
    this.appointmentEvent = {
      title: '',
      duration: 0.5,
      contacts: [],
      calendar: null,
      location: '',
      description: ''
    };
    this.appointmentDueOption = 'delay';
    this.timeDelayType = 'hour';
    this.data = null;

    this.assignedList = [];
    this.filteredAssignedList = [];
    this.searchAssignedListStr = '';
    this.tabs = [this.actionTab];
    this.selectedTab = this.tabs[0];
    this.selectedVoiceMail = null;
    this.audioFile = null;
    this.uploadingAudio = false;
    this.lead_fields = [];

    this.sortType = this.SORT_TYPES[0];
    this.selectedFiles = [];
    this.readAssign = true;

    this.selectedMoveOption = this.moveOptions[0];
    this.selectedMoveOptionId = 1;
    this.internalTeamCount = 0;
    this.communityCount = 0;
    this.selectedTeam = null;
    this.members = [];
    this.selectedMember = null;
    this.role = 'viewer';

    this.DisplayActions = [
      {
        type: 'follow_up',
        title: 'New Task',
        description:
          'Remind yourself or someone in your team to do a phone call, send an email, etc. ',
        icon: AUTOMATION_ICONS.FOLLOWUP,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'update_follow_up',
        title: 'Edit Task',
        description:
          'Based on your contact behaviour you can edit or set a task as completed.',
        icon: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'note',
        title: 'New Note',
        description: 'Add a detail or something important about your client.',
        icon: AUTOMATION_ICONS.CREATE_NOTE,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'text',
        title: 'New Text',
        description: 'Create a text message to be sent to your client.',
        icon: AUTOMATION_ICONS.SEND_TEXT,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'email',
        title: 'New Email',
        description: 'Trigger an email to send to your contacts.',
        icon: AUTOMATION_ICONS.SEND_EMAIL,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'contact_condition',
        title: 'Contact Condition',
        description: 'Create branches with the conditions you entered. ',
        icon: AUTOMATION_ICONS.CONTACT_CONDITION,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'move_contact',
        title: 'Contact Move',
        description: 'Transfer or Clone contact to selected Community/Team',
        icon: AUTOMATION_ICONS.MOVE_CONTACT,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'share_contact',
        title: 'Contact Share',
        description: 'Share contact to selected Community/Team',
        icon: AUTOMATION_ICONS.SHARE_CONTACT,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'deal',
        title: 'New Deal',
        description: 'Associate a new deal to one of your contacts.',
        icon: AUTOMATION_ICONS.NEW_DEAL,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'move_deal',
        title: 'Move Deal',
        description: 'Automatically move a Deal to a different stage.',
        icon: AUTOMATION_ICONS.MOVE_DEAL,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'update_contact',
        title: 'Contact Update',
        description:
          'Automatically update your contact activity with a label or tag.',
        icon: AUTOMATION_ICONS.UPDATE_CONTACT,
        category: ACTION_CAT.NORMAL
      },
      {
        type: 'automation',
        title: 'Automation',
        description:
          'Connect your current Automation to another one you might have on your list. ',
        icon: AUTOMATION_ICONS.AUTOMATION,
        category: ACTION_CAT.NORMAL
      }
    ];
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

    // this.appointmentService.loadCalendars(false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
    });

    this.templatesService.loadAll(false);

    this.duplicateValues = [];

    this.authToken = this.userService.getToken();
    this.userId = this.userService.profile.getValue()._id;

    this.storeService.materials$.subscribe((materials) => {
      this.materials = materials;
    });

    this.action['period'] = 0;
    this.action['group'] = undefined;

    if (this.data) {
      this.parentAction = this.data.parentAction;
      this.childRef = this.data.childRef;
      if (this.data.hasNewDeal) {
        const index = this.DisplayActions.findIndex(
          (item) => item.type === 'deal'
        );
        if (index >= 0) {
          this.DisplayActions.splice(index, 1);
        }
      }
      if (!this.data.moveDeal) {
        const index = this.DisplayActions.findIndex(
          (item) => item.type === 'move_deal'
        );
        if (index >= 0) {
          this.DisplayActions.splice(index, 1);
        }
      }
      this.currentAutomationType = 'any';
      if (this.data.automation_type === 'deal') {
        this.DisplayActions = this.DisplayActions.filter(
          (item) =>
            item.type !== 'move_contact' &&
            item.type !== 'contact_condition' &&
            item.type !== 'share_contact' &&
            item.type !== 'deal'
        );
        this.currentAutomationType = 'deal';
      } else if (this.data.automation_type === 'contact') {
        this.DisplayActions = this.DisplayActions.filter(
          (item) => item.type !== 'move_deal'
        );
        this.currentAutomationType = 'contact';
      }

      if (!this.data.isContactCondition) {
        const index = this.DisplayActions.findIndex(
          (item) => item.type === 'contact_condition'
        );
        if (index >= 0) {
          this.DisplayActions.splice(index, 1);
        }
      }
      if (this.data.automation_type) {
        if (this.data.parentAction?.type === 'deal') {
          this.automation_type = 'deal';
          this.readAssign = false;
          this.tabs = [this.actionTab];
        } else if (this.data.hasNewDeal) {
          this.automation_type = 'deal';
        } else {
          this.automation_type = this.data.automation_type;
        }
      }
      this.currentAutomationType = this.automation_type;

      if (this.data.automation_label) {
        this.automation_label = this.data.automation_label;
      }
      if (this.data.automation) {
        this.automation = this.data.automation;
      }
      if (this.data.appointments) {
        if (this.data.appointments.length === 0) {
          const index = this.DisplayActions.findIndex(
            (item) => item.type === 'update_appointment'
          );
          if (index >= 0) {
            this.DisplayActions.splice(index, 1);
          }
        }
      }
      if (this.data.currentAction === 'email') {
        this.conditionAction = ['opened_email'];
      }
      if (
        this.data.currentAction === 'follow_up' ||
        this.data.currentAction === 'update_follow_up'
      ) {
        this.conditionAction = ['task_check'];
      }
      if (
        this.data.currentAction === 'send_text_video' ||
        this.data.currentAction === 'send_email_video'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_pdf' ||
        this.data.currentAction === 'send_email_pdf'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_image' ||
        this.data.currentAction === 'send_email_image'
      ) {
        this.conditionAction = ['watched_material'];
      }
      if (
        this.data.currentAction === 'send_text_material' ||
        this.data.currentAction === 'send_email_material'
      ) {
        this.conditionAction = ['watched_material'];
      }

      // this.isAvailableAssignAt = this.data.moveDeal;
      if (this.isAvailableAssignAt) {
        this.action['group'] = '';
      }
      //set time delay to 1 day for no case
      if (
        this.data.conditionHandler &&
        this.data.conditionHandler == 'falseCase'
      ) {
        this.action['period'] = 24;
      }

      if (
        this.data.currentAction === 'task_check' &&
        this.data.conditionHandler === 'falseCase'
      ) {
        if (this.data.parentAction.due_date) {
          this.action['period'] = 24;
        } else {
          const time_array = [0.17, 0.5, 1, 6, 12, 24, 48, 72, 168, 336];
          if (time_array.includes(this.data.parentAction.due_duration)) {
            this.action['period'] = this.data.parentAction.due_duration;
          } else {
            this.action['period'] = 'custom_date';
            if (this.data.parentAction.due_duration >= 48) {
              this.timeDelayType = 'day';
              this.plan_time_delay = Math.floor(
                this.data.parentAction.due_duration / 24
              );
            } else {
              this.timeDelayType = 'hour';
              this.plan_time_delay = this.data.parentAction.due_duration;
            }
            this.action['period'] = 'custom_date';
          }
        }
      }

      // get parent actions's timelines.
      if (this.automation && this.readAssign) {
        const data = {
          automation: this.automation._id,
          ref: this.childRef || this.parentAction['id']
        };
        this.loadingTimelines = true;
        this.getActionTimelineSubscription &&
          this.getActionTimelineSubscription.unsubscribe();
        this.getActionTimelineSubscription = this.automationService
          .getActionTimelines(data)
          .subscribe((timelines) => {
            this.loadingTimelines = false;
            if (timelines) {
              this.timelines = timelines;
              if (this.automation_type === 'contact') {
                this.assignedList = this.timelines.map((item) => {
                  return {
                    ...item.contact,
                    timeline: item._id,
                    status: item.status
                  };
                });
              } else {
                this.assignedList = this.timelines.map((item) => {
                  return {
                    ...item.deal,
                    timeline: item._id,
                    status: item.status
                  };
                });
              }
              this.filteredAssignedList = [...this.assignedList];
              this.filteredResult = [...this.assignedList];
              this.filteredFiles = [...this.assignedList];
            }
          });
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
    }

    setTimeout(() => {
      if (this.searchField) {
        this.searchField.nativeElement.blur();
      }
    }, 300);
  }

  selectTimezone($event): void {
    this.selectedTimezone = $event;
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
    this.filteredResult = [...this.assignedList];
    this.filteredFiles = [...this.assignedList];
  }

  clearAssignedListSearchStr(): void {
    this.searchAssignedListStr = '';
    this.filteredAssignedList = [...this.assignedList];
    this.filteredResult = [...this.assignedList];
    this.filteredFiles = [...this.assignedList];
  }

  setUpdateTimeline(option): void {
    this.updateTimeline = option;
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

  conditionHandleCityChange(evt: any, index): void {
    for (const component of evt.address_components) {
      if (!component['types']) {
        continue;
      }
      if (
        component['types'].indexOf('sublocality_level_1') > -1 ||
        component['types'].indexOf('locality') > -1
      ) {
        this.contactConditions[index] = component['long_name'];
      }
    }
  }

  setConditionStates(condition): void {
    this.cityPlaceRef.options.componentRestrictions.country = condition.country;
    this.cityPlaceRef.reset();
  }

  setContactConditionType(type): void {
    this.action['condition_field'] = type;
    if (type === 'automation') {
      this.contactConditions = [{}];
    } else {
      this.contactConditions = [''];
    }
    this.duplicateValues = [];
  }

  addContactCondition(): void {
    if (this.action['condition_field'] === 'automation') {
      this.contactConditions.push({});
    } else {
      this.contactConditions.push('');
    }
  }

  availableActions(): number {
    let count = 0;

    for (const condition of this.contactConditions) {
      if (condition !== undefined && condition !== null) {
        count++;
      } else if (
        this.action['condition_field'] === 'cell_phone' ||
        this.action['condition_field'] === 'secondary_phone'
      ) {
        count++;
      }
    }

    return count;
  }

  removeContactCondition(index): void {
    this.contactConditions.splice(index, 1);
    this.duplicateValues[index] = false;
  }

  selectContactConditionAutomation(automation, index): void {
    if (automation) {
      this.contactConditions[index] = automation._id;
    }
  }

  counter(i: number): any {
    return new Array(i);
  }
  isEmptyContactCondition(): boolean {
    if (
      this.contactConditions.some(
        (condition) => condition === null || condition === ''
      )
    ) {
      return true;
    }
  }
  isDuplicateContactCondition(): boolean {
    return this.contactConditions.some((item, index) => {
      return (
        this.contactConditions.findIndex((el, i) => {
          return i !== index && JSON.stringify(el) === JSON.stringify(item);
        }) !== -1
      );
    });
  }

  isOneContactCondition(): boolean {
    if (this.submitted && this.contactConditions.length < 2) {
      return true;
    }
    return false;
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
  }

  changePage(page: number): void {
    this.page = page;
  }

  changePageSize(type: any): void {
    this.pageSize = type;
  }

  changeSort(type: any): void {
    this.sortType = type;
    if (this.sortType.id == '') {
      this.filteredResult = [...this.assignedList];
    } else {
      this.filteredResult = this.assignedList.filter(
        (item) => item.status == this.sortType.id
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

  doAction(evt: any): void {
    if (evt.command === 'pause') {
    } else if (evt.command === 'retry') {
    }
  }
  isOnlyAddAutomation(): boolean {
    if (this.automation_type === 'contact') {
      if (this.parentAction && this.parentAction['type'] === 'deal') {
        return true;
      }
    } else if (this.automation_type === 'deal') {
      if (
        this.data?.currentAction === 'move_deal' ||
        this.data?.currentAction === 'deal'
      ) {
        return true;
      }
    } else if (
      this.data?.currentAction === 'move_deal' ||
      this.data?.currentAction === 'deal'
    ) {
      return true;
    }
    return false;
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

  selectMoveOptions(): void {
    console.log(this.selectedMoveOptionId, this.moveOptions);
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

  onChangeStage(evt: any): void {
    this.deal_stage = evt;
  }
  messageChanged(): void {
    const segmentedMessage = new SegmentedMessage(
      this.action['content'] || '',
      'auto',
      true
    );
    this.segments = segmentedMessage.segmentsCount || 0;
  }
  /////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Constant Variables ////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  DisplayActions = [
    {
      type: 'follow_up',
      title: 'New Task',
      description:
        'Remind yourself or someone in your team to do a phone call, send an email, etc. ',
      icon: AUTOMATION_ICONS.FOLLOWUP,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_follow_up',
      title: 'Edit Task',
      description:
        'Based on your contact behaviour you can edit or set a task as completed.',
      icon: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'note',
      title: 'New Note',
      description: 'Add a detail or something important about your client.',
      icon: AUTOMATION_ICONS.CREATE_NOTE,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'text',
      title: 'New Text',
      description: 'Create a text message to be sent to your client.',
      icon: AUTOMATION_ICONS.SEND_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'email',
      title: 'New Email',
      description: 'Trigger an email to send to your contacts.',
      icon: AUTOMATION_ICONS.SEND_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'contact_condition',
      title: 'Contact Condition',
      description: 'Create branches with the conditions you entered. ',
      icon: AUTOMATION_ICONS.CONTACT_CONDITION,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'move_contact',
      title: 'Contact Move',
      description: 'Transfer or Clone contact to selected Community/Team',
      icon: AUTOMATION_ICONS.MOVE_CONTACT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'share_contact',
      title: 'Contact Share',
      description: 'Share contact to selected Community/Team',
      icon: AUTOMATION_ICONS.SHARE_CONTACT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'deal',
      title: 'New Deal',
      description: 'Associate a new deal to one of your contacts.',
      icon: AUTOMATION_ICONS.NEW_DEAL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'move_deal',
      title: 'Move Deal',
      description: 'Automatically move a Deal to a different stage.',
      icon: AUTOMATION_ICONS.MOVE_DEAL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_contact',
      title: 'Contact Update',
      description:
        'Automatically update your contact activity with a label or tag.',
      icon: AUTOMATION_ICONS.UPDATE_CONTACT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'automation',
      title: 'Automation',
      description:
        'Connect your current Automation to another one you might have on your list. ',
      icon: AUTOMATION_ICONS.AUTOMATION,
      category: ACTION_CAT.NORMAL
    }
  ];

  ActionTypes = [
    {
      type: 'follow_up',
      title: 'Follow Up',
      description: '',
      icon: AUTOMATION_ICONS.FOLLOWUP,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_follow_up',
      title: 'Update Follow up',
      description: '',
      icon: AUTOMATION_ICONS.UPDATE_FOLLOWUP,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'note',
      title: 'Create Note',
      description: '',
      icon: AUTOMATION_ICONS.CREATE_NOTE,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'text',
      title: 'Send Text',
      description: '',
      icon: AUTOMATION_ICONS.SEND_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'email',
      title: 'Send Email',
      description: '',
      icon: AUTOMATION_ICONS.SEND_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_email_video',
      title: 'Send Video Email',
      description: '',
      icon: AUTOMATION_ICONS.SEND_VIDEO_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_text_video',
      title: 'Send Video Text',
      description: '',
      icon: AUTOMATION_ICONS.SEND_VIDEO_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_email_pdf',
      title: 'Send PDF Email',
      description: '',
      icon: AUTOMATION_ICONS.SEND_PDF_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_text_pdf',
      title: 'Send PDF Text',
      description: '',
      icon: AUTOMATION_ICONS.SEND_PDF_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_email_image',
      title: 'Send Image Email',
      description: '',
      icon: AUTOMATION_ICONS.SEND_IMAGE_EMAIL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'send_text_image',
      title: 'Send Image Text',
      description: '',
      icon: AUTOMATION_ICONS.SEND_IMAGE_TEXT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'deal',
      title: 'New Deal',
      description: '',
      icon: AUTOMATION_ICONS.NEW_DEAL,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_contact',
      title: 'Contact Update',
      description: '',
      icon: AUTOMATION_ICONS.UPDATE_CONTACT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'automation',
      title: 'Automation',
      description: '',
      icon: AUTOMATION_ICONS.AUTOMATION,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'appointment',
      title: 'Meeting',
      description: '',
      icon: AUTOMATION_ICONS.APPOINTMENT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'update_appointment',
      title: 'Update Meeting',
      description: '',
      icon: AUTOMATION_ICONS.APPOINTMENT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'contact_condition',
      title: 'Contact Condition',
      description: 'Create branches with the conditions you entered. ',
      icon: AUTOMATION_ICONS.CONTACT_CONDITION,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'move_contact',
      title: 'Contact Merge',
      description: 'Transfer or Clone contact to selected Community/Team',
      icon: AUTOMATION_ICONS.MOVE_CONTACT,
      category: ACTION_CAT.NORMAL
    },
    {
      type: 'share_contact',
      title: 'Contact Share',
      description: 'Share contact to selected Community/Team',
      icon: AUTOMATION_ICONS.SHARE_CONTACT,
      category: ACTION_CAT.NORMAL
    }
  ];

  ConditionActionTypes = [
    {
      type: 'watched_video',
      title: 'Material Review Check',
      description:
        'Get to know if your contact has already seen a Material you’ve sent.',
      icon: AUTOMATION_ICONS.WATCHED_VIDEO,
      category: ACTION_CAT.CONDITION
    },
    {
      type: 'watched_pdf',
      title: 'Material Review Check',
      description:
        'Get to know if your contact has already seen a Material you’ve sent.',
      icon: AUTOMATION_ICONS.WATCHED_PDF,
      category: ACTION_CAT.CONDITION
    },
    {
      type: 'watched_image',
      title: 'Material Review Check',
      description:
        'Get to know if your contact has already seen a Material you’ve sent.',
      icon: AUTOMATION_ICONS.WATCHED_IMAGE,
      category: ACTION_CAT.CONDITION
    },
    {
      type: 'opened_email',
      title: 'Email Open Check',
      description: 'Get to know if your contact opens the email you’ve sent.',
      icon: AUTOMATION_ICONS.OPENED_EMAIL,
      category: ACTION_CAT.CONDITION
    },
    // {
    //   type: 'replied_text',
    //   title: 'Replied Text Check',
    //   description: '',
    //   icon: AUTOMATION_ICONS.OPENED_EMAIL,
    //   category: ACTION_CAT.CONDITION
    // },
    {
      type: 'watched_material',
      title: 'Material Review Check',
      description:
        'Get to know if your contact has already seen a Material you’ve sent.',
      icon: AUTOMATION_ICONS.WATCHED_VIDEO,
      category: ACTION_CAT.CONDITION
    },
    {
      type: 'task_check',
      title: 'Task complete check',
      description: 'Get to know if the task is completed.',
      icon: AUTOMATION_ICONS.TASK_CHECK,
      category: ACTION_CAT.CONDITION
    }
  ];

  ActivityName = {
    note: 'New Note',
    follow_up: 'New Task',
    text: 'New Text',
    email: 'New Email',
    send_email_video: 'New Video Email',
    send_text_video: 'New Video Text',
    send_email_pdf: 'New PDF Email',
    send_text_pdf: 'New PDF Text',
    send_email_image: 'New Image Email',
    send_text_image: 'New Image Text',
    watched_video: 'Video Watching',
    watched_image: 'Image Watching',
    watched_pdf: 'PDF Watching',
    deal: 'New Deal',
    update_contact: 'Contact update activity',
    update_follow_up: 'Edit Task',
    replied_text: 'Text Reply',
    watched_material: 'Material Watching',
    move_deal: 'Move Deal',
    automation: 'Automation',
    appointment: 'New Appointment',
    update_appointment: 'Update Appointment',
    contact_condition: 'Contact Condition',
    move_contact: 'Contact Move',
    share_contact: 'Contact Share',
    task_check: 'Task complete checker'
  };

  NoLimitActions = [
    // 'note',
    // 'follow_up',
    // 'update_contact',
    // 'update_follow_up',
    // 'deal',
    // 'move_deal'
  ];
}
