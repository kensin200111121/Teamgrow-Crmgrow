import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  DEFAULT_TEMPLATE_TOKENS,
  RECORDING_POPUP,
  TIME_ZONE_NAMES,
  WORK_TIMES
} from '@app/constants/variable.constants';
import { getUserTimezone } from '@app/helper';
import { Contact } from '@app/models/contact.model';
import { Draft } from '@app/models/draft.model';
import { Garbage } from '@app/models/garbage.model';
import { ConnectService } from '@app/services/connect.service';
import { ContactService } from '@app/services/contact.service';
import { DealsService } from '@app/services/deals.service';
import { HandlerService } from '@app/services/handler.service';
import { HelperService } from '@app/services/helper.service';
import { MaterialService } from '@app/services/material.service';
import { ScheduleService } from '@app/services/schedule.service';
import { SmsService } from '@app/services/sms.service';
import { SspaService } from '@app/services/sspa.service';
import { StoreService } from '@app/services/store.service';
import { TaskService } from '@app/services/task.service';
import { TemplatesService } from '@app/services/templates.service';
import { UserService } from '@app/services/user.service';
import { TemplateToken } from '@app/utils/data.types';
import { ToastrService } from 'ngx-toastr';
import { interval, Subscription } from 'rxjs';
import moment from 'moment-timezone';
import {
  convertIdToUrlOnSMS,
  getLandingPageIdsOnSMS,
  parseURLToIdsAndPairedUrl
} from '@app/utils/functions';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { environment } from '@environments/environment';
import { ConfirmBusinessComponent } from '../confirm-business-hour/confirm-business-hour.component';
import { ScheduleSendComponent } from '../schedule-send/schedule-send.component';
import { Template } from '@app/models/template.model';
import { NotifyComponent } from '../notify/notify.component';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { UserFeatureService } from '@app/services/user-features.service';
import { SegmentedMessage } from 'sms-segments-calculator';

@Component({
  selector: 'app-inline-send-text',
  templateUrl: './inline-send-text.component.html',
  styleUrls: ['./inline-send-text.component.scss']
})
export class InlineSendTextComponent implements OnInit, OnDestroy {
  readonly USER_FEATURES = USER_FEATURES;
  contact: Contact | null;
  @Input() isFocused = false;
  @Input() draftContactPhones: string[] | null = null;

  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onSend: EventEmitter<any> = new EventEmitter();
  @Output() onFocus? = new EventEmitter();
  @Output() onCallbackDestroySendPhone: EventEmitter<any> = new EventEmitter();

  @Input()
  public set setContact(val: Contact | null) {
    this.contact = new Contact().deserialize(val);
    if (val?.phones?.length > 0) {
      const primaryPhone = val.phones.find((item) => !!item.isPrimary);
      if (primaryPhone) {
        this.contactPhones = [primaryPhone.value];
      }
    }
    this.init();
  }

  @Input()
  public set setDraft(val: any) {
    this.draftText = val;
  }

  @Input() contactId: string;
  @Input() timeZone?: any | null;

  //============================
  garbage: Garbage = new Garbage();
  contactPhones: string[] = [];
  message = '';
  conversation: any;
  userId = '';
  messages: any[] = [];
  set = 'twitter';
  popup;
  recordUrl = RECORDING_POPUP;
  authToken = '';
  loading = false;
  hasCalendly = false;
  hasSchedule = false;
  loadSubscription: Subscription;
  sending = false;
  sendSubscription: Subscription;
  updateTimer: Subscription;
  conversationLoadSubscription: Subscription;
  garbageSubscription: Subscription;
  showCheck = 0;
  dialogType = '';
  isMinimizable = true;
  draftText = new Draft();

