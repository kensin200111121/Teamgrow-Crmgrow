import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Contact } from '@app/models/contact.model';
import { DealsService } from '@app/services/deals.service';
import { StoreService } from '@app/services/store.service';
import { UserService } from '@app/services/user.service';
import { LabelService } from '@app/services/label.service';
import { EmailService } from '@app/services/email.service';
import { DialerService } from '@app/services/dialer.service';
import { CalendarEventDialogComponent } from '../calendar-event-dialog/calendar-event-dialog.component';
import { SendEmailComponent } from '../send-email/send-email.component';
import { SendTextComponent } from '../send-text/send-text.component';
import { TaskCreateComponent } from '../task-create/task-create.component';
import { NoteCreateComponent } from '../note-create/note-create.component';
import { ConfirmComponent } from '../confirm/confirm.component';
import { DealCreateComponent } from '../deal-create/deal-create.component';
import { Draft } from '@app/models/draft.model';
import { Deal } from '@app/models/deal.model';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { DialogSettings } from '@app/constants/variable.constants';

const DEAL_ACTION = {
  DELETE: 0,
  CHANGE_TITLE: 1,
  MOVE_DEAL: 2,
  SET_PRIMARY: 3,
  ADD_CONTACT: 4,
  REMOVE_CONTACT: 5
};
@Component({
  selector: 'app-deal-detail',
  templateUrl: './deal-detail.component.html',
  styleUrls: ['./deal-detail.component.scss']
})
export class DealDetailComponent implements OnInit {
  readonly USER_FEATURES = USER_FEATURES;
  deal: any;
  @Input() dealId = '';
  @Output() onClose = new EventEmitter<void>();
  @Output() onOpen = new EventEmitter<void>();
  @Output() onRemoveDeal = new EventEmitter<void>();
  loadSubscription: Subscription;
  pipelineSubscription: Subscription;
  stageLoadSubscription: Subscription;
  draftSubscription: Subscription;
  createEmailDraftSubscription: Subscription;
  updateEmailDraftSubscription: Subscription;
  removeEmailDraftSubscription: Subscription;
  createTextDraftSubscription: Subscription;
  updateTextDraftSubscription: Subscription;
  removeTextDraftSubscription: Subscription;
  allLabels = null;
  labelSubscription: Subscription;

  selectedStageId = '';
  stages: any[] = [];
  selectedStage;
  pipeline;
  emailDialog = null;
  textDialog = null;
  draftEmail = new Draft();
  draftText = new Draft();
  reload = false;

  constructor(
    private dealsService: DealsService,
    private emailService: EmailService,
    private dialerService: DialerService,
    private storeService: StoreService,
    public userService: UserService,
    private dialog: MatDialog,
    private toast: ToastrService,
    public labelService: LabelService
  ) {
    this.labelSubscription && this.labelSubscription.unsubscribe();
    this.labelSubscription = this.labelService.allLabels$.subscribe((res) => {
      if (res) {
        this.allLabels = res;
      }
    });
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.dealId) {
      this.getDealDetail();
    }
  }

  ngOnDestroy(): void {
    this.labelSubscription && this.labelSubscription.unsubscribe();
  }
  getDealDetail() {
    if (this.dealId) {
      this.loadSubscription && this.loadSubscription.unsubscribe();
      this.loadSubscription = this.dealsService
        .getDeal(this.dealId)
        .subscribe((res) => {
          if (res) {
            this.deal = res;
            this.deal.contacts = (res.contacts || []).map((e) =>
              new Contact().deserialize(e)
            );
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
          }
        });
    }
  }

  editDeal(event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.deal.main.contacts = this.deal.contacts;
    this.dialog
      .open(DealCreateComponent, {
        ...DialogSettings.DEAL,
        data: {
          deal: this.deal?.main,
          stage: this.deal.main?.deal_stage?._id,
          pipeline: this.deal.main?.deal_stage?.pipe_line?._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const newDeal = res;
          this.dealsService.updateDealOnStage(newDeal, this.deal.main);
          this.getDealDetail();
        }
      });
  }

  closeDrawer(): void {
    this.onClose.emit();
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
            dealStage.price -= Number(this.deal.main.price);
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
          this.reload = true;
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
                right: '600px'
              },
              panelClass: ['send-email', 'alert-panel'],
              disableClose: true,
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
              // if (response && response.status) this.loadTasks();
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
              this.reload = true;
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
                right: '600px'
              },
              panelClass: ['send-email', 'alert-panel'],
              disableClose: true,
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
              this.reload = true;
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
          this.reload = true;
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
          this.reload = true;
        }
      });
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
                      this.onClose.emit();
                    }
                  });
              }
              if (confirm === false) {
                this.dealsService
                  .deleteOnlyDeal(this.dealId)
                  .subscribe((status) => {
                    if (status) {
                      this.pageStateRearrange(DEAL_ACTION.DELETE, '');
                      this.onClose.emit();
                    }
                  });
              }
            });
        }
      });
  }

  setReload(val): void {
    this.reload = val || false;
  }
}
