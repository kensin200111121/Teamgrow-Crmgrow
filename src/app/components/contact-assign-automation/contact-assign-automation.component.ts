import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { AutomationService } from '@services/automation.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HandlerService } from '@services/handler.service';
import { ConfirmBusinessComponent } from '@components/confirm-business-hour/confirm-business-hour.component';
import { UserService } from '@services/user.service';
import { ConfirmBulkAutomationComponent } from '@components/confirm-bulk-automation/confirm-bulk-automation.component';
import { DialogSettings } from '@constants/variable.constants';
import { Automation } from '@models/automation.model';

@Component({
  selector: 'app-contact-assign-automation',
  templateUrl: './contact-assign-automation.component.html',
  styleUrls: ['./contact-assign-automation.component.scss']
})
export class ContactAssignAutomationComponent implements OnInit {
  automationLoading = false;
  automationSubscription: Subscription;
  addSubscription: Subscription;
  contacts = [];
  runningAutomations = [];
  submitted = false;
  selectedAutomation: string;
  adding = false;
  garbageSubscription: Subscription;
  isBusinessTime = true;

  constructor(
    private dialogRef: MatDialogRef<ContactAssignAutomationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private automationService: AutomationService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private userService: UserService,
    private handlerService: HandlerService
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.contacts && this.data.contacts.length) {
      this.contacts = this.data.contacts;
      this.getContactsAutomation();
    }
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        if (garbage && garbage._id) {
          // this.isBusinessTime = garbage.business_time.is_enabled;
        }
      }
    );
  }

  getContactsAutomation(): void {
    const contactIds = this.contacts.map((item) => item._id);
    this.automationLoading = true;
    this.automationSubscription && this.automationSubscription.unsubscribe();
    this.automationSubscription = this.automationService
      .getContactsAutomation({ contacts: contactIds })
      .subscribe((res) => {
        if (res) {
          this.automationLoading = false;
          this.runningAutomations = res.sort(
            (a, b) => Number(b?.updated_at) - Number(a?.updated_at)
          );
        }
      });
  }

  getAutomation(contact): any {
    const index = this.runningAutomations.findIndex(
      (item) => item.contact === contact._id
    );
    if (index >= 0) {
      return this.runningAutomations[index].title || '';
    }
    return '';
  }

  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt._id;
  }

  addAutomation(): void {
    this.submitted = true;
    if (!this.selectedAutomation || !this.contacts.length) {
      return;
    }
    const automation = this.selectedAutomation;
    const runningAutomations = this.runningAutomations.filter(
      (item) => item.title
    );

    if (runningAutomations.length > 0) {
      const assignedContacts = [];
      const unassignedContacts = [];
      for (const contact of this.contacts) {
        if (this.getAutomation(contact)) {
          assignedContacts.push(contact);
        } else {
          unassignedContacts.push(contact);
        }
      }
      this.dialog
        .open(ConfirmBulkAutomationComponent, {
          ...DialogSettings.AUTOMATION,
          data: {
            contacts: assignedContacts,
            automations: this.runningAutomations
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res.contacts) {
            let contacts = [...res.contacts, ...unassignedContacts];
            contacts = contacts.map((item) => item._id);
            if (contacts.length > 0) {
              const flag = this.getConfirmedAutomationBusinessHour();
              if (!flag && this.isBusinessTime) {
                this.dialog
                  .open(ConfirmBusinessComponent, {
                    maxWidth: '500px',
                    width: '96vw',
                    data: {
                      title: 'Confirm',
                      message:
                        'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
                      cancelLabel: 'Cancel',
                      confirmLabel: 'Ok'
                    }
                  })
                  .afterClosed()
                  .subscribe((response) => {
                    if (response) {
                      if (response.notShow) {
                        this.updateConfirmAutomationBusinessHour();
                      }
                      this._assignAutomation(automation, contacts);
                    }
                  });
              } else {
                this._assignAutomation(automation, contacts);
              }
            }
          }
        });
    } else {
      const contacts = [];
      this.contacts.forEach((e) => {
        contacts.push(e._id);
      });
      const flag = this.getConfirmedAutomationBusinessHour();

      if (!flag && this.isBusinessTime) {
        this.dialog
          .open(ConfirmBusinessComponent, {
            maxWidth: '500px',
            width: '96vw',
            data: {
              title: 'Confirm',
              message:
                'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
              cancelLabel: 'Cancel',
              confirmLabel: 'Ok'
            }
          })
          .afterClosed()
          .subscribe((response) => {
            if (response) {
              if (response.notshow) {
                this.updateConfirmAutomationBusinessHour();
              }
              this._assignAutomation(automation, contacts);
            }
          });
      } else {
        this._assignAutomation(automation, contacts);
      }
    }
  }

  _assignAutomation(automation, contacts): void {
    this.adding = true;
    this.addSubscription && this.addSubscription.unsubscribe();
    this.automationService
      .bulkAssign(automation, contacts, null)
      .subscribe((res) => {
        this.adding = false;
        if (res && res['status']) {
          this.dialogRef.close({ status: true });
          this.toastr.success(
            `Automation applied to ${contacts.length} contact${
              contacts.length === 1 ? '' : 's'
            }.`
          );
          this.handlerService.updateQueueTasks();
        } else {
          this.dialogRef.close({ status: false });
        }
      });
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

  getConfirmedAutomationBusinessHour(): boolean {
    const garbage = this.userService.garbage.getValue();
    if (garbage.confirm_message) {
      return garbage.confirm_message.automation_business_hour;
    }
    return false;
  }

  updateConfirmAutomationBusinessHour(): void {
    const garbage = this.userService.garbage.getValue();
    const data = {
      ...garbage.confirm_message,
      automation_business_hour: true
    };
    this.userService.updateGarbage({ confirm_message: data }).subscribe(() => {
      this.userService.updateGarbageImpl({
        confirm_message: data
      });
    });
  }
}
