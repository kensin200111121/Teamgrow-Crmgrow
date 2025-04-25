/**
 * This is special component for only send email on contact detail page
 */
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import * as _ from 'lodash';

import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import {
  DEFAULT_TEMPLATE_TOKENS,
  TIME_ZONE_NAMES,
  TIMES,
  WORK_TIMES
} from '@app/constants/variable.constants';
import { Contact } from '@app/models/contact.model';
import { Draft } from '@app/models/draft.model';
import { Garbage } from '@app/models/garbage.model';
import { Template } from '@app/models/template.model';
import { Alias, TemplateToken } from '@app/utils/data.types';
import moment from 'moment-timezone';
import { StripTagsPipe } from 'ngx-pipes';
import { Subscription } from 'rxjs';
import { HtmlEditorComponent } from '../html-editor/html-editor.component';
import { HelperService } from '@app/services/helper.service';
import { ContactService } from '@app/services/contact.service';
import { MaterialService } from '@app/services/material.service';
import { UserService } from '@app/services/user.service';
import { HandlerService } from '@app/services/handler.service';
import { DealsService } from '@app/services/deals.service';
import { ToastrService } from 'ngx-toastr';
import { TaskService } from '@app/services/task.service';
import { TemplatesService } from '@app/services/templates.service';
import { StoreService } from '@app/services/store.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { SspaService } from '@app/services/sspa.service';
import { Deal } from '@app/models/deal.model';
import { getUserTimezone } from '@app/helper';
import { ConfirmBusinessComponent } from '../confirm-business-hour/confirm-business-hour.component';
import { ScheduleResendComponent } from '../schedule-resend/schedule-resend.component';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { ScheduleSendComponent } from '../schedule-send/schedule-send.component';
import { NotifyComponent } from '../notify/notify.component';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { UserFeatureService } from '@app/services/user-features.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-inline-send-email',
  templateUrl: './inline-send-email.component.html',
  styleUrls: ['./inline-send-email.component.scss'],
  providers: [StripTagsPipe]
})
export class InlineSendEmailComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  readonly USER_FEATURES = USER_FEATURES;
  draftEmail = new Draft();
  contact: Contact | null;

  @Input() isFocused = false;
  @Input()
  public set setContact(val: Contact | null) {
    this.contact = val;
    if (val?.emails?.length > 0) {
      const primaryEmail = val.emails.find((item) => !!item.isPrimary);
      if (primaryEmail) {
        this.contactEmails = [primaryEmail.value];
      }
    }
    this.mainContact = val;
  }

  @Input()
  public set setDraft(val: any) {
    this.draftEmail = val;
  }

  @Input() contactId: string;
  @Input() draft?: any | null;
  @Input() timeZone?: any | null;

  //=============
  emailSubmitted = false;
  emailSending = false;

  sender: Alias = null;
  contactEmails: string[] = [];
  emailSubject = '';
  emailContent = '';
  selectedTemplate: Template = new Template();
  materials = [];
  landingPages = [];

  allMaterials = [];
  schedule_date = {
    year: '',
    month: '',
    day: ''
  };
  scheduleData: any;
  scheduleDateTime: any;
  scheduleCheck = false;
  planned = false;
  selectedDateTime;
  minDate: any;
  schedule_time = '12:00:00.000';
  times = TIMES;
  attachments = [];
  type = '';
  dealId;
  mainContact;
  toFocus = false;
  subjectFocus = false;
  contentFocus = false;
  showCheck = 0;
  hasCalendly = false;
  hasSchedule = false;
  garbage: Garbage = new Garbage();
  templateSubscription: Subscription;
  garbageSubscription: Subscription;
  profileSubscription: Subscription;
  loadSubscription: Subscription;
  saveSubscription: Subscription;
  aiTabMinimized = false;
  initEmailContent = '';
  initEmailSubject = '';
  initEmailContacts: string[] = [];
  userId = '';
  set = 'twitter';
  templateTokens: TemplateToken[] = [];
  tokens: string[] = [];
  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name'
  };

  subjectToken = '';
  contentToken = '';

  mode = 'create';
  dialogWidth = 600;
  editorHeight = 300;
  startTime = WORK_TIMES[0].id;
  endTime = WORK_TIMES[WORK_TIMES.length - 1].id;
  tz_display = '';
  time_zone = moment()['_z']?.name ? moment()['_z'].name : moment.tz.guess();
  time_display: any;
  aiDialogExtendable = false;
  presetText = '';

  @Input() subject = '';
  @Input() value = '';
  @Input() hasMaterial = true;
  @Input() draftContactEmails: string[] | null = null;
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onSend: EventEmitter<any> = new EventEmitter();
  @Output() onCallbackDestroySendEmail: EventEmitter<any> = new EventEmitter();

  @Output() onFocus? = new EventEmitter();

  @ViewChild('tokenField') tokenField: ElementRef;
  @ViewChild('subjectField') subjectField: ElementRef;
  @ViewChild('subjectTokenTrigger') subjectTokenTrigger: MatAutocompleteTrigger;
  @ViewChild('subjectTokenField') subjectTokenField: ElementRef;

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;
  //==============

  constructor(
    private dialog: MatDialog,
    private helperSerivce: HelperService,
    private contactService: ContactService,
    private materialService: MaterialService,
    private userService: UserService,
    private handlerService: HandlerService,
    private dealService: DealsService,
    private toast: ToastrService,
    private taskService: TaskService,
    private stripTags: StripTagsPipe,
    public templateService: TemplatesService,
    public storeService: StoreService,
    public sspaService: SspaService,
    private featureService: UserFeatureService
  ) {
    this.userId = this.userService.profile.getValue()._id;
  }

  ngOnDestroy(): void {
    const data = {
      contact: this.mainContact._id,
      subject: this.emailSubject,
      content: this.emailContent,
      user: this.userId,
      type: 'contact_email'
    };
    if (this?.draftEmail) {
      data['_id'] = this.draftEmail._id;
    }
    this.storeService.emailContactDraft.next(data);
    this.onCallbackDestroySendEmail.emit(this.contactEmails);
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

  ngOnInit(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (
        this.garbage?.calendly &&
        Object.keys(this.garbage?.calendly).length &&
        this.featureService.isEnableFeature(USER_FEATURES.CALENDER) &&
        !environment.isSspa
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
      if (res.template_tokens && res.template_tokens.length) {
        this.templateTokens = [...this.templateTokens, ...res.template_tokens];
      }
      this.tokens = this.templateTokens.map((e) => e.name);
      if (this.garbage.business_time) {
        this.startTime = this.garbage.business_time.start_time;
        this.endTime = this.garbage.business_time.end_time;
      }
    });
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        this.allMaterials = materials;
        this.allMaterials = _.uniqBy(this.allMaterials, '_id');
      }
    );

    const defaultEmail = this.userService.email.getValue();
    if (
      this.draftEmail &&
      (this.draftEmail.subject ||
        this.stripTags.transform(this.draftEmail.content || '').trim())
    ) {
      this.emailSubject = this.draftEmail.subject;
      this.emailContent = this.draftEmail.content;
    } else {
      if (defaultEmail) {
        setTimeout(() => {
          this.templateService.read(defaultEmail._id).subscribe((res) => {
            this.selectTemplate(res);
          });
        }, 300);
      }
      this.saveInitValue();
    }

    if (this?.timeZone) this.time_zone = this?.timeZone;
    else {
      this.time_zone = getUserTimezone(
        this.userService.profile.getValue(),
        false
      );
    }
    this.tz_display = this.getTimeZoneInitial(this.time_zone);
    this.time_display = moment(this.scheduleDateTime).tz(this.time_zone);
    this.templateService.loadOwn(true);
    if (this.draftContactEmails) {
      this.contactEmails = this.draftContactEmails;
    }
  }

  sendEmail(): void {
    if (this.isEmpty(this.emailContent) || !this.emailSubject) {
      this.scheduleCheck = false;
      return;
    }
    if (this.contactEmails.length === 0) {
      this.scheduleCheck = false;

      return;
    }
    const currentTime = moment().tz(this.time_zone).format('HH:mm:[00.000]');
    if (currentTime >= this.startTime && currentTime <= this.endTime) {
      if (this.contactEmails.length >= 200) {
        const flag = this.getConfirmMessage()['email_mass_overflow'];
        if (!flag) {
          const confirmDialog = this.dialog.open(ConfirmBusinessComponent, {
            maxWidth: '500px',
            width: '96vw',
            data: {
              title: 'Confirm',
              message: `Due to the size of this bulk email ${this.contactEmails.length} and the business hours you have set up at crmgrow, this email job will have time delay than your expectation.`,
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
                this.updateConfirmMessage({ email_mass_overflow: true });
              }
              this._sendEmail();
            }
          });
        } else {
          this._sendEmail();
        }
      } else {
        this._sendEmail();
      }
    } else {
      const flag = this.getConfirmMessage()['email_out_of_business_hour'];
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
              this.updateConfirmMessage({ email_out_of_business_hour: true });
            }
            this._sendEmail();
          }
        });
      } else {
        this._sendEmail();
      }
    }
  }

  _sendEmail(): void {
    // email api call
    const contacts = [this.contact?._id];
    const video_ids = [];
    const pdf_ids = [];
    const image_ids = [];
    const content = this.emailContent;
    const subject = this.emailSubject;
    const toEmails = [];
    this.contactEmails.forEach((e) => {
      toEmails.push(e);
    });
    const materials = this.helperSerivce.getMaterials(this.emailContent);
    const landingPages = this.helperSerivce.getLandingPages(this.emailContent);
    const page_ids = landingPages.map((page) => page._id);
    materials.forEach((e) => {
      const type = this.helperSerivce.getMaterialType(e);
      switch (type) {
        case 'PDF':
        case 'pdf':
          pdf_ids.push(e._id);
          break;
        case 'Image':
        case 'image':
          image_ids.push(e._id);
          break;
        case 'Video':
        case 'video':
          video_ids.push(e._id);
          break;
      }
    });
    const data = {
      contacts,
      video_ids,
      pdf_ids,
      image_ids,
      subject,
      content,
      toEmails,
      page_ids,

      attachments: this.attachments
    };
    if (!data.video_ids) {
      delete data.video_ids;
    }
    if (!data.pdf_ids) {
      delete data.pdf_ids;
    }
    if (!data.page_ids) {
      delete data.page_ids;
    }
    if (!data.image_ids) {
      delete data.image_ids;
    }
    let send_data;
    if (this.scheduleData) {
      send_data = {
        action: {
          video_ids,
          pdf_ids,
          image_ids,
          subject,
          content,
          page_ids,
          attachments: this.attachments
        },
        ...this.scheduleData,
        due_date: this.scheduleDateTime,
        timezone: this.time_zone,
        type: 'send_email'
      };
    } else {
      send_data = {
        action: {
          video_ids,
          pdf_ids,
          image_ids,
          subject,
          content,
          page_ids,
          attachments: this.attachments
        },
        due_date: this.scheduleDateTime,
        timezone: this.time_zone,
        type: 'send_email'
      };
    }
    if (!send_data.action.video_ids) {
      delete send_data.action.video_ids;
    }
    if (!send_data.action.pdf_ids) {
      delete send_data.pdf_ids;
    }
    if (!send_data.action.image_ids) {
      delete send_data.action.image_ids;
    }
    if (!send_data.action.page_ids) {
      delete send_data.action.page_ids;
    }
    if (this.sender?.email) {
      send_data['action']['sender'] = this.sender.email;
      data['sender'] = this.sender.email;
    }

    if (this.scheduleCheck) {
      this.sendSchedule(send_data, data.contacts, data.toEmails);
      return;
    }
    this.fireSendEmail(data);
  }

  fireSendEmail(data: any): void {
    if (data) {
      this.emailSending = true;
      this.materialService
        .sendMaterials({
          ...data
        })
        .subscribe((res) => {
          this.emailSending = false;
          if (res['status']) {
            if (res?.data['message'] === 'queue') {
              // toastr display, call status setting update
              this.toast.info(
                'Your email requests are queued. The email queue progressing would be displayed in the header.',
                'Email Queue',
                {
                  // disableTimeOut: true
                }
              );
              this.handlerService.runScheduleTasks();
            } else {
              if (res['data']['queue']) {
                const queueCount = res['data']['queue'];
                const sentCount = data.contacts.length - queueCount;
                this.toast.success(
                  `${sentCount} emails are sent successfully. ${queueCount} emails are queued. The email queue progressing would be displayed in the header.`,
                  'Email Sent'
                );
              }
            }
          } else if (res.statusCode === 405) {
            let failed = res.error && res.error.length;
            failed += res.notExecuted && res.notExecuted.length;
            if (failed < data.contacts.length) {
              const sentCount = res.sent || 0;
              const queueCount = res.queue || 0;
              let message = '';
              if (queueCount) {
                message = `${failed} emails are failed. ${sentCount} are succeed. Rest email requests are queued. The email queue progressing would be displayed in the header.`;
              } else {
                message = `${failed} emails are failed. ${sentCount} are succeed.`;
              }
              this.toast.warning(message, 'Email Sent');
            }
          }
          this.emailSubmitted = false;
          const length =
            (data.video_ids ? data.video_ids.length : 0) +
            (data.pdf_ids ? data.pdf_ids.length : 0) +
            (data.image_ids ? data.image_ids.length : 0) +
            1;
          this.handlerService.addLatestActivities$(length);
          if (res['status']) {
            this.onSendCallback();
          }
        });
    }
  }

  /**
   * Open the Material Select Dialog
   */
  sendSchedule(data: any, contacts: any, toEmails: string[]): void {
    const send_data = { contacts: contacts, data, toEmails };
    this.emailSending = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();

    this.taskService.scheduleSendCreate(send_data).subscribe((res) => {
      this.emailSending = false;
      if (res?.status) {
        if (res?.message === 'all_queue') {
          this.toast.info(
            'Your email requests are queued. The email queue progressing would be displayed in the header.',
            'Email Queue',
            {}
          );
        } else {
          this.toast.error('Schedules sending is failed.', 'Schedule Sent');
        }
        this.taskService.scheduleData.next({});
        this.handlerService.activityAdd$(contacts, 'task');
        this.handlerService.reload$('tasks');
        this.handlerService.runScheduleTasks();

        this.onSendCallback();
      } else {
        if (res?.statusCode === 405) {
          this.dialog.closeAll();
          this.dialog.open(ScheduleResendComponent, {
            width: '98vw',
            maxWidth: '420px',
            data: { ...res?.data, data }
          });
        } else {
          this.toast.error(res?.error);
        }
      }
      this.emailSubmitted = false;
    });
  }

  openMaterialsDlg(): void {
    const content = this.emailContent;
    const materials = this.helperSerivce.getMaterials(content);
    const landingPages = this.helperSerivce.getLandingPages(content);

    const materialDialog = this.dialog.open(MaterialBrowserV2Component, {
      width: '98vw',
      maxWidth: '940px',
      data: {
        hideMaterials: materials,
        hideLandingPageItems: landingPages,
        title: 'Insert material',
        multiple: true,
        enableSelectLandingPage: true,
        onlyMine: false
      }
    });
    materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res && res.materials) {
        this.materials = _.intersectionBy(this.materials, materials, '_id');
        this.materials = [...this.materials, ...res.materials];
        this.htmlEditor.insertBeforeMaterials();
        for (let i = 0; i < res.materials.length; i++) {
          const material = res.materials[i];
          this.htmlEditor.insertMaterials(material);
        }
      } else if (res && res.landingPages) {
        this.landingPages = _.intersectionBy(
          this.landingPages,
          landingPages,
          '_id'
        );
        this.landingPages = [...this.landingPages, ...res.landingPages];
        this.htmlEditor.insertBeforeMaterials();
        for (let i = 0; i < res.landingPages.length; i++) {
          const landingPage = res.landingPages[i];
          this.htmlEditor.insertLandingPage(landingPage);
        }
      }
    });
  }

  onRecordCompleted($event): void {
    this.materials.push($event);
  }

  onChangeTemplate(template: Template): void {
    this.emailSubject = template.subject;
  }

  getScheduleDateTime(): any {
    if (this.schedule_date.day != '' && this.schedule_time != '') {
      return moment(
        this.schedule_date.year +
          '-' +
          this.schedule_date.month +
          '-' +
          this.schedule_date.day +
          ' ' +
          this.schedule_time
      ).format();
    }
  }

  setScheduleDateTime(): void {
    this.scheduleDateTime = moment(
      this.schedule_date.year +
        '-' +
        this.schedule_date.month +
        '-' +
        this.schedule_date.day +
        ' ' +
        this.schedule_time
    ).format();
    this.planned = true;
  }

  removeSchedule(): void {
    this.planned == false;
    this.scheduleDateTime = '';
  }

  onAttachmentChange(attachments: any[]): void {
    this.attachments = attachments;
  }

  removeContact(contact: Contact): void {
    if (this.mainContact) {
      if (this.mainContact._id === contact._id) {
        this.contactEmails.unshift(this.mainContact);
      }
    }
  }

  setEmailList($event): void {
    this.contactEmails = $event;
  }

  blueAll(): void {
    this.toFocus = false;
  }

  subjectFoucs(): void {
    this.toFocus = false;
    this.subjectFocus = true;
    this.contentFocus = false;
  }

  contentFoucs(): void {
    this.toFocus = false;
    this.subjectFocus = false;
    this.contentFocus = true;
  }

  setFocus(): void {
    this.toFocus = true;
  }

  isFocus(): any {
    return this.toFocus;
  }

  saveInitValue(): void {
    this.initEmailContent = this.emailContent;
    this.initEmailSubject = this.emailSubject;
    this.initEmailContacts = [...this.contactEmails];
  }

  checkModified(): boolean {
    if (this.initEmailContent !== this.emailContent) {
      if (this.emailContent !== null) {
        return true;
      }
    }
    if (this.initEmailSubject !== this.emailSubject) {
      if (this.emailSubject !== null) {
        return true;
      }
    }
    if (this.initEmailContacts.length !== this.contactEmails.length) {
      return true;
    } else {
      if (
        !_.differenceWith(this.initEmailContacts, this.contactEmails, _.isEqual)
      ) {
        return true;
      }
    }

    return false;
  }

  showSchedule(event: Event) {
    event.preventDefault();
    if (this.contactEmails.length === 0) {
      this.showAlert('Please specify at least one recipient.');
      return;
    }

    this.showCheck++;
    if (this.showCheck == 1) {
      const materialDialog = this.dialog.open(ScheduleSendComponent, {
        width: '100vw',
        maxWidth: '350px',
        data: {
          type: 'email'
        }
      });
      materialDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
      materialDialog.afterClosed().subscribe((res) => {
        if (res) {
          if (res.due_date) {
            this.time_display = moment(res.due_date).tz(this.time_zone);

            if (res.due_date) {
              this.scheduleData = res;
              this.scheduleDateTime = res.due_date;
              this.scheduleCheck = true;
              this.sendEmail();
            }
          }
        }
        this.showCheck = 0;
      });
    }
  }

  selectTemplate(template: Template): void {
    this.htmlEditor.selectTemplate(template);
    this.emailSubject = template.subject;
    if (template.attachments?.length) {
      template.attachments.forEach((e) => {
        this.attachments.push(e);
      });
    }
  }

  insertTextContentToken(data): void {
    if (this.contentFocus) {
      this.htmlEditor.insertEmailContentToken(data.value);
    }
    if (this.subjectFocus) {
      const tokenValue = `{${data.value}}`;
      const field = this.subjectField.nativeElement;
      field.focus();
      let cursorStart = this.emailSubject.length;
      let cursorEnd = this.emailSubject.length;
      if (field.selectionStart || field.selectionStart === '0') {
        cursorStart = field.selectionStart;
      }
      if (field.selectionEnd || field.selectionEnd === '0') {
        cursorEnd = field.selectionEnd;
      }
      field.setSelectionRange(cursorStart, cursorEnd);
      document.execCommand('insertText', false, tokenValue);
      cursorStart += tokenValue.length;
      cursorEnd = cursorStart;
      field.setSelectionRange(cursorStart, cursorEnd);
    }
  }
  writeGptResponseContent(data): void {
    this.htmlEditor.insertEmailContentText(data);
  }

  insertEmojiContentvalue(value: string): void {
    this.htmlEditor.insertEmailContentValue(value, true);
  }

  isEmpty(content: string): boolean {
    const hasEmpty = !(this.stripTags.transform(content || '') || '').trim();
    if (hasEmpty) {
      if (content && content.indexOf('<img') !== -1) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * init or change the sender email
   * @param $event: sender
   */
  onSelectSender($event: Alias): void {
    this.sender = $event;
  }

  onSubjectTokenSelected(token): void {
    setTimeout(() => {
      this.emailSubject = this.emailSubject.replace(
        `#${token.name}`,
        `{${token.name}}`
      );
    }, 50);
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
  getTimeZoneInitial(time_zone: string): string {
    return TIME_ZONE_NAMES[time_zone] || time_zone;
  }
  setDialogExtend(_val = false): void {
    if (_val) {
      this.aiDialogExtendable = true;
      this.dialogWidth = 970;
      this.editorHeight = 500;
    } else {
      this.aiDialogExtendable = false;
      this.dialogWidth = 600;
      this.editorHeight = 300;
    }
  }
  setAiMode(_val = true): void {
    if (_val) {
      this.presetText = '';
    } else {
      this.presetText = this.emailContent;
    }
    this.setDialogExtend(true);
  }
  cancelSchedule(): void {
    this.time_display = '';
    this.scheduleCheck = false;
    this.taskService.scheduleData.next({});
  }

  onSendCallback() {
    this.emailSubject = '';
    this.emailContent = '';
    this.attachments = [];

    this.onSend.emit({ status: true, draftId: this.draftEmail?._id });
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
}
