import { SspaService } from '../../services/sspa.service';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { MaterialService } from '@services/material.service';
import { HelperService } from '@services/helper.service';
import { ContactService } from '@services/contact.service';
import { Contact } from '@models/contact.model';
import { Template } from '@models/template.model';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import { ScheduleSendComponent } from '@components/schedule-send/schedule-send.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import * as _ from 'lodash';
import {
  TIMES,
  CHUNK_SIZE,
  DEFAULT_TEMPLATE_TOKENS,
  WORK_TIMES
} from '@constants/variable.constants';
import moment from 'moment-timezone';
import { UserService } from '@services/user.service';
import { DealsService } from '@services/deals.service';
import { HandlerService } from '@services/handler.service';
import { Subscription } from 'rxjs';
import { Garbage } from '@models/garbage.model';
import { StripTagsPipe } from 'ngx-pipes';
import { ToastrService } from 'ngx-toastr';
import { StoreService } from '@services/store.service';
import { Draft } from '@models/draft.model';
import { TemplatesService } from '@services/templates.service';
import { TaskService } from '@services/task.service';
import { Alias, TemplateToken } from '@utils/data.types';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ConfirmBusinessComponent } from '@components/confirm-business-hour/confirm-business-hour.component';
import { TIME_ZONE_NAMES } from '@constants/variable.constants';
import { environment } from '@environments/environment';
import { getUserTimezone } from '@app/helper';
import { MaterialBrowserV2Component } from '../material-browser-v2/material-browser-v2.component';
import { ScheduleResendComponent } from '../schedule-resend/schedule-resend.component';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { UserFeatureService } from '@app/services/user-features.service';

