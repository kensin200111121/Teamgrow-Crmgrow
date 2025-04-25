import { Component, Inject, Input, OnInit } from '@angular/core';
import { Contact } from '@models/contact.model';
import { DealsService } from '@services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealStage } from '@models/deal-stage.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Automation } from '@models/automation.model';
import { AutomationService } from '@services/automation.service';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmBusinessComponent } from '@components/confirm-business-hour/confirm-business-hour.component';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-deal-automation',
  templateUrl: './deal-automation.component.html',
  styleUrls: ['./deal-automation.component.scss']
})
export class DealAutomationComponent implements OnInit {
  selectedStage: DealStage = new DealStage();
  submitted = false;
  saving = false;
  updateSubscription: Subscription;
  assignSubscription: Subscription;
  assigning = false;
  detaching = false;
  selectedAutomation: Automation;
  dealIds: string[] = [];
  timeLines = [];
  automation = null;
  allDataSource = new MatTreeNestedDataSource<any>();
  selectedAutomationid = '';
  originAutomation: Automation;
  originAutomationId = '';
  garbageSubscription: Subscription;
  isBusinessTime = true;

  constructor(
    private dialogRef: MatDialogRef<DealAutomationComponent>,
    private dialog: MatDialog,
    private dealsService: DealsService,
    private userService: UserService,
    private automationService: AutomationService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.selectedStage = this.data.dealStage;
    if (this.data.dealStage && this.data.dealStage.automation) {
      this.selectedAutomation = this.data.dealStage.automation;
      this.originAutomation = this.data.dealStage.automation;
      this.selectedAutomationid = this.data.dealStage.automation._id;
      this.originAutomationId = this.originAutomation._id;
    }

    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        // this.isBusinessTime = _garbage.business_time.is_enabled;
      }
    );
  }
  selectAutomation(evt: Automation): void {
    this.selectedAutomation = evt;
  }

  updateStage(): void {
    const stageArray = this.dealsService.stages.getValue();
    if (stageArray && stageArray.length) {
      stageArray.find((obj) => obj._id == this.selectedStage._id).automation =
        this.selectedAutomation;
    }
  }

  setAutomation(): void {
    const dealIds = [];
    for (const deal of this.selectedStage.deals) {
      dealIds.push(deal._id);
    }

    if (dealIds.length == 0) {
      this.saving = true;
      if (this.selectedStage._id) {
        this.updateSubscription && this.updateSubscription.unsubscribe();
        this.updateSubscription = this.dealsService
          .updateStage(this.selectedStage._id, {
            automation: this.selectedAutomation
          })
          .subscribe((res) => {
            if (res) {
              this.updateStage();
            } else {
              this.toast.error('', 'Automation assignment is failure.', {
                closeButton: true
              });
            }
            this.saving = false;
            this.dialogRef.close(this.selectedAutomation);
          });
      } else {
        this.dialogRef.close(this.selectedAutomation);
      }
    } else {
      this.dialog
        .open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Assign Automation',
            message: 'Do you want apply these automation to existing deals?',
            cancelLabel: 'No',
            confirmLabel: 'Yes'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) {
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
                    this._assignAutomation(dealIds);
                  }
                });
            } else {
              this._assignAutomation(dealIds);
            }
          }
        });
    }
  }

  _assignAutomation(dealIds): void {
    this.saving = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.dealsService
      .updateStage(this.selectedStage._id, {
        automation: this.selectedAutomation
      })
      .subscribe((res) => {
        console.log('success');
        this.updateStage();
      });

    this.automationService
      .bulkAssign(this.selectedAutomation._id, null, dealIds)
      .subscribe((res) => {
        this.saving = false;
        if (res) {
        } else {
          this.toast.error('', 'Automation assignment is failure.', {
            closeButton: true
          });
        }
        this.dialogRef.close(this.selectedAutomation);
      });
  }

  detach(): void {
    const dealIds = [];
    for (const deal of this.selectedStage.deals) {
      dealIds.push(deal._id);
    }
    if (dealIds.length == 0) {
      this.detaching = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.dealsService
        .updateStage(this.selectedStage._id, {
          automation: null
        })
        .subscribe((res) => {
          if (res) {
            this.updateStage();
          } else {
            this.toast.error('', 'Automation detachment is failure.', {
              closeButton: true
            });
          }
          this.detaching = false;
          this.dialogRef.close('detach');
        });
    } else {
      this.dialog
        .open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'Detach Automation',
            message: 'Do you want detach this automation from existing deals?',
            cancelLabel: 'No',
            confirmLabel: 'Yes'
          }
        })
        .afterClosed()
        .subscribe((confirm) => {
          if (confirm) {
            this.detaching = true;
            this.updateSubscription && this.updateSubscription.unsubscribe();
            this.updateSubscription = this.dealsService
              .updateStage(this.selectedStage._id, {
                automation: null
              })
              .subscribe((res) => {
                this.updateStage();
              });
            for (let i = 0; i < dealIds.length; i++) {
              this.automationService
                .unAssignDeal(dealIds[i])
                .subscribe((res) => {
                  this.detaching = false;
                  if (res) {
                  } else {
                    this.toast.error('', 'Automation detachment is failure.', {
                      closeButton: true
                    });
                  }
                  this.dialogRef.close('detach');
                });
            }
          }
        });
    }
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
