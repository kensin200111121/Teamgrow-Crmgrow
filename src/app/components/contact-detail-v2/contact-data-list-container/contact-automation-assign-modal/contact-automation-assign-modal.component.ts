import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Automation } from '@models/automation.model';
import { UserService } from '@app/services/user.service';
import { ContactService } from '@app/services/contact.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@app/components/confirm/confirm.component';
import { ConfirmBusinessComponent } from '@app/components/confirm-business-hour/confirm-business-hour.component';
import { AutomationService } from '@app/services/automation.service';
import * as _ from 'lodash';
import { SspaService } from '@app/services/sspa.service';
import { ContactDetailInfoService } from '@app/services/contact-detail-info.service';

@Component({
  selector: 'app-contact-automation-assign-modal',
  templateUrl: './contact-automation-assign-modal.component.html',
  styleUrls: ['./contact-automation-assign-modal.component.scss']
})
export class ContactAutomationAssignModalComponent implements OnInit {
  contactId = '';
  dealId = '';

  selectedAutomation = '';

  assigning = false;

  isBusinessTime = true;

  automationUnAssigned = true;

  constructor(
    public userService: UserService,
    public contactService: ContactService,
    private changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private automationService: AutomationService,
    public sspaService: SspaService,
    protected contactDetailInfoService: ContactDetailInfoService,
    private dialogRef: MatDialogRef<ContactAutomationAssignModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      contactId?: string;
      dealId?: string;
    }
  ) {
    this.contactId = this.data?.contactId;
    this.dealId = this.data?.dealId;
  }

  ngOnInit(): void {}

  ngOnChanges(): void {}

  /*****************************************
   * Automation Select & Display
   *****************************************/
  /**
   * Select Automation To assign
   * @param evt :Automation
   */
  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt._id;
  }

  assignAutomation(): void {
    if (!this.selectedAutomation) {
      return;
    }
    if (this.dealId) {
      const flag = this.getConfirmedAutomationBusinessHour();
      if (!flag) {
        this.dialog
          .open(ConfirmBusinessComponent, {
            maxWidth: '500px',
            width: '96vw',
            data: {
              title: 'Confirm Business Hour',
              message:
                'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
              cancelLabel: 'Cancel',
              confirmLabel: 'Ok'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              if (res.notShow) {
                this.updateConfirmAutomationBusinessHour();
              }
              this._assignAutomation();
            }
          });
      } else {
        this._assignAutomation();
      }
    } else {
      const allContactDataSource = {
        data: []
      };
      if (allContactDataSource.data.length) {
        const flag = this.getConfirmedAutomationBusinessHour();
        if (!flag && this.isBusinessTime) {
          this.dialog
            .open(ConfirmComponent, {
              maxWidth: '400px',
              width: '96vw',
              data: {
                title: 'Reassign new automation',
                message:
                  'Are you sure to stop the current automation and start new automation?',
                cancelLabel: 'Cancel',
                confirmLabel: 'Assign'
              }
            })
            .afterClosed()
            .subscribe((status) => {
              if (status) {
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
                  .subscribe((res) => {
                    if (res) {
                      if (res.notShow) {
                        this.updateConfirmAutomationBusinessHour();
                      }
                      this._assignAutomation();
                    }
                  });
              }
            });
        } else {
          this.dialog
            .open(ConfirmComponent, {
              maxWidth: '400px',
              width: '96vw',
              data: {
                title: 'Reassign new automation',
                message:
                  'Are you sure to stop the current automation and start new automation?',
                cancelLabel: 'Cancel',
                confirmLabel: 'Assign'
              }
            })
            .afterClosed()
            .subscribe((status) => {
              if (status) {
                this._assignAutomation();
              }
            });
        }
      } else {
        const flag = this.getConfirmedAutomationBusinessHour();
        if (!flag && this.isBusinessTime) {
          this.dialog
            .open(ConfirmBusinessComponent, {
              maxWidth: '500px',
              width: '96vw',
              data: {
                title: 'Confirm Business Hour',
                message:
                  'The email and texting in automation might be sending in different hours than your automation scenario as you have enabled business hours.',
                cancelLabel: 'Cancel',
                confirmLabel: 'Ok'
              }
            })
            .afterClosed()
            .subscribe((res) => {
              if (res) {
                if (res.notShow) {
                  this.updateConfirmAutomationBusinessHour();
                }
                this._assignAutomation();
              }
            });
        } else {
          this._assignAutomation();
        }
      }
    }
  }

  _assignAutomation(): void {
    this.assigning = true;
    // this.assignSubscription && this.assignSubscription.unsubscribe();
    this.automationService
      .bulkAssign(
        this.selectedAutomation,
        this.contactId ? [this.contactId] : null,
        this.dealId ? [this.dealId] : null
      )
      .subscribe((res) => {
        this.assigning = false;
        this.changeDetector.markForCheck();
        this.automationUnAssigned = false;
        this.dialogRef.close(res);
      });
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