  dealId = '';
  schedule_date = {
    year: '',
    month: '',
    day: ''
  };
  scheduleData: any;
  scheduleDateTime: any;
  scheduleCheck = false;
  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name'
  };
  templateTokens: TemplateToken[] = [];
  mode = 'create';
  time_zone = '';
  tz_display = '';
  time_display: any;
  aiDialogExtendable = false;
  dialogWidth = 680;
  editorHeight = 360;
  aiTabMinimized = false;
  presetText = '';
  startTime = WORK_TIMES[0].id;
  endTime = WORK_TIMES[WORK_TIMES.length - 1].id;
  segments = 0;
  redirectArticleURL =
    'https://kb1.crmgrow.com/kb/guide/en/sms-texting-character-limits-8DWOLjE5ZS/Steps/4023017';
  @ViewChild('messageText') messageText: ElementRef;
  constructor(
    private dialog: MatDialog,
    private materialService: MaterialService,
    private helperService: HelperService,
    private contactService: ContactService,
    public userService: UserService,
    public smsService: SmsService,
    public connectService: ConnectService,
    private handlerService: HandlerService,
    private toast: ToastrService,
    public storeService: StoreService,
    private taskService: TaskService,
    public scheduleService: ScheduleService,
    public sspaService: SspaService,
    private templateService: TemplatesService,
    private dealService: DealsService,
    private featureService: UserFeatureService
  ) {
    this.userId = this.userService.profile.getValue()._id;
  }

  ngOnInit(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      if (
        this.garbage?.calendly &&
        Object.keys(this.garbage?.calendly).length &&
        this.featureService.isEnableFeature(USER_FEATURES.CALENDER)
      ) {
        this.hasCalendly = true;
      } else {
        this.hasCalendly = false;
      }

      this.hasSchedule = this.featureService.isEnableFeature(
        USER_FEATURES.SCHEDULER
      );

      this.templateTokens = DEFAULT_TEMPLATE_TOKENS;
      const user = this.userService.profile.getValue();
      if (!user?.assignee_info?.is_enabled) {
        this.templateTokens = this.templateTokens.filter((token) => {
          return token.id < 10; // subtract assignee tokens
        });
      }
      if (this.garbage.template_tokens && this.garbage.template_tokens.length) {
        this.templateTokens = [
          ...this.templateTokens,
          ...this.garbage.template_tokens
        ];
      }
      if (this.garbage.business_time) {
        this.startTime = this.garbage.business_time.start_time;
        this.endTime = this.garbage.business_time.end_time;
      }
    });

    this.connectService.loadCalendlyAll(false);
    this.authToken = this.userService.getToken();

    this.scheduleService.getEventTypes(false);

    if (this?.timeZone) this.time_zone = this?.timeZone;
    else {
      this.time_zone = getUserTimezone(
        this.userService.profile.getValue(),
        false
      );
    }
    this.tz_display = this.getTimeZoneInitial(this.time_zone);
    if (this.scheduleDateTime) {
      this.time_display = moment(this.scheduleDateTime).tz(this.time_zone);
      this.scheduleCheck = true;
    }
    const defaultSms = this.userService.sms.getValue();
    if (this.draftText && this.draftText.content) {
      this.message = convertIdToUrlOnSMS(this.draftText.content);
    } else {
      if (defaultSms) {
        setTimeout(() => {
          this.templateService.read(defaultSms._id).subscribe((res) => {
            this.selectTemplate(res);
          });
        }, 300);
      }
    }
    this.updateTimer = interval(3 * 1000).subscribe(() => {
      this.update();
    });
    this.templateService.loadAll(false);

    if (this.draftContactPhones) {
      this.contactPhones = this.draftContactPhones;
    }
  }

  init() {
    this.conversationLoadSubscription =
      this.contactService.contactConversation$.subscribe((conversation) => {
        if (conversation && conversation.contact === this.contact._id) {
          this.messages = conversation.messages;
          if (this.messages.length) {
            this.loading = false;
          }
        }
        if (!this.messages || !this.messages.length) {
          this.load();
        }
      });
  }

  ngOnDestroy(): void {
    const data = {
      contact: this.contact._id,
      content: this.message,
      user: this.userId,
      type: 'contact_text'
    };
    if (this.draftText) {
      data['_id'] = this.draftText._id;
    }
    this.storeService.textContactDraft.next(data);

    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.updateTimer && this.updateTimer.unsubscribe();
    this.conversationLoadSubscription &&
      this.conversationLoadSubscription.unsubscribe();
    this.contactService.contactConversation.next({
      contact: this.contact._id,
      messages: this.messages || []
    });

    window.removeEventListener('message', this.recordCallback);
    this.onCallbackDestroySendPhone.emit(this.contactPhones);
  }

  ngAfterViewInit(): void {
    this.taskService.scheduleData$.subscribe((data) => {
      if (data.due_date) {
        this.scheduleData = data;
        this.scheduleDateTime = data.due_date;
        this.scheduleCheck = true;
      } else {
        this.scheduleCheck = false;
      }
      if (data?.time_zone) {
        this.time_zone = data?.time_zone;
        this.tz_display = this.getTimeZoneInitial(this.time_zone);
        this.time_display = moment(this.scheduleDateTime).tz(this.time_zone);
      }
    });
  }

  load(): void {
    this.loading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.smsService
      .getMessage(this.contact)
      .subscribe((messages) => {
        this.loading = false;
        this.messages = messages;
        this.markAsRead(messages);
      });
  }

  markAsRead(messages): void {
    if (
      messages[messages.length - 1] &&
      messages[messages.length - 1].type == 1 &&
      messages[messages.length - 1].status == 0
    ) {
      this.smsService
        .markRead(messages[messages.length - 1]._id, this.contact._id)
        .subscribe((res) => {
          if (res && res['status']) {
            this.contact.unread = false;
            this.handlerService.readMessageContact.next([this.contact._id]);
          }
        });
    } else {
      let hasUnread = false;
      let unreadMessageId;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === 1 && messages[i].status === 0) {
          hasUnread = true;
          unreadMessageId = messages[i]._id;
          break;
        }
      }
      if (hasUnread) {
        this.smsService
          .markRead(unreadMessageId, this.contact._id)
          .subscribe((res) => {
            if (res && res['status']) {
              this.contact.unread = false;
              this.handlerService.readMessageContact.next([this.contact._id]);
            }
          });
      }
    }
  }

  update(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.smsService
      .getMessage(this.contact)
      .subscribe((messages) => {
        this.messages = messages;
      });
  }

  openMaterialsDlg(): void {
    const { videoIds, imageIds, pdfIds } = this.helperService.getSMSMaterials(
      this.message
    );
    const selectedMaterials = [...videoIds, ...imageIds, ...pdfIds].map((e) => {
      return { _id: e };
    });
    const hideLandingPageItems = getLandingPageIdsOnSMS(this.message);

    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        multiple: true,
        enableSelectLandingPage: true,
        hideMaterials: selectedMaterials,
        hideLandingPageItems: hideLandingPageItems
      }
    });
    materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials && res.materials.length) {
        const convertedMsg = res.materials.reduce(function (result, material) {
          let url;
          switch (material.material_type) {
            case 'video':
              url = `${environment.website}/video/${material._id}`;
              break;
            case 'pdf':
              url = `${environment.website}/pdf/${material._id}`;
              break;
            case 'image':
              url = `${environment.website}/image/${material._id}`;
              break;
          }
          return result + '\n' + url;
        }, '');

        this.messageText.nativeElement.focus();
        const field = this.messageText.nativeElement;

        if (!this.message.replace(/(\r\n|\n|\r|\s)/gm, '')) {
          field.select();
          document.execCommand('insertText', false, convertedMsg);
          return;
        }
        if (field.selectionEnd || field.selectionEnd === 0) {
          if (this.message[field.selectionEnd - 1] === '\n') {
            document.execCommand('insertText', false, convertedMsg);
          } else {
            document.execCommand('insertText', false, '\n' + convertedMsg);
          }
        } else {
          if (this.message.slice(-1) === '\n') {
            document.execCommand('insertText', false, convertedMsg);
          } else {
            document.execCommand('insertText', false, '\n' + convertedMsg);
          }
        }
      } else if (res?.landingPages?.length > 0) {
        const convertedMsg = res.landingPages.reduce(function (result, page) {
          const url = `${environment.website}/page/${page._id}`;
          return result + '\n' + url;
        }, '');

        this.messageText.nativeElement.focus();
        const field = this.messageText.nativeElement;

        if (!this.message.replace(/(\r\n|\n|\r|\s)/gm, '')) {
          field.select();
          document.execCommand('insertText', false, convertedMsg);
          return;
        }
        if (field.selectionEnd || field.selectionEnd === 0) {
          if (this.message[field.selectionEnd - 1] === '\n') {
            document.execCommand('insertText', false, convertedMsg);
          } else {
            document.execCommand('insertText', false, '\n' + convertedMsg);
          }
        } else {
          if (this.message.slice(-1) === '\n') {
            document.execCommand('insertText', false, convertedMsg);
          } else {
            document.execCommand('insertText', false, '\n' + convertedMsg);
          }
        }
      }
    });
  }

  send(): void {
    if (this.contactPhones.length === 0) {
      this.showAlert('Please specify at least one recipient.');
      return;
    }
    if (this.contactPhones.length > 20) {
      this.toast.error(
        'More than 20 contacts are selected. Please select less than 10 contacts.',
        'Exceed The Number of Contacts'
      );
      return;
    }

    if (this.sending) {
      this.scheduleCheck = false;
      return;
    }
    if (this.message === '' || this.message.replace(/\s/g, '').length == 0) {
      this.scheduleCheck = false;
      return;
    }

    const {
      content: contentToSend,
      videoIds,
      imageIds,
      pdfIds,
      landingPageIds
    } = parseURLToIdsAndPairedUrl(this.message);
    this.sending = true;
    const contacts = [];
    contacts.push(this.contact._id);
    const toPhones = this.contactPhones;

    let send_data;

    if (this.scheduleData) {
      send_data = {
        action: {
          video_ids: videoIds,
          pdf_ids: pdfIds,
          image_ids: imageIds,
          page_ids: landingPageIds,
          content: contentToSend
        },
        ...this.scheduleData,
        type: 'send_text',
        due_date: this.scheduleDateTime,
        timezone: this.time_zone
      };
    } else {
      send_data = {
        type: 'send_text',
        action: {
          video_ids: videoIds,
          pdf_ids: pdfIds,
          image_ids: imageIds,
          page_ids: landingPageIds,
          content: contentToSend
        },
        due_date: this.scheduleDateTime,
        timezone: this.time_zone
      };
    }

    if (this.scheduleCheck) {
      this.sendSchedule(send_data, contacts, toPhones);
      return;
    }
    this.checkBusinessHourAndSend(
      contentToSend,
      contacts,
      videoIds,
      imageIds,
      pdfIds,
      landingPageIds,
      toPhones
    );
  }

  checkBusinessHourAndSend(
    contentToSend,
    contacts,
    videoIds,
    imageIds,
    pdfIds,

    landingPageIds,
    toPhones
  ): void {
    const currentTime = moment().tz(this.time_zone).format('HH:mm:[00.000]');
    const flag = this.getConfirmMessage()['text_out_of_business_hour'];
    if (currentTime >= this.startTime && currentTime <= this.endTime) {
      this.fireSendMessage(
        contentToSend,
        contacts,
        videoIds,
        imageIds,
        pdfIds,
        landingPageIds,
        toPhones
      );
    } else {
      if (!flag) {
        const confirmDialog = this.dialog.open(ConfirmBusinessComponent, {
          maxWidth: '500px',
          width: '96vw',
          data: {
            title: 'Confirm',
            message:
              'Please ensure you have sufficient consent to contact these recipients during outside of business hours.',
            cancelLabel: 'Cancel',
            confirmLabel: 'Ok'
          }
        });
        confirmDialog['_ref']['overlayRef']['_host'].classList.add(
          'top-dialog'
        );
        confirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            if (res.notShow) {
              this.updateConfirmMessage({
                text_out_of_business_hour: true
              });
            }
            this.fireSendMessage(
              contentToSend,
              contacts,
              videoIds,
              imageIds,
              pdfIds,
              landingPageIds,
              toPhones
            );
          }
        });
      } else {
        this.fireSendMessage(
          contentToSend,
          contacts,
          videoIds,
          imageIds,
          pdfIds,
          landingPageIds,
          toPhones
        );
      }
    }
  }

  fireSendMessage(
    contentToSend: string,
    contacts: Contact[],
    videoIds: string[],
    imageIds: string[],
    pdfIds: string[],
    landingPageIds: string[],
    toPhones: string[]
  ): void {
    this.sendSubscription && this.sendSubscription.unsubscribe();
    this.sendSubscription = this.materialService
      .sendMessage({
        video_ids: videoIds,
        pdf_ids: pdfIds,
        image_ids: imageIds,
        page_ids: landingPageIds,
        content: contentToSend,
        contacts: contacts,
        toPhones
      })
      .subscribe((res) => {
        this.sending = false;
        this.message = '';
        this.update();
        const count = videoIds.length + pdfIds.length + imageIds.length + 1;
        this.userService.onSentSms();
        this.onSendCallback({
          status: true,
          send: this.draftText?._id
        });
      });
  }

  sendSchedule(data: any, contacts: any, toPhones: string[]): void {
    const send_data = { contacts: contacts, data, toPhones };
    this.loading = true;

    this.taskService.scheduleSendCreate(send_data).subscribe((res) => {
      if (res['status']) {
        if (res['message'] === 'all_queue') {
          console.log(res);
          this.toast.info(
            'Your text requests are queued. The text queue progressing would be displayed in the header.',
            'Text Queue',
            {}
          );
          this.handlerService.runScheduleTasks();
        } else {
          this.toast.error('Schedules sending is failed.', 'Schedule Sent');
        }
        this.taskService.scheduleData.next({});
        this.handlerService.activityAdd$(contacts, 'task');
        this.handlerService.reload$('tasks');
        this.userService.onSentSms();
        this.onSendCallback({
          status: true,
          send: this.draftText?._id
        });
      }
      this.sending = false;
      this.onSendCallback({
        status: true
      });
    });
  }

  selectTemplate(template: Template): void {
    this.messageText.nativeElement.focus();
    const field = this.messageText.nativeElement;
    template.content = convertIdToUrlOnSMS(template.content);

    if (!this.message.replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, template.content);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.message[field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    } else {
      if (this.message.slice(-1) === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    }
  }

  selectCalendly(url: string): void {
    this.messageText.nativeElement.focus();
    const fullUrl = this.getCalendlyUrl(url);
    const field = this.messageText.nativeElement;
    if (!this.message.replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, fullUrl);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.message[field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, fullUrl);
      } else {
        document.execCommand('insertText', false, '\n' + fullUrl);
      }
    } else {
      if (this.message.slice(-1) === '\n') {
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
        const url = `${environment.website}/video/${e.data._id}`;
        this.messageText.nativeElement.focus();
        const field = this.messageText.nativeElement;
        if (!this.message.replace(/(\r\n|\n|\r|\s)/gm, '')) {
          field.select();
          document.execCommand('insertText', false, url);
          return;
        }
        if (field.selectionEnd || field.selectionEnd === 0) {
          if (this.message[field.selectionEnd - 1] === '\n') {
            document.execCommand('insertText', false, url);
          } else {
            document.execCommand('insertText', false, '\n' + url);
          }
        } else {
          if (this.message.slice(-1) === '\n') {
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

  insertTextContentValue(data): void {
    let iValue;
    if (data.token) {
      iValue = `{${data.value}}`;
    } else {
      iValue = data;
    }
    const field = this.messageText.nativeElement;
    field.focus();
    let cursorStart = this.message.length;
    let cursorEnd = this.message.length;
    if (field.selectionStart || field.selectionStart === '0') {
      cursorStart = field.selectionStart;
    }
    if (field.selectionEnd || field.selectionEnd === '0') {
      cursorEnd = field.selectionEnd;
    }
    field.setSelectionRange(cursorStart, cursorEnd);
    document.execCommand('insertText', false, iValue);
    cursorStart += iValue.length;
    cursorEnd = cursorStart;
    field.setSelectionRange(cursorStart, cursorEnd);
  }

  keyTrigger(event): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.ctrlKey || event.altKey || event.shiftKey) {
        if (event.shiftKey && !event.ctrlKey && !event.altKey) {
          this.send();
        }
        return;
      } else {
        document.execCommand('insertText', false, '\n');
      }
    }
  }

  parseContent(content: string): any {
    return content.replace(/(https?:\/\/[^\s]+)/g, function (url) {
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
  }

  minimizeDialog(): void {
    this.isMinimizable = !this.isMinimizable;

    this.aiTabMinimized = !this.aiTabMinimized;
  }

  showSchedule() {
    this.showCheck++;
    if (this.showCheck == 1) {
      const materialDialog = this.dialog.open(ScheduleSendComponent, {
        width: '100vw',
        maxWidth: '350px',
        data: {
          type: 'text'
        }
      });
      materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
      materialDialog.afterClosed().subscribe((res) => {
        this.showCheck = 0;
        if (res && res.due_date) {
          this.scheduleDateTime = res.due_date;
          this.time_display = moment(this.scheduleDateTime).tz(this.time_zone);
          this.scheduleCheck = true;
          this.send();
        }
      });
    }
  }

  onTokenSelected(token: TemplateToken): void {
    setTimeout(() => {
      this.message = this.message.replace(`#${token.name}`, `{${token.name}}`);
    }, 50);
  }

  getTimeZoneInitial(time_zone: string): string {
    return TIME_ZONE_NAMES[time_zone] || time_zone;
  }
  writeGptResponseContent(data): void {
    this.insertTextContentValue(data);
  }
  setDialogExtend(_val = false): void {
    if (_val) {
      this.aiDialogExtendable = true;
      this.dialogWidth = 1000;
      this.editorHeight = 560;
    } else {
      this.aiDialogExtendable = false;
      this.dialogWidth = 680;
      this.editorHeight = 360;
    }
  }
  setAiMode(_val = true): void {
    if (_val) {
      this.presetText = '';
    } else {
      this.presetText = this.message;
    }
    this.setDialogExtend(true);
  }
  getConfirmMessage(): any {
    const garbage = this.userService.garbage.getValue();
    return garbage.confirm_message || {};
  }
  updateConfirmMessage(updateData): void {
    const garbage = this.userService.garbage.getValue();
    const data = {
      ...garbage.confirm_message,
      ...updateData
    };
    this.userService.updateGarbage({ confirm_message: data }).subscribe(() => {
      this.userService.updateGarbageImpl({
        confirm_message: data
      });
    });
  }
  cancelSchedule(): void {
    this.time_display = '';
    this.scheduleCheck = false;
    this.taskService.scheduleData.next({});
  }

  onSendCallback(param: any) {
    this.message = '';
    this.messages = [];
    this.onSend.emit(param);
  }

  setPhoneList($event): void {
    this.contactPhones = $event;
  }

  showAlert(msg: string): MatDialogRef<NotifyComponent> {
    const dialogRef = this.dialog.open(NotifyComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '400px',
      data: {
        message: msg
      }
    });
    return dialogRef;
  }

  focus(): void {
    this.onFocus?.emit();
  }

  getCalendlyUrl(val: string): string {
    const prefix = environment.isSspa
      ? environment.Vortex_Scheduler
      : environment.domain.scheduler;
    const fullUrl = val.includes('https://') ? val : `https://${prefix + val}`;
    return fullUrl;
  }

  messageChanged(): void {
    const segmentedMessage = new SegmentedMessage(
      this.message || '',
      'auto',
      true
    );
    this.segments = segmentedMessage.segmentsCount || 0;
  }
}
