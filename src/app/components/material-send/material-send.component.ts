import { SspaService } from '../../services/sspa.service';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Contact } from '@models/contact.model';
import moment from 'moment-timezone';
import { forkJoin, from } from 'rxjs';
import { Template } from '@models/template.model';
import { UserService } from '@services/user.service';
import { MaterialService } from '@services/material.service';
import { ContactService } from '@services/contact.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment';
import { TemplatesService } from '@services/templates.service';
import { ConnectService } from '@services/connect.service';
import { TaskService } from '@services/task.service';
import { Garbage } from '@models/garbage.model';
import { Subscription } from 'rxjs';
import { convertIdToUrlOnSMS, isEmptyHtml } from '@utils/functions';
import {
  CHUNK_SIZE,
  DEFAULT_TEMPLATE_TOKENS
} from '@constants/variable.constants';
import { HandlerService } from '@services/handler.service';
import { HtmlEditorComponent } from '@components/html-editor/html-editor.component';
import { ScheduleSendComponent } from '@components/schedule-send/schedule-send.component';
import { User } from '@models/user.model';
import { Alias, TemplateToken } from '@utils/data.types';
import { SegmentedMessage } from 'sms-segments-calculator';

@Component({
  selector: 'app-material-send',
  templateUrl: './material-send.component.html',
  styleUrls: ['./material-send.component.scss']
})
export class MaterialSendComponent implements OnInit {
  user: User = new User();
  sender: Alias = null;
  contacts: Contact[] = [];
  videos: any[] = [];
  pdfs: any[] = [];
  images: any[] = [];
  attachments = [];
  emailTemplate: Template = new Template();
  textTemplate: Template = new Template();
  segments = 0;
  subject = '';
  emailContent = '';
  textContent = '';
  sending = false;
  firstMaterialType = '';
  isCalendly = false;
  garbage: Garbage = new Garbage();
  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  subjectFocus = false;
  contentFocus = false;
  scheduleData: any;
  scheduleDateTime: any;
  strScheduleDate: string;
  strScheduleTime: string;
  scheduleCheck = false;
  @ViewChild('messageText') messageEl: ElementRef;
  @ViewChild('subjectField') subjectField: ElementRef;
  templateSubject = '';
  templateValue = '';
  set = 'twitter';
  @ViewChild('emailEditor') htmlEditor: HtmlEditorComponent;
  templateTokens: TemplateToken[] = [];
  tokens: string[] = [];
  sendMode = 'email';
  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name'
  };
  redirectArticleURL =
    'https://kb1.crmgrow.com/kb/guide/en/sms-texting-character-limits-8DWOLjE5ZS/Steps/4023017';
  constructor(
    private userService: UserService,
    private contactService: ContactService,
    public connectService: ConnectService,
    private materialService: MaterialService,
    public templateService: TemplatesService,
    private taskService: TaskService,
    private toast: ToastrService,
    private handlerService: HandlerService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<MaterialSendComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
        }
      }
    );
  }

  ngOnInit(): void {
    this.templateService.loadAll(false);
    if (this.data.material.length) {
      if (this.data.material_type) {
        switch (this.data.material_type) {
          case 'video':
            this.videos = [...this.data.material];
            break;
          case 'pdf':
            this.pdfs = [...this.data.material];
            break;
          case 'image':
            this.images = [...this.data.material];
            break;
        }
        this.firstMaterialType = this.data.material_type;
      } else {
        this.data.material.forEach((e) => {
          switch (e.material_type) {
            case 'video':
              this.videos.push(e);
              break;
            case 'pdf':
              this.pdfs.push(e);
              break;
            case 'image':
              this.images.push(e);
              break;
          }
        });
        this.firstMaterialType = this.data.material[0]['material_type'];
      }
    }
    if (this.data.type) {
      if (this.data.type === 'email') {
        this.sendMode = 'email';
      } else {
        this.sendMode = 'text';
      }
    }
    const defaultEmail = this.userService.email.getValue();
    if (defaultEmail) {
      this.emailContent = defaultEmail.content;
      this.subject = defaultEmail.subject;
    }
    const defaultSms = this.userService.sms.getValue();
    if (defaultSms) {
      this.textContent = defaultSms.content;
    }

    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      if (
        this.garbage?.calendly &&
        Object.keys(this.garbage?.calendly).length &&
        !environment.isSspa
      ) {
        this.isCalendly = true;
        this.connectService.loadCalendlyAll(false);
      } else {
        this.isCalendly = false;
      }
      this.templateTokens = DEFAULT_TEMPLATE_TOKENS;
      const user = this.userService.profile.getValue();
      if (!user?.assignee_info?.is_enabled) {
        this.templateTokens = this.templateTokens.filter((token) => {
          return token.id < 10; // subtract assignee tokens
        });
      }
      this.templateTokens = [
        ...this.templateTokens,
        ...this.garbage.template_tokens
      ];
      this.tokens = this.templateTokens.map((e) => e.name);
    });
  }
  ngAfterViewInit(): void {
    this.taskService.scheduleData$.subscribe((data) => {
      if (data.due_date) {
        this.scheduleData = data;
        this.scheduleDateTime = data.due_date;
        const format = 'MMM DD,YYYY';
        const strDate = moment(data.due_date, format).format(format);
        const strTime = this.scheduleDateTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        this.strScheduleDate = strDate;
        this.strScheduleTime = strTime;
        this.scheduleCheck = true;
      }
    });
  }

  selectNewContacts(event): void {
    this.contacts = [event];
  }

  selectTextTemplate(template: Template): void {
    this.messageEl.nativeElement.focus();
    const field = this.messageEl.nativeElement;
    template.content = convertIdToUrlOnSMS(template.content);
    if (!this.textContent.replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, template.content);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.textContent[field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    } else {
      if (this.textContent.slice(-1) === '\n') {
        document.execCommand('insertText', false, template.content);
      } else {
        document.execCommand('insertText', false, '\n' + template.content);
      }
    }
  }

  selectEmailTemplate(template: Template): void {
    this.htmlEditor.selectTemplate(template);
    this.subject = template.subject;
    if (template.attachments.length) {
      template.attachments.forEach((e) => {
        this.attachments.push(e);
      });
    }
  }

  insertEmailContentValue(data): void {
    if (this.sendMode === 'text') {
      this.insertTextContentValue(data);
      return;
    }
    if (this.contentFocus) {
      if (data.token) {
        this.htmlEditor.insertEmailContentToken(data.value);
      } else {
        this.htmlEditor.insertEmailContentValue(data, true);
      }
    }
    if (this.subjectFocus) {
      let iValue = data.value;
      if (data.token) iValue = `{${data.value}}`;
      const field = this.subjectField.nativeElement;
      field.focus();
      let cursorStart = this.subject.length;
      let cursorEnd = this.subject.length;
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
  }

  selectCalendly(url: string): void {
    if (this.sendMode === 'email') {
      this.htmlEditor.selectCalendly(url);
      return;
    }
    const prefix = environment.isSspa
      ? environment.Vortex_Scheduler
      : environment.domain.scheduler;
    const fullUrl = url.includes('https://') ? url : `https://${prefix + url}`;
    this.messageEl.nativeElement.focus();
    const field = this.messageEl.nativeElement;
    if (!this.textContent.replace(/(\r\n|\n|\r|\s)/gm, '')) {
      field.select();
      document.execCommand('insertText', false, fullUrl);
      return;
    }
    if (field.selectionEnd || field.selectionEnd === 0) {
      if (this.textContent[field.selectionEnd - 1] === '\n') {
        document.execCommand('insertText', false, fullUrl);
      } else {
        document.execCommand('insertText', false, '\n' + fullUrl);
      }
    } else {
      if (this.textContent.slice(-1) === '\n') {
        document.execCommand('insertText', false, fullUrl);
      } else {
        document.execCommand('insertText', false, '\n' + fullUrl);
      }
    }
  }

  subjectFoucs(): void {
    this.subjectFocus = true;
    this.contentFocus = false;
  }

  contentFoucs(): void {
    this.subjectFocus = false;
    this.contentFocus = true;
  }

  onChangeTemplate(event: Template): void {
    this.subject = event.subject;
  }

  onAttachmentChange(attachments: any[]): void {
    this.attachments = attachments;
  }

  insertTextContentValue(data): void {
    let iValue;
    if (data.token) {
      iValue = `{${data.value}}`;
    } else {
      iValue = data;
    }
    const field = this.messageEl.nativeElement;
    field.focus();
    let cursorStart = this.textContent.length;
    let cursorEnd = this.textContent.length;
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

  showSchedule(): void {
    const timeScheduleDIalog = this.dialog.open(ScheduleSendComponent, {
      width: '100vw',
      maxWidth: '350px',
      data: {
        type: this.data.type
      }
    });
    timeScheduleDIalog['_ref']['overlayRef']['_host'].classList.add(
      'top-dialog'
    );
  }
  send(): void {
    if (this.contacts.length === 0 || this.sending) {
      return;
    }
    this.sending = true;
    if (this.sendMode === 'text') {
      // Send Text
      const newContacts = [];
      this.contacts.forEach((e) => {
        if (!e._id) {
          newContacts.push(e);
        }
      });
      if (newContacts.length) {
        this.contactService.bulkCreate(newContacts).subscribe((res) => {
          const newContactIds = [];
          if (res) {
            const addedContacts = res['succeed'];
            addedContacts.forEach((e) => newContactIds.push(e._id));
          }
          this.sendText(newContactIds);
        });
      } else {
        this.sendText([]);
      }
    } else if (this.sendMode === 'email') {
      // Send Email
      const newContacts = [];
      this.contacts.forEach((e) => {
        if (!e._id) {
          newContacts.push(e);
        }
      });
      if (newContacts.length) {
        this.contactService.bulkCreate(newContacts).subscribe((res) => {
          const newContactIds = [];
          if (res) {
            const addedContacts = res['succeed'];
            addedContacts.forEach((e) => newContactIds.push(e._id));
          }
          this.sendEmail(newContactIds);
        });
      } else {
        this.sendEmail([]);
      }
    }
  }

  sendText(newContacts: string[]): void {
    const contacts = [...newContacts];
    const video_ids = [];
    const pdf_ids = [];
    const image_ids = [];
    const data = {};
    this.contacts.forEach((e) => {
      if (e._id && e.cell_phone) {
        contacts.push(e._id);
      }
    });
    this.videos.forEach((e) => video_ids.push(e._id));
    this.pdfs.forEach((e) => pdf_ids.push(e._id));
    this.images.forEach((e) => image_ids.push(e._id));
    if (video_ids.length) {
      data['video_ids'] = video_ids;
    }
    if (pdf_ids.length) {
      data['pdf_ids'] = pdf_ids;
    }
    if (image_ids.length) {
      data['image_ids'] = image_ids;
    }
    let message = this.textContent;
    if (this.textContent && this.textContent.slice(-1) !== '\n') {
      message += '\n';
    }
    video_ids.forEach((e) => {
      const url = `{{video:${e}}}`;
      message = message + '\n' + url;
    });
    pdf_ids.forEach((e) => {
      const url = `{{pdf:${e}}}`;
      message = message + '\n' + url;
    });
    image_ids.forEach((e) => {
      const url = `{{image:${e}}}`;
      message = message + '\n' + url;
    });
    const send_data = {
      type: 'send_text',
      action: {
        video_ids: video_ids,
        pdf_ids: pdf_ids,
        image_ids: image_ids,
        content: message
      },
      ...this.scheduleData
    };
    if (!send_data.action.video_ids) {
      delete send_data.action.video_ids;
    }
    if (!send_data.action.pdf_ids) {
      delete send_data.pdf_ids;
    }
    if (!send_data.action.image_ids) {
      delete send_data.action.image_ids;
    }
    if (this.scheduleCheck) {
      this.sendSchedule(send_data, contacts);
      return;
    }
    this.materialService
      .sendMessage({ ...data, content: message, contacts })
      .subscribe((status) => {
        this.sending = false;
        if (status) {
          // this.toast.success('Materials has been successfully sent.');
          this.dialogRef.close();
          if (!this.user.onboard.send_video) {
            this.user.onboard.send_video = true;
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

  sendEmail(newContacts: string[]): void {
    let email = this.emailContent;
    const contacts = [...newContacts];
    const video_ids = [];
    const pdf_ids = [];
    const image_ids = [];
    this.contacts.forEach((e) => {
      if (e._id && e.email) {
        contacts.push(e._id);
      }
    });
    this.videos.forEach((e) => video_ids.push(e._id));
    this.pdfs.forEach((e) => pdf_ids.push(e._id));
    this.images.forEach((e) => image_ids.push(e._id));
    email += '<br/><br/><br/>';
    this.data.material.forEach((e) => {
      const html = `<div><strong>${e.title}</strong></div><div><a href="{{${
        e._id
      }}}"><img src="${
        e.preview || e.thumbnail
      }" width="320" height="176" alt="preview image of material" /></a></div><br/>`;
      email += html;
    });
    const data = {
      contacts,
      cc: [],
      bcc: [],
      video_ids,
      pdf_ids,
      image_ids,
      subject: this.subject,
      content: email,
      attachments: this.attachments
    };
    if (!data.video_ids) {
      delete data.video_ids;
    }
    if (!data.pdf_ids) {
      delete data.pdf_ids;
    }
    if (!data.image_ids) {
      delete data.image_ids;
    }
    const send_data = {
      type: 'send_email',
      action: {
        cc: [],
        bcc: [],
        video_ids: data.video_ids,
        pdf_ids: data.pdf_ids,
        image_ids: data.image_ids,
        subject: this.subject,
        content: email,
        attachments: this.attachments
      },
      ...this.scheduleData
    };
    if (!send_data.action.video_ids) {
      delete send_data.action.video_ids;
    }
    if (!send_data.action.pdf_ids) {
      delete data.pdf_ids;
    }
    if (!send_data.action.image_ids) {
      delete send_data.action.image_ids;
    }
    if (this.sender?.email) {
      send_data['action']['sender'] = this.sender.email;
      data['sender'] = this.sender.email;
    }
    if (this.scheduleCheck) {
      this.sendSchedule(send_data, data.contacts);
      return;
    }
    this.materialService
      .sendMaterials({
        ...data
      })
      .subscribe((res) => {
        this.sending = false;
        let isRedirect = false;
        if (res['status']) {
          if (res?.data['message'] === 'queue') {
            // toastr display, call status setting update
            this.toast.info(
              'Your email requests are queued. The email queue progressing would be displayed in the header.',
              'Email Queue'
            );
          } else {
            if (res.data?.queue) {
              const queueCount = res['data']['queue'];
              const sentCount = data.contacts.length - queueCount;
              this.toast.success(
                `${sentCount} emails are sent successfully. ${queueCount} emails are queued. The email queue progressing would be displayed in the header.`,
                'Email Sent'
              );
            }
          }
          if (!this.user.onboard.send_video) {
            this.user.onboard.send_video = true;
            isRedirect = true;
            this.userService
              .updateProfile({ onboard: this.user.onboard })
              .subscribe(() => {
                this.userService.updateProfileImpl({
                  onboard: this.user.onboard
                });
              });
          } else {
            isRedirect = false;
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
        if (contacts.length > CHUNK_SIZE) {
          this.handlerService.updateQueueTasks();
        }
        if (res['status']) {
          this.dialogRef.close({ redirect: isRedirect });
        }
      });
  }
  sendSchedule(data: any, contacts: any): void {
    const send_data = { contacts: contacts, data };
    if (data.type === 'send_email') {
      const followup_data = {
        contacts,
        type: 'email',
        content: data.action.subject,
        due_date: data.due_date,
        set_recurrence: data.set_recurrence,
        recurrence_mode: data.recurrence_mode
      };
      forkJoin({
        followup: from(this.taskService.bulkCreate(followup_data)),
        task: from(this.taskService.scheduleSendCreate(send_data))
      }).subscribe({
        next: (response) => {
          this.sending = false;
          const task = response.task;
          if (response.followup && task['status']) {
            if (task['message'] === 'all_queue') {
              this.toast.info(
                'Your email requests are queued. The email queue progressing would be displayed in the header.',
                'Email Queue',
                {}
              );
              this.handlerService.runScheduleTasks();
            } else {
              this.toast.error('Schedules sending is failed.', 'Schedule Sent');
            }
            this.taskService.scheduleData.next({});
            this.handlerService.activityAdd$(contacts, 'task');
            this.handlerService.reload$('tasks');
            this.dialogRef.close();
          }
        }
      });
    } else {
      const followup_data = {
        contacts,
        type: 'text',
        content: data.action.subject,
        due_date: this.scheduleDateTime,
        set_recurrence: data.set_recurrence,
        recurrence_mode: data.recurrence_mode
      };
      forkJoin({
        followup: from(this.taskService.bulkCreate(followup_data)),
        task: from(this.taskService.scheduleSendCreate(send_data))
      }).subscribe({
        next: (response) => {
          this.sending = false;
          const task = response.task;
          if (response.followup && task['status']) {
            if (task['message'] === 'all_queue') {
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
            this.dialogRef.close({ status: true });
          }
          this.dialogRef.close({ status: true });
        }
      });
    }
  }
  closeDialog(): void {
    this.taskService.scheduleData.next({});
    this.dialogRef.close();
  }

  /**
   * init or change the sender email
   * @param $event: sender
   */
  onSelectSender($event: Alias): void {
    this.sender = $event;
  }

  onEmailSubjectTokenSelected(token: TemplateToken): void {
    setTimeout(() => {
      this.subject = this.subject.replace(`#${token.name}`, `{${token.name}}`);
    }, 50);
  }

  onTextContentTokenSelected(token: TemplateToken): void {
    setTimeout(() => {
      this.textContent = this.textContent.replace(
        `#${token.name}`,
        `{${token.name}}`
      );
    }, 50);
  }

  changeMethod(type: string): void {
    this.contacts = [];
    this.sendMode = type;
  }

  cancelSchedule(): void {
    this.strScheduleDate = '';
    this.strScheduleTime = '';
    this.scheduleCheck = false;
    this.taskService.scheduleData.next({});
  }

  messageChanged(): void {
    var tempTextContent = this.textContent;
    const mediaIds = {
      video: this.videos.map((e) => e._id),
      pdf: this.pdfs.map((e) => e._id),
      image: this.images.map((e) => e._id)
    };

    if (tempTextContent && tempTextContent.slice(-1) !== '\n') {
      tempTextContent += '\n';
    }
    const domain = environment.website;
    Object.entries(mediaIds).forEach(([type, ids]) => {
      ids.forEach((id) => {
        tempTextContent += `\n${domain}/${type}/${id}`;
      });
    });

    const segmentedMessage = new SegmentedMessage(
      tempTextContent || '',
      'auto',
      true
    );
    this.segments = segmentedMessage.segmentsCount || 0;
  }
}