@Component({
  selector: 'app-send-email',
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.scss'],
  providers: [StripTagsPipe]
})
export class SendEmailComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly USER_FEATURES = USER_FEATURES;
  emailSubmitted = false;
  emailSending = false;
  ccFlag = false;
  bccFlag = false;
  sender: Alias = null;
  emailContacts: Contact[] = [];
  ccContacts: Contact[] = [];
  bccContacts: Contact[] = [];
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
  garbage: Garbage = new Garbage();
  templateSubscription: Subscription;
  garbageSubscription: Subscription;
  profileSubscription: Subscription;
  loadSubscription: Subscription;
  saveSubscription: Subscription;
  dialogType = '';
  isMinimizable = true;
  aiTabMinimized = false;
  initEmailContent = '';
  initEmailSubject = '';
  initEmailContacts: Contact[] = [];
  initCcContacts: Contact[] = [];
  initBccContacts: Contact[] = [];
  userId = '';
  draftEmail = new Draft();
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
  hasMaterial = true;
  hasSchedule = true;
  isSspa = false;
  @Input() subject = '';
  @Input() value = '';
  @ViewChild('tokenField') tokenField: ElementRef;
  @ViewChild('subjectField') subjectField: ElementRef;
  @ViewChild('subjectTokenTrigger') subjectTokenTrigger: MatAutocompleteTrigger;
  @ViewChild('subjectTokenField') subjectTokenField: ElementRef;

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<SendEmailComponent>,
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
    @Inject(MAT_DIALOG_DATA) private data: any,
    public sspaService: SspaService,
    private featureService: UserFeatureService
  ) {
    if (this.data && this.data._id) {
      this.mode = 'edit';
    } else {
      this.mode = 'create';
    }
    this.userId = this.userService.profile.getValue()._id;
    const userInfo = this.userService.profile.getValue();
    if (this.data && this.data.deal) {
      this.dealId = this.data.deal;
      this.type = 'deal';
      for (const contact of this.data.contacts) {
        this.emailContacts.push(contact);
      }
      if (this.data.due_date) {
        this.scheduleCheck = true;
        this.emailSubject = this.data.subject;
      }
    } else {
      if (this.data && this.data.contact) {
        this.emailContacts = [this.data.contact];
        this.mainContact = this.data.contact;
      }
      if (this.data && this.data.contacts && !this.data.due_date) {
        this.emailContacts = [...this.data.contacts];
        this.emailSubject = this.data.subject;
      }
      if (this.data && this.data.contacts && this.data.due_date) {
        this.emailContacts = [...this.data.contacts];
        this.emailSubject = this.data.subject;
        this.scheduleCheck = true;
      }
    }
    if (this.data && this.data.type) {
      this.dialogType = this.data.type;
    }
    if (this.data && this.data._id) {
      if (this.data.type === 'email') {
        this.emailSubject = this.data.subject;
        this.emailContent = this.data.content;
      }
    }
    if (this.data && this.data.draft) {
      this.draftEmail = this.data.draft;
    }
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (
        featureService.isEnableFeature(USER_FEATURES.CALENDER) &&
        this.garbage?.calendly &&
        Object.keys(this.garbage?.calendly).length
      ) {
        this.hasCalendly = true;
      } else {
        this.hasCalendly = false;
      }

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
    this.hasMaterial = featureService.isEnableFeature(USER_FEATURES.MATERIAL);
    this.hasSchedule = featureService.isEnableFeature(USER_FEATURES.SCHEDULER);
    this.isSspa = environment.isSspa;
  }

  ngOnInit(): void {
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
    if (this.data && this.data.due_date) {
      this.scheduleData = this.data;
      this.scheduleDateTime = this.data.due_date;
    }
    if (this?.data?.time_zone) this.time_zone = this?.data?.time_zone;
    else {
      this.time_zone = getUserTimezone(
        this.userService.profile.getValue(),
        false
      );
    }
    this.tz_display = this.getTimeZoneInitial(this.time_zone);
    this.time_display = moment(this.scheduleDateTime)
      .tz(this.time_zone)
      .format('MMM DD YYYY h:mm A');
    this.templateService.loadOwn(true);
  }
  ngOnDestroy(): void {
    if (this.dialogType === 'contact_email') {
      const data = {
        contact: this.mainContact._id,
        subject: this.emailSubject,
        content: this.emailContent,
        user: this.userId,
        type: 'contact_email'
      };
      if (this.data.draft) {
        data['_id'] = this.data.draft._id;
      }
      this.storeService.emailContactDraft.next(data);
    } else if (this.dialogType === 'deal_email') {
      const data = {
        user: this.userId,
        type: 'deal_email',
        subject: this.emailSubject,
        content: this.emailContent,
        deal: this.dealId
      };
      if (this.data.draft) {
        data['_id'] = this.data.draft._id;
      }
      this.storeService.emailDealDraft.next(data);
    } else if (this.dialogType === 'global_email') {
      const data = {
        subject: this.emailSubject,
        content: this.emailContent
      };
      this.storeService.emailGlobalDraft.next(data);
    }
    this.templateSubscription && this.templateSubscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.taskService.scheduleData$.subscribe((data) => {
      if (data.due_date) {
        this.scheduleData = data;
        this.scheduleDateTime = data.due_date;
        this.scheduleCheck = true;
      }
      if (data?.time_zone) {
        this.time_zone = data?.time_zone;
        this.tz_display = this.getTimeZoneInitial(this.time_zone);
        this.time_display = moment(this.scheduleDateTime)
          .tz(this.time_zone)
          .format('MMM DD YYYY h:mm A');
      }
    });
  }

  sendEmail(): void {
    if (this.isEmpty(this.emailContent)) {
      return;
    }
    if (this.emailContacts.length === 0) {
      return;
    }
    const currentTime = moment().tz(this.time_zone).format('HH:mm:[00.000]');
    if (currentTime >= this.startTime && currentTime <= this.endTime) {
      if (this.emailContacts.length >= 200) {
        const flag = this.getConfirmMessage()['email_mass_overflow'];
        if (!flag) {
          const confirmDialog = this.dialog.open(ConfirmBusinessComponent, {
            maxWidth: '500px',
            width: '96vw',
            data: {
              title: 'Confirm',
              message: `Due to the size of this bulk email ${this.emailContacts.length} and the business hours you have set up at crmgrow, this email job will have time delay than your expectation.`,
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
    const contacts = [];
    const newContacts = [];
    const cc = [];
    const bcc = [];
    const video_ids = [];
    const pdf_ids = [];
    const image_ids = [];

    const content = this.emailContent;
    const subject = this.emailSubject;
    this.emailContacts.forEach((e) => {
      if (e._id) contacts.push(e._id);
      else newContacts.push(e);
    });
    this.ccContacts.forEach((e) => cc.push(e.email));
    this.bccContacts.forEach((e) => bcc.push(e.email));
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
      cc,
      bcc,
      video_ids,
      pdf_ids,
      image_ids,
      subject,
      content,
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
          cc,
          bcc,
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
          cc,
          bcc,
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
        recurrence_mode: this.data.recurrence_mode,
        set_recurrence: this.data.set_recurrence,
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
    if (newContacts.length > 0) {
      this.emailSending = true;
      this.contactService.bulkCreate(newContacts).subscribe((res) => {
        if (res) {
          const addedContacts = res['succeed'];
          addedContacts.forEach((e) => data.contacts.push(e._id));
        }
        if (data.contacts.length > 0) {
          if (this.scheduleCheck) {
            this.sendSchedule(send_data, data.contacts);
            return;
          }
          this.fireSendEmail(data);
        } else {
          // nothing to send email
          this.emailSending = false;
          this.toast.warning(
            `${this.emailContacts.length} emails are failed.`,
            'Email Sent'
          );
        }
      });
    } else {
      if (this.scheduleCheck) {
        this.sendSchedule(send_data, data.contacts);
        return;
      }
      this.fireSendEmail(data);
    }
  }

  fireSendEmail(data: any): void {
    if (data) {
      if (this.type === 'deal') {
        this.emailSending = true;
        this.dealService
          .sendEmail({
            deal: this.dealId,
            ...data
          })
          .subscribe((res) => {
            this.emailSending = false;
            if (res['status']) {
              if (res['message'] === 'queue') {
                // toastr display, call status setting update
                this.toast.info(
                  'Your email requests are queued. The email queue progressing would be displayed in the header.',
                  'Email Queue'
                );
              } else {
                this.toast.success(`emails are sent successfully. `);
              }
            } else if (res.statusCode === 405) {
              let failed = res.error && res.error.length;
              failed += res.notExecuted && res.notExecuted.length;
              if (failed < data.contacts.length) {
                const sentCount = res.sent || 0;
                const message = `${failed} emails are failed. ${sentCount} are succeed.`;
                this.toast.warning(message, 'Email Sent');
              }
            }
            const length =
              (data.video_ids ? data.video_ids.length : 0) +
              (data.pdf_ids ? data.pdf_ids.length : 0) +
              (data.image_ids ? data.image_ids.length : 0) +
              1;
            this.handlerService.addLatestActivities$(length);

            if (res['status']) {
              this.dialogRef.close({ send: this.draftEmail });
            } else {
              if (!this.isSspa) {
                this.dialogRef.close();
              }
            }
          });
      } else {
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
            const length =
              (data.video_ids ? data.video_ids.length : 0) +
              (data.pdf_ids ? data.pdf_ids.length : 0) +
              (data.image_ids ? data.image_ids.length : 0) +
              1;
            this.handlerService.addLatestActivities$(length);
            if (res['status']) {
              this.dialogRef.close({ send: this.draftEmail });
            }
          });
      }
    }
  }

  /**
   * Open the Material Select Dialog
   */
  sendSchedule(data: any, contacts: any): void {
    const send_data = { contacts: contacts, data };
    this.emailSending = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    if (this.data.deal) {
      send_data['deal'] = this.data.deal;
    }
    if (this.data._id) {
      send_data['id'] = this.data._id;
    }

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
        this.dialogRef.close({ status: true });
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
        this.emailContacts.unshift(this.mainContact);
      }
    }
  }

  checkDuplication(field: string): void {
    let newContact;
    let isChecked = false;
    switch (field) {
      case 'to':
        newContact = this.emailContacts.slice(-1)[0];
        // cc && bcc check
        this.ccContacts.some((e) => {
          if (e.email === newContact.email) {
            this.emailContacts.splice(-1);
            isChecked = true;
            return true;
          }
        });
        if (!isChecked) {
          this.bccContacts.some((e) => {
            if (e.email === newContact.email) {
              this.emailContacts.splice(-1);
              return true;
            }
          });
        }
        break;
      case 'cc':
        newContact = this.ccContacts.slice(-1)[0];
        // cc && bcc check
        this.emailContacts.some((e) => {
          if (e.email === newContact.email) {
            this.ccContacts.splice(-1);
            isChecked = true;
            return true;
          }
        });
        if (!isChecked) {
          this.bccContacts.some((e) => {
            if (e.email === newContact.email) {
              this.ccContacts.splice(-1);
              return true;
            }
          });
        }
        break;
      case 'bcc':
        newContact = this.bccContacts.slice(-1)[0];
        // cc && bcc check
        this.emailContacts.some((e) => {
          if (e.email === newContact.email) {
            this.bccContacts.splice(-1);
            isChecked = true;
            return true;
          }
        });
        if (!isChecked) {
          this.ccContacts.some((e) => {
            if (e.email === newContact.email) {
              this.bccContacts.splice(-1);
              return true;
            }
          });
        }
        break;
    }
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

  minimizeDialog(): void {
    if (this.dialogType === 'global_email') {
      const windowType = this.storeService.emailWindowType.getValue();
      this.storeService.emailWindowType.next(!windowType);
    } else {
      this.isMinimizable = !this.isMinimizable;
    }
    this.aiTabMinimized = !this.aiTabMinimized;
  }

  saveInitValue(): void {
    this.initEmailContent = this.emailContent;
    this.initEmailSubject = this.emailSubject;
    this.initEmailContacts = [...this.emailContacts];
    this.initCcContacts = [...this.ccContacts];
    this.initBccContacts = [...this.bccContacts];
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
    if (this.initEmailContacts.length !== this.emailContacts.length) {
      return true;
    } else {
      if (
        !_.differenceWith(this.initEmailContacts, this.emailContacts, _.isEqual)
      ) {
        return true;
      }
    }
    if (this.initCcContacts.length !== this.ccContacts.length) {
      return true;
    } else {
      if (!_.differenceWith(this.initCcContacts, this.ccContacts, _.isEqual)) {
        return true;
      }
    }
    if (this.initBccContacts.length !== this.bccContacts.length) {
      return true;
    } else {
      if (
        !_.differenceWith(this.initBccContacts, this.bccContacts, _.isEqual)
      ) {
        return true;
      }
    }
    return false;
  }
  showSchedule() {
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
            this.time_display = moment(res.due_date)
              .tz(this.time_zone)
              .format('MMM DD YYYY h:mm A');
          }
        }
        this.showCheck = 0;
      });
    }
  }
  closeDialog(): void {
    this.taskService.scheduleData.next({});
    if (this.dialogType === 'contact_email') {
      const data = {
        contact: this.mainContact._id,
        subject: this.emailSubject,
        content: this.emailContent,
        user: this.userId,
        type: 'contact_email'
      };
      this.dialogRef.close({ draft: data });
    } else if (this.dialogType === 'deal_email') {
      const data = {
        user: this.userId,
        type: 'deal_email',
        subject: this.emailSubject,
        content: this.emailContent,
        deal: this.dealId
      };
      this.dialogRef.close({ draft: data });
    } else if (this.dialogType === 'global_email') {
      const data = {
        subject: this.emailSubject,
        content: this.emailContent
      };
      this.dialogRef.close({ draft: data });
    } else {
      this.dialogRef.close();
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
}
