import { SspaService } from '../../services/sspa.service';
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  TemplateRef
} from '@angular/core';
import { forkJoin, from, interval } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@services/user.service';
import { SmsService } from '@services/sms.service';
import { MaterialService } from '@services/material.service';
import { Template } from '@models/template.model';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { Contact } from '@models/contact.model';
import { environment } from '@environments/environment';
import { Subscription } from 'rxjs';
import {
  DEFAULT_TEMPLATE_TOKENS,
  DEFAULT_TIME_ZONE,
  RECORDING_POPUP,
  MESSAGE_SORT_TYPES,
  STATUS
} from '@constants/variable.constants';
import { ScheduleSendComponent } from '@components/schedule-send/schedule-send.component';
import { ContactService } from '@services/contact.service';
import { HandlerService } from '@services/handler.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ConnectService } from '@services/connect.service';
import { TaskService } from '@services/task.service';
import { Garbage } from '@models/garbage.model';
import { SocketService } from '@services/socket.service';
import { Conversation } from '@app/models/conversation.model';
import { ScheduleService } from '@services/schedule.service';
import { HelperService } from '@services/helper.service';
import { TemplateToken } from '@utils/data.types';
import { getUserTimezone, replaceToken } from '@app/helper';
import { LabelService } from '@services/label.service';
import { ConfirmBusinessComponent } from '@components/confirm-business-hour/confirm-business-hour.component';
import moment from 'moment-timezone';
import { MaterialBrowserV2Component } from '@app/components/material-browser-v2/material-browser-v2.component';
import {
  convertIdToUrlOnSMS,
  parseURLToIdsAndPairedUrl
} from '@app/utils/functions';
import { SegmentedMessage } from 'sms-segments-calculator';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit, OnDestroy {
  inited = false;
  garbage: Garbage = new Garbage();
  isCalendly = false;
  isScheduler = false;
  STATUS = STATUS;
  PanelView = {
    Contacts: 'contacts',
    Messages: 'messages',
    Files: 'files'
  };
  popup;
  recordUrl = RECORDING_POPUP;
  panel = this.PanelView.Contacts; // Panel View for Mobile
  message = ''; // Message
  tempMessage = '';
  segments = 0;
  // Loading Contacts
  contacts = [];
  selectedContact: Conversation = new Conversation();
  defaultContactId = '';
  loading = false;
  loadingMore = false;
  refreshing = false;

  // Loading Individual Contact messages
  loadingMessage = false;
  messages = [];
  conversationDetails = {};
  loadingFiles = false;
  fileDetails = {};
  // contacts and sending status
  isNew = false;
  isSend = false;
  newContacts = [];
  //schedule time
  scheduleData: any;
  scheduleDateTime: any;
  scheduleCheck = false;
  spaceReg = /(\r\n|\n|\r|\s)/g; // Space Reg (If message contains the tab or space only, it will disabled)
  set = 'twitter'; // Emoji type
  searchStr = ''; // contact search keyword
  skipNum = 0;
  count = 50;
  hasMore = true;
  templateTokens: TemplateToken[] = [];
  allTemplateTokens: TemplateToken[] = DEFAULT_TEMPLATE_TOKENS;
  tokens: string[] = [];

  mentionConfig = {
    triggerChar: '#',
    labelKey: 'name',
    dropUp: true
  };

  messageLoadSubscription: Subscription;
  garbageSubscription: Subscription;
  notificationCommandSubscription: Subscription;
  messageStatusSubscription: Subscription;
  labelSubscription: Subscription;
  message_sort_type = MESSAGE_SORT_TYPES;
  sort_type = null;
  emitTokenData = { value: 'test', token: false };
  // UI Elements
  allLabels = null;
  firstName = '';
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  @ViewChild('messageText') messageText: ElementRef;
  @ViewChild('createNewContent') createNewContent: TemplateRef<unknown>;

  additional_fields;
  timezone_info;

  startTime = '0'; //WORK_TIMES[0].id;
  endTime = '0'; //WORK_TIMES[WORK_TIMES.length - 1].id;

  redirectArticleURL =
    'https://kb1.crmgrow.com/kb/guide/en/sms-texting-character-limits-8DWOLjE5ZS/Steps/4023017';

  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    private materialService: MaterialService,
    private helperService: HelperService,
    public smsService: SmsService,
    public userService: UserService,
    private toast: ToastrService,
    private contactService: ContactService,
    private handlerService: HandlerService,
    public connectService: ConnectService,
    private route: ActivatedRoute,
    private location: Location,
    private socketService: SocketService,
    public scheduleService: ScheduleService,
    public labelService: LabelService,
    public sspaService: SspaService
  ) {
    let user;
    this.userService.profile$.subscribe((res) => {
      if (res) {
        user = res;
        if (!user?.assignee_info?.is_enabled) {
          this.allTemplateTokens = this.allTemplateTokens.filter((token) => {
            return token.id < 10; // subtract assignee tokens
          });
        }
        this.timezone_info = getUserTimezone(user);
        this.firstName = this.getFirstName(user);
      }
    });

    this.sort_type = this.smsService.sort.getValue() || MESSAGE_SORT_TYPES[0];
    this.tokens = this.allTemplateTokens.map((e) => e.name);
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
      if (this.garbage.template_tokens && this.garbage.template_tokens.length) {
        this.templateTokens = [...this.garbage.template_tokens];
        this.allTemplateTokens = [
          ...this.allTemplateTokens,
          ...this.garbage.template_tokens
        ];
        this.templateTokens.forEach((e) => {
          this.tokens.push(e.name);
        });
      }
      if (this.garbage.business_time) {
        this.startTime = this.garbage.business_time.start_time;
        this.endTime = this.garbage.business_time.end_time;
      }
      this.additional_fields = this.garbage.additional_fields || [];
    });

    this.notificationCommandSubscription &&
      this.notificationCommandSubscription.unsubscribe();
    this.notificationCommandSubscription =
      this.socketService.command$.subscribe((res) => {
        if (res) {
          this.executeRealtimeCommand(res);
        }
      });
    this.scheduleService.getEventTypes(false);
    this.labelSubscription && this.labelSubscription.unsubscribe();
    this.labelSubscription = this.labelService.allLabels$.subscribe((res) => {
      if (res) {
        this.allLabels = res;
      }
    });

    this.messageStatusSubscription?.unsubscribe();
    this.messageStatusSubscription =
      this.socketService.messageStatus$.subscribe((data) => {
        if (data) {
          // need to update the conversation list and messages list
          this.updateMessageStatus(data);
        }
      });
  }

  ngOnInit(): void {
    // this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.preload();
    this.load();

    this.route.params.subscribe((params) => {
      if (params && params.contact) {
        const contactDoc = this.contacts.find((e) => e._id === params.contact);
        if (contactDoc) {
          this.selectContact(contactDoc);
        } else {
          //  Load Contact detail data
          this.contactService.readImpl(params.contact).subscribe((_contact) => {
            this.selectContact(_contact);
          });
        }
        this.location.replaceState('/messages');
      }
    });
    this.taskService.scheduleData$.subscribe((data) => {
      if (data.due_date) {
        this.scheduleData = data;
        this.scheduleDateTime = data.due_date;
        this.scheduleCheck = true;
      } else {
        this.scheduleData = null;
        this.scheduleDateTime = null;
        this.scheduleCheck = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.messageLoadSubscription && this.messageLoadSubscription.unsubscribe();
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.notificationCommandSubscription &&
      this.notificationCommandSubscription.unsubscribe();
    this.messageStatusSubscription?.unsubscribe();
    this.smsService.conversations.next(this.contacts.slice(0, this.count));
    this.labelSubscription && this.labelSubscription.unsubscribe();
    this.taskService.scheduleData.next({});
  }

  /**
   * Update the conversation list and messages list with new status
   * @param data: { contact: object, textId, status }
   * @returns
   */
  private updateMessageStatus(data: any): void {
    const { contact, textId, status } = data;
    if (!contact._id) {
      return;
    }
    const newStatus = status === 'delivered' ? 'completed' : status;
    this.contacts.some((e) => {
      if (e._id === contact._id && e.last_text?._id === textId) {
        e.activity = { status: newStatus };
        return true;
      }
    });

    (this.conversationDetails[contact._id]?.messages || []).some((e) => {
      if (e._id === textId) {
        e.activity = { status: newStatus };
        return true;
      }
    });
  }

  executeRealtimeCommand(_c): void {
    if (_c.command === 'receive_text') {
      this.loadLatest(5, false, true);
    }
  }

  preload(): void {
    const conversations = this.smsService.conversations.getValue();
    this.contacts = [...conversations];
  }

  load(): void {
    const payload = {
      count: this.count,
      skip: 0,
      searchStr: this.searchStr,
      sort_type: this.sort_type.id
    };
    this.hasMore = true;
    this.loading = true;
    this.messageLoadSubscription && this.messageLoadSubscription.unsubscribe();
    this.messageLoadSubscription = this.smsService
      .loadImplCount(payload)
      .subscribe((contacts) => {
        this.loading = false;
        if (contacts.length < this.count) {
          this.hasMore = false;
        }
        this.initConversations(contacts); // init loaded contacts
      });
  }

  loadMore(): void {
    const payload = {
      count: this.count,
      skip: this.contacts.length,
      searchStr: this.searchStr,
      sort_type: this.sort_type.id
    };
    this.loadingMore = true;
    this.smsService.loadImplCount(payload).subscribe((messages) => {
      this.loadingMore = false;
      if (!messages.length) {
        this.hasMore = false;
      } else {
        this.hasMore = true;
      }
      this.mergeConversations(messages); // merge loaded messages
    });
  }

  loadLatest(count = 5, selectLatest = false, selectFirst = false): void {
    const payload = {
      count: count,
      skip: 0,
      searchStr: this.searchStr
    };
    this.smsService.loadImplCount(payload).subscribe((messages) => {
      this.mergeConversations(messages, selectLatest, selectFirst); // Merge loaded messages
    });
  }
  changeSortType(value: any): void {
    this.sort_type = value;
    this.smsService.sort.next(value);
    this.load();
  }
  changeSearchStr(): void {
    this.load();
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.load();
  }

  onSubjectTokenSelected(token): void {
    setTimeout(() => {
      this.message = this.message.replace(`#${token.name}`, `{${token.name}}`);
    }, 50);
  }

  private initConversations(contacts: Conversation[]): void {
    this.contacts = contacts;
  }

  private reArrangeContacts(): void {
    if (this.sort_type.id === 'latest') {
      this.contacts = this.contacts.sort(
        (a, b) =>
          (new Date(a.last_text?.created_at + '').getTime() -
            new Date(b.last_text?.created_at + '').getTime()) *
          -1
      );
    }
    if (this.sort_type.id === 'unread') {
      this.contacts = this.contacts.sort(
        (a, b) =>
          b.last_received_text?.type - a.last_received_text?.type ||
          a.last_received_text?.status - b.last_received_text?.status ||
          new Date(b.last_received_text?.created_at + '').getTime() -
            new Date(a.last_received_text?.created_at + '').getTime() ||
          new Date(b.last_text?.created_at + '').getTime() -
            new Date(a.last_text?.created_at + '').getTime()
      );
    }
    if (this.sort_type.id === 'received') {
      this.contacts = this.contacts.sort(
        (a, b) =>
          new Date(b.last_received_text?.created_at + '').getTime() -
            new Date(a.last_received_text?.created_at + '').getTime() ||
          new Date(b.last_text?.created_at + '').getTime() -
            new Date(a.last_text?.created_at + '').getTime()
      );
    }
  }
  private async mergeConversations(
    contacts: Conversation[],
    selectLatest = false,
    selectFirst = false
  ): Promise<void> {
    const _contacts = [...contacts, ...this.contacts];
    const temp_contacts = _.uniqBy(_contacts, (e) => e._id);
    this.contacts = temp_contacts;

    this.reArrangeContacts();
    if (selectLatest) {
      const latestContact = this.contacts[this.contacts.length - 1];
      if (latestContact?._id !== this.selectedContact?._id) {
        this.selectContact(latestContact);
      }
    }
    if (selectFirst) {
      const firstContact = this.contacts[0];
      if (firstContact?._id === this.selectedContact?._id) {
        this.selectContact(firstContact);
      }
    }
  }

  /**
   * When select the contact in the left sidebar,
   * the conversation detail panel update.
   * @param contact : Contact Data
   */
  selectContact(contact: any): void {
    this.selectedContact = contact;
    this.taskService.scheduleData.next({});
    this.isNew = false;
    this.newContacts = [];
    this.panel = this.PanelView.Messages;
    this.loadingMessage = true;
    this.smsService.getMessage(this.selectedContact).subscribe((res) => {
      if (res) {
        const contactId = this.selectedContact._id;
        res.forEach((e) => {
          if (e.send_status && e.send_status[contactId]?.status) {
            e.status = e.send_status[contactId]?.status;
            delete e.send_status;
          }
        });
        this.markAsRead(res);
        this.loadingMessage = false;
        const message = {
          id: contact._id,
          messages: res
        };
        this.conversationDetails[contact._id] = message;
      }
    });
  }

  /**
   * When choose the contacts in the conversation contact list header,
   * the conversation panel would be reset
   * If the selected contacts count is more than 2, would not run this.
   * @param event
   */
  selectNewContacts(): void {
    if (this.newContacts.length === 1) {
      const firstNewContact = this.newContacts[0];
      const conversationIndex = _.findIndex(
        this.contacts,
        (e) => e._id === firstNewContact._id
      );
      // Conversation Detail Panel loading with selected contact
      if (conversationIndex !== -1) {
        this.smsService.getMessage(firstNewContact).subscribe((res) => {
          if (res) {
            const contactId = firstNewContact._id;
            res.forEach((e) => {
              if (e.send_status && e.send_status[contactId]?.status) {
                e.status = e.send_status[contactId]?.status;
                delete e.send_status;
              }
            });
            if (
              res[res.length - 1].type == 1 &&
              res[res.length - 1].status == 0
            ) {
              this.smsService
                .markRead(res[res.length - 1]._id, this.selectedContact._id)
                .subscribe((res) => {
                  if (res && res['status']) {
                    this.selectedContact.unread = false;
                  }
                });
            }
            this.loadingMessage = false;
            const message = {
              id: firstNewContact._id,
              messages: res
            };
            this.conversationDetails[firstNewContact._id] = message;
          }
        });
      }
    }
  }

  /**
   * Go back in the mobile
   */
  goToBack(): void {
    this.isNew = false;
    this.newContacts = [];
    this.panel = this.PanelView.Contacts;
  }

  /**
   * File List Open (mobile view flag setting & load files)
   */
  toggleFileList(): void {
    if (this.panel != this.PanelView.Files) {
      this.panel = this.PanelView.Files;
      // Load Files
      this.loadFiles();
    } else {
      this.panel = this.PanelView.Contacts;
    }
  }

  /**
   * Load the sent materials activity load and trackers
   */
  loadFiles(): void {
    this.loadingFiles = true;
    const sentActivities = this.getActivities() || [];
    this.smsService
      .loadFiles(this.selectedContact._id, sentActivities)
      .subscribe((res) => {
        this.loadingFiles = false;
        let materials = [];
        const trackers = {};
        const sendAtIndex = res['sendAtIndex'];
        const latestSentAt = {};
        const firstSentAt = {};
        const sentTimes = {};
        for (const materialId in sendAtIndex) {
          const latest = _.max(sendAtIndex[materialId], (e) =>
            new Date(e).getTime()
          );
          const first = _.min(sendAtIndex[materialId], (e) =>
            new Date(e).getTime()
          );
          latestSentAt[materialId] = latest;
          firstSentAt[materialId] = first;
          sentTimes[materialId] = sendAtIndex[materialId].length;
        }
        if (res.videos && res.videos.length) {
          materials = [...materials, ...res.videos];
        }
        if (res.pdfs && res.pdfs.length) {
          materials = [...materials, ...res.pdfs];
        }
        if (res.images && res.images.length) {
          materials = [...materials, ...res.images];
        }
        if (res.videoTrackers && res.videoTrackers.length) {
          res.videoTrackers.forEach((e) => {
            let materialId = '';
            if (e.video instanceof Array) {
              materialId = e.video[0];
            } else {
              materialId = e.video;
            }
            if (trackers[materialId]) {
              trackers[materialId].push(e);
            } else {
              trackers[materialId] = [e];
            }
            sendAtIndex[materialId] &&
              sendAtIndex[materialId].push(e.updated_at);
          });
        }
        if (res.pdfTrackers && res.pdfTrackers.length) {
          res.pdfTrackers.forEach((e) => {
            let materialId = '';
            if (e.pdf instanceof Array) {
              materialId = e.pdf[0];
            } else {
              materialId = e.pdf;
            }
            if (trackers[materialId]) {
              trackers[materialId].push(e);
            } else {
              trackers[materialId] = [e];
            }
            sendAtIndex[materialId].push(e.updated_at);
            sendAtIndex[materialId] &&
              sendAtIndex[materialId].push(e.updated_at);
          });
        }
        if (res.imageTrackers && res.imageTrackers.length) {
          res.imageTrackers.forEach((e) => {
            let materialId = '';
            if (e.image instanceof Array) {
              materialId = e.image[0];
            } else {
              materialId = e.image;
            }
            if (trackers[materialId]) {
              trackers[materialId].push(e);
            } else {
              trackers[materialId] = [e];
            }
            sendAtIndex[materialId].push(e.updated_at);
            sendAtIndex[materialId] &&
              sendAtIndex[materialId].push(e.updated_at);
          });
        }
        const sentIndex = [];
        for (const materialId in sendAtIndex) {
          const latest = _.max(sendAtIndex[materialId], (e) =>
            new Date(e).getTime()
          );
          sentIndex.push({
            material: materialId,
            sent_at: sendAtIndex[materialId],
            last_sent: latestSentAt[materialId],
            first_sent: firstSentAt[materialId],
            sent_times: sentTimes[materialId],
            latest
          });
        }
        sentIndex.sort((a, b) =>
          new Date(a.latest) < new Date(b.latest) ? 1 : -1
        );
        this.fileDetails[this.selectedContact._id] = {
          timeInfo: sentIndex,
          materials,
          trackers
        };
      });
  }
  getActivities(): any {
    const videoActivities = [];
    const pdfActivities = [];
    const imageActivities = [];

    const videoReg = new RegExp(environment.website + '/video1/\\w+', 'g');
    const pdfReg = new RegExp(environment.website + '/pdf1/\\w+', 'g');
    const imageReg = new RegExp(environment.website + '/image/\\w+', 'g');

    let allMessage = '';
    this.conversationDetails[this.selectedContact._id].messages.forEach((e) => {
      allMessage += e.content + '\n';
    });

    let matches = allMessage.match(videoReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/video1/', '');
        videoActivities.push(videoId);
      });
    }
    matches = allMessage.match(pdfReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/pdf1/', '');
        pdfActivities.push(videoId);
      });
    }
    matches = allMessage.match(imageReg);
    if (matches && matches.length) {
      matches.forEach((e) => {
        const videoId = e.replace(environment.website + '/image/', '');
        imageActivities.push(videoId);
      });
    }

    return [...videoActivities, ...pdfActivities, ...imageActivities];
  }

  markAsRead(messages): void {
    if (
      messages[messages.length - 1].type == 1 &&
      messages[messages.length - 1].status == 0
    ) {
      this.smsService
        .markRead(messages[messages.length - 1]._id, this.selectedContact._id)
        .subscribe((res) => {
          if (res && res['status']) {
            this.selectedContact.unread = false;
            this.handlerService.readMessageContact.next([
              this.selectedContact._id
            ]);
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
          .markRead(unreadMessageId, this.selectedContact._id)
          .subscribe((res) => {
            if (res && res['status']) {
              this.selectedContact.unread = false;
              this.handlerService.readMessageContact.next([
                this.selectedContact._id
              ]);
            }
          });
      }
    }
  }

  newMessage(): void {
    this.isNew = true;
    this.newContacts = [];
    this.panel = this.PanelView.Messages;
    this.scheduleCheck = false;
  }

  /**
   * Schedule Send Dialog Open
   */
  showSchedule(): void {
    const messageDialog = this.dialog.open(ScheduleSendComponent, {
      width: '100vw',
      maxWidth: '350px',
      data: {
        type: 'text'
      }
    });
    messageDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    messageDialog.afterClosed().subscribe((res) => {
      if (res) {
      }
    });
  }
  checkBusinessHourandSendMessage(): void {
    const currentTime = moment()
      .tz(this.timezone_info)
      .format('HH:mm:[00.000]');
    if (currentTime >= this.startTime && currentTime <= this.endTime) {
      this.sendMessage();
    } else {
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
      confirmDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
      confirmDialog.afterClosed().subscribe((res) => {
        if (res) {
          if (res.notShow) {
            this.updateConfirmMessage({
              text_out_of_business_hour: true
            });
          }
          this.sendMessage();
        }
      });
    }
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

  sendMessage(): void {
    if (this.isSend) {
      return;
    }
    if (
      this.message == '' ||
      this.message.replace(/(\r\n|\n|\r|\s)/gm, '').length == 0
    ) {
      return;
    }
    if (
      (!this.isNew && !this.selectedContact._id) ||
      (this.isNew && !this.newContacts.length)
    ) {
      return;
    }

    this.tempMessage = this.message;
    const {
      videoIds,
      imageIds,
      pdfIds,
      content: contentToSend
    } = parseURLToIdsAndPairedUrl(this.message);
    const data = {
      video_ids: videoIds,
      pdf_ids: pdfIds,
      image_ids: imageIds,
      content: contentToSend
    };
    const send_data = {
      type: 'send_text',
      action: {
        video_ids: videoIds,
        pdf_ids: pdfIds,
        image_ids: imageIds,
        content: contentToSend
      },
      ...this.scheduleData,
      due_date: this.scheduleDateTime
    };
    this.isSend = true;
    if (this.isNew) {
      const contactsToRegister = [];
      const existContacts = [];
      const contactIds = [];
      this.newContacts.forEach((contact) => {
        if (!contact._id) {
          contactsToRegister.push(contact);
        } else {
          existContacts.push(contact);
          contactIds.push(contact._id);
        }
      });

      if (!contactsToRegister.length) {
        data['contacts'] = contactIds;
        if (this.scheduleCheck) {
          this.sendSchedule(send_data, data['contacts']);
          return;
        }
        this.sendMessageImpl(data);
      } else {
        this.contactService.bulkCreate(contactsToRegister).subscribe((res) => {
          const newContactIds = [];
          if (res) {
            const addedContacts = res['succeed'];
            addedContacts.forEach((e) => contactIds.push(e._id));
            data['contacts'] = contactIds;
            if (this.scheduleCheck) {
              this.sendSchedule(send_data, data['contacts']);
              return;
            }
            this.sendMessageImpl(data, addedContacts);
          }
        });
      }
    } else {
      data['contacts'] = [this.selectedContact._id];
      if (this.scheduleCheck) {
        this.sendSchedule(send_data, data['contacts']);
        return;
      }
      this.sendMessageImpl(data);
    }
  }

  sendMessageImpl(data, newContacts = []): void {
    this.materialService.sendMessage(data, true).subscribe((res) => {
      this.isSend = false;
      if (res) {
        const message = {
          type: 0,
          content: this.tempMessage,
          updated_at: new Date(),
          created_at: new Date(),
          _id: res
        };
        if (data?.contacts?.length > 1) {
          this.loadLatest(data.contacts.length, true);
        } else {
          const contactId = data['contacts'][0];
          let existingContact = null;
          this.contacts.some((e) => {
            if (contactId === e._id) {
              e.last_text = message;
              e.activity = { status: 'pending' };
              existingContact = e;
              return true;
            }
          });
          if (!existingContact) {
            this.loadLatest(data.contacts.length, true);
          } else {
            this.reArrangeContacts();
            if (this.selectedContact?._id === contactId) {
              // conversation details object would be updated later.
            } else {
              // select contact: this case wouldn't exist.
              this.selectContact(existingContact);
            }
          }
        }

        data.contacts.forEach((contact) => {
          if (this.conversationDetails[contact]) {
            this.conversationDetails[contact].messages.push({
              ...message,
              activity: { status: 'pending' }
            });
          }
        });
        if (this.panel === this.PanelView.Files) {
          this.loadFiles();
        }
        this.message = '';
      }
    });
  }

  sendSchedule(data: any, contacts: any): void {
    const send_data = { contacts: contacts, data };
    forkJoin({
      task: from(this.taskService.scheduleSendCreate(send_data))
    }).subscribe({
      next: (response) => {
        this.isSend = false;
        const task = response.task;
        if (task['status']) {
          if (task['message'] === 'all_queue') {
            this.toast.info(
              'Your message requests are queued. The messaage queue progressing would be displayed in the header.',
              'Message Queue',
              {}
            );
            this.handlerService.runScheduleTasks();
          } else {
            this.toast.error('Schedules sending is failed.', 'Schedule Sent');
          }
          this.taskService.scheduleData.next({});
          this.handlerService.activityAdd$(contacts, 'task');
          this.handlerService.reload$('tasks');
          this.scheduleCheck = false;
          this.message = '';
        }
      }
    });
  }

  /**
   * Open Material dialog
   */
  openMaterialsDlg(): void {
    const { videoIds, imageIds, pdfIds } = this.helperService.getSMSMaterials(
      this.message
    );
    const selectedMaterials = [...videoIds, ...imageIds, ...pdfIds].map((e) => {
      return { _id: e };
    });
    this.dialog
      .open(MaterialBrowserV2Component, {
        width: '98vw',
        maxWidth: '940px',
        data: {
          multiple: true,
          hideMaterials: selectedMaterials
        }
      })
      .afterClosed()
      .subscribe((res) => {
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
              (!this.message ||
                this.message.replace(/(\r\n|\n|\r|\s)/gm, '').length == 0)
            ) {
              this.message = this.message + url;
              return;
            }
            if (index === 0 && this.message.slice(-1) === '\n') {
              this.message = this.message + '\n' + url;
              return;
            }
            if (index === 0) {
              this.message = this.message + '\n\n' + url;
              return;
            }
            // middle element insert
            this.message = this.message + '\n' + url;

            if (index === res.materials.length - 1) {
              this.message += '\n';
            }
          });
          this.messageText.nativeElement.focus();
          this.messageChanged();
        }
      });
  }

  /**
   * Select the template and prefill the textarea
   * @param template : template
   * @returns
   */
  selectTemplate(template: Template): void {
    this.messageText.nativeElement.focus();
    const field = this.messageText.nativeElement;
    template.content = convertIdToUrlOnSMS(template.content);

    if (!this.message.replace(/(\r\n|\n|\r|\s)/g, '').length) {
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

  /**
   * Insert the token
   * @param value : token value
   */

  insertValue(data): void {
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
    cursorStart += iValue?.length;
    cursorEnd = cursorStart;
    field.setSelectionRange(cursorStart, cursorEnd);
  }

  onTokenSelected(token: TemplateToken): void {
    setTimeout(() => {
      this.message = this.message.replace(`#${token.name}`, `{${token.name}}`);
    }, 50);
  }

  keyTrigger(evt: any): void {
    if (evt.key === 'Enter') {
      if (evt.ctrlKey || evt.altKey) {
        return;
      }
      if (!evt.shiftKey) {
        evt.preventDefault();
        this.sendMessage();
      }
    }
  }
  resendMessage(message: string): void {}
  deleteMessage(message: string): void {}

  /**
   * Parse the content (convert the text content to the html content for the links.)
   * @param content: Increase the content
   * @returns
   */
  parseContent(content = ''): string {
    const user = this.userService.profile.getValue();
    let labelName = '';
    if (content.match(/{label}/gi)) {
      labelName = this.getLabelName(this.selectedContact);
    }
    const message = replaceToken(
      user,
      this.selectedContact,
      this.templateTokens,
      content,
      labelName,
      this.additional_fields,
      this.timezone_info
    );

    return convertIdToUrlOnSMS(message.replace(/\n/g, '<br>'));
  }

  /**
   * Calculate the different days between now and sent time
   * @param date : date
   * @returns : day count
   */
  calcDate(date: any): number {
    const currentDate = new Date();
    const dateSent = new Date(date);
    return Math.floor(
      (Date.UTC(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate()
      ) -
        Date.UTC(
          dateSent.getFullYear(),
          dateSent.getMonth(),
          dateSent.getDate()
        )) /
        (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Check if the new time is new date time.
   * @param prev : prev time
   * @param next : next time
   * @returns
   */
  isNewDate(prev, next): boolean {
    if (!prev || !next) {
      return false;
    }
    const prevDate = new Date(prev.created_at + '');
    const nextDate = new Date(next.created_at + '');
    if (
      prevDate.getDate() !== nextDate.getDate() ||
      prevDate.getMonth() !== nextDate.getMonth() ||
      prevDate.getFullYear() !== nextDate.getFullYear()
    ) {
      return true;
    }
    return false;
  }

  selectCalendly(url: string): void {
    this.messageText.nativeElement.focus();
    const fullUrl = this.getRealEventTypeLink(url);
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

  private getLabelName(contact: Conversation | Contact): string {
    let _labelName = '';
    if (this.allLabels?.length > 0) {
      this.allLabels.forEach((e) => {
        if (e._id == contact?.label) _labelName = e.name;
      });
    }
    return _labelName;
  }

  replaceLastMessageToken(contact: Contact, message: string): string {
    const user = this.userService.profile.getValue();
    let labelName = '';
    if (message.match(/{label}/gi)) {
      labelName = this.getLabelName(contact);
    }
    return replaceToken(user, contact, this.templateTokens, message, labelName);
  }

  writeGptResponseContent(data): void {
    if (data.gptMode === 'insertMode') {
      this.insertValue(data.content);
    } else {
      this.message = data.content;
    }
  }
  private getFirstName(user): any {
    if (user.user_name) {
      const names = user.user_name.split(' ');
      return names[0];
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

    const authToken = this.userService.getToken();
    const userId = this.userService.profile.getValue()._id;
    if (!this.popup || this.popup.closed) {
      this.popup = window.open(
        this.recordUrl +
          '/index.html?token=' +
          authToken +
          '&method=website&userId=' +
          userId +
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

  cancelSchedule(): void {
    this.scheduleDateTime = '';
    this.scheduleCheck = false;
    this.taskService.scheduleData.next({});
  }

  getRealEventTypeLink(url: string): string {
    const prefix = environment.isSspa
      ? environment.Vortex_Scheduler
      : environment.domain.scheduler;
    return url.includes('https://') ? url : `https://${prefix + url}`;
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
