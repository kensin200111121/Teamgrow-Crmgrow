import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Draft } from '@models/draft.model';
import { Contact } from '@app/models/contact.model';
import { ErrorService } from '@services/error.service';
import { HttpService } from '@services/http.service';
import { StoreService } from '@services/store.service';
import { DialerService } from './dialer.service';
import { EmailService } from './email.service';
import { UserService } from './user.service';
import { AppointmentService } from './appointment.service';
import { ContactDetailInfoService } from './contact-detail-info.service';
import { SendEmailComponent } from '@app/components/send-email/send-email.component';
import { SendTextComponent } from '@app/components/send-text/send-text.component';
import { TaskCreateComponent } from '@app/components/task-create/task-create.component';
import { CalendarEventDialogComponent } from '@app/components/calendar-event-dialog/calendar-event-dialog.component';
import { DialogSettings } from '@constants/variable.constants';

@Injectable({
  providedIn: 'root'
})
export class ContactActionService extends HttpService {
  contactMainInfo = new Contact();
  // Variables for email & text draft
  emailDialog = null;
  textDialog = null;
  draftEmail = new Draft();
  draftText = new Draft();

  draftSubscription: Subscription;
  saveSubscription: Subscription;
  removeEmailDraftSubscription: Subscription;
  updateEmailDraftSubscription: Subscription;
  createEmailDraftSubscription: Subscription;
  removeTextDraftSubscription: Subscription;
  updateTextDraftSubscription: Subscription;
  createTextDraftSubscription: Subscription;

  constructor(
    errorService: ErrorService,
    private storeService: StoreService,
    private dialerService: DialerService,
    private emailService: EmailService,
    private dialog: MatDialog,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private toastr: ToastrService,
    private contactDetailInfoService: ContactDetailInfoService
  ) {
    super(errorService);
    this.storeService.selectedContactMainInfo$.subscribe((value) => {
      this.contactMainInfo = value;
    });
    this.appointmentService.loadCalendars(false, false);
  }

  /**
   * Open Call
   */
  openCall(): void {
    if (this.contactMainInfo._id) {
      const contacts = [
        {
          contactId: this.contactMainInfo._id,
          numbers: [this.contactMainInfo.cell_phone],
          name: this.contactMainInfo.fullName
        }
      ];
      this.dialerService.makeCalls(contacts);
    }
  }

  /**
   * Send email
   */
  openSendEmail(): void {
    if (!this.emailDialog) {
      this.draftSubscription && this.draftSubscription.unsubscribe();
      if (this.contactMainInfo._id) {
        const draftData = {
          contact: this.contactMainInfo._id,
          type: 'contact_email'
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
              width: '100vw',
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: {
                contact: this.contactMainInfo,
                type: 'contact_email',
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
              if (response && response.draft) {
                this.saveEmailDraft(response.draft);
                this.storeService.emailContactDraft.next({});
              }
              if (response && response.send) {
                this.contactDetailInfoService.callbackForAddContactAction(
                  this.contactMainInfo._id,
                  'email'
                );
                const sendEmail = response.send;
                if (sendEmail._id) {
                  this.emailService
                    .removeDraft(sendEmail._id)
                    .subscribe((result) => {
                      if (result) {
                        this.draftEmail = new Draft();
                        this.storeService.emailContactDraft.next({});
                      }
                    });
                  this.contactDetailInfoService.callbackForAddContactAction(
                    this.contactMainInfo._id,
                    'email'
                  );
                }
              }
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

  saveEmailDraft(data): void {
    if (this.draftEmail && this.draftEmail.user) {
      if (!data.content && !data.subject) {
        this.removeEmailDraftSubscription &&
          this.removeEmailDraftSubscription.unsubscribe();
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
            this.updateEmailDraftSubscription.unsubscribe();
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

  /**
   * Send Text
   */
  openSendText(): void {
    if (!this.textDialog) {
      this.draftSubscription && this.draftSubscription.unsubscribe();
      if (this.contactMainInfo._id) {
        const draftData = {
          contact: this.contactMainInfo._id,
          type: 'contact_text'
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
              panelClass: 'send-email',
              backdropClass: 'cdk-send-email',
              disableClose: false,
              data: {
                type: 'single',
                contact: this.contactMainInfo,
                draft_type: 'contact_text',
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
                this.storeService.textContactDraft.next({});
              }
              if (response && response.send) {
                this.contactDetailInfoService.callbackForAddContactAction(
                  this.contactMainInfo._id,
                  'text'
                );
                const sendText = response.send;
                if (sendText._id) {
                  this.emailService
                    .removeDraft(sendText._id)
                    .subscribe((result) => {
                      if (result) {
                        this.draftText = new Draft();
                        this.storeService.textContactDraft.next({});
                      }
                    });
                  this.contactDetailInfoService.callbackForAddContactAction(
                    this.contactMainInfo._id,
                    'text'
                  );
                }
              }
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

  saveTextDraft(data): void {
    if (this.draftText && this.draftText.user) {
      if (!data.content) {
        this.removeTextDraftSubscription &&
          this.removeTextDraftSubscription.unsubscribe();
        this.removeTextDraftSubscription = this.emailService
          .removeDraft(this.draftText._id)
          .subscribe((res) => {
            if (res) {
              this.draftText = null;
            }
          });
      } else {
        if (data.content !== this.draftText.content) {
          this.updateTextDraftSubscription &&
            this.updateTextDraftSubscription.unsubscribe();
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

  /**
   * New Task
   */
  openTaskDlg(): void {
    this.dialog
      .open(TaskCreateComponent, {
        ...DialogSettings.TASK,
        data: {
          contacts: [this.contactMainInfo]
        }
      })
      .afterClosed()
      .subscribe((event) => {
        if (event) {
          this.contactDetailInfoService.callbackForAddContactAction(
            this.contactMainInfo._id,
            'follow_up'
          );
        }
      });
  }

  /**
   * Callback for new Note
   */

  onCreateNewNote = () => {
    this.contactDetailInfoService.callbackForAddContactAction(
      this.contactMainInfo._id,
      'note'
    );
  };

  /**
   * Callback for assign automation
   */

  onAssignAutomation = () => {
    this.contactDetailInfoService.callbackForAddContactAction(
      this.contactMainInfo._id,
      'automation'
    );
  };

  /**
   * New Meeting
   */
  openAppointmentDlg(): void {
    const contact = new Contact().deserialize({
      _id: this.contactMainInfo._id,
      first_name: this.contactMainInfo.first_name,
      last_name: this.contactMainInfo.last_name,
      email: this.contactMainInfo.email,
      cell_phone: this.contactMainInfo.cell_phone
    });

    this.dialog
      .open(CalendarEventDialogComponent, {
        width: '100vw',
        maxWidth: '600px',
        data: {
          mode: 'dialog',
          contacts: [contact]
        }
      })
      .afterClosed()
      .subscribe((event) => {
        if (event) {
          this.contactDetailInfoService.callbackForAddContactAction(
            this.contactMainInfo._id,
            'appointment'
          );
        }
      });
  }

  /**
   * Callback for assign automation
   */

  callbackForLoadLastGroupedActivity = () => {
    this.contactDetailInfoService.loadLastActivities(this.contactMainInfo._id);
  };
}
