import { SspaService } from '../../services/sspa.service';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { AutomationService } from '@services/automation.service';
import { ToastrService } from 'ngx-toastr';
import { SelectContactComponent } from '@components/select-contact/select-contact.component';
import { DialogSettings } from '@constants/variable.constants';
import { ContactService } from '@services/contact.service';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { KEY } from '@constants/key.constant';
import { ConfirmBusinessComponent } from '@components/confirm-business-hour/confirm-business-hour.component';
import { DealsService } from '@services/deals.service';
import { SelectDealComponent } from '@components/select-deal/select-deal.component';
import { TabItem } from '@app/utils/data.types';
import { ContactCreateEditComponent } from '../contact-create-edit/contact-create-edit.component';

@Component({
  selector: 'app-automation-assign',
  templateUrl: './automation-assign.component.html',
  styleUrls: ['./automation-assign.component.scss']
})
export class AutomationAssignComponent implements OnInit, OnDestroy {
  selectedAutomation: any;

  contacts: any[] = [];

  submitted = false;
  contactOverflow = false;
  loading = false;
  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  isBusinessTime = true;

  assignType = 'any';
  selectedTab: TabItem | undefined = undefined;
  tabs: TabItem[] = [];
  deals = [];

  @ViewChild('contactSelector') contactSelector: SelectContactComponent;
  @ViewChild('dealSelector') dealSelector: SelectDealComponent;

  constructor(
    private dialogRef: MatDialogRef<AutomationAssignComponent>,
    private automationService: AutomationService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private contactService: ContactService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public sspaService: SspaService
  ) {
    if (this.data) {
      this.selectedAutomation = this.data.automation;
      if (this.data.assignType) {
        this.assignType = this.data.assignType;
      }
    }
    if (this.assignType == 'any') {
      this.tabs.push({
        icon: '',
        label: 'Assign Contact',
        id: 'contact'
      });
      this.tabs.push({
        icon: '',
        label: 'Assign Deal',
        id: 'deal'
      });
      this.selectedTab =
        this.data?.defaultTab != 'deal' ? this.tabs[0] : this.tabs[1];
    } else if (this.assignType == 'contact') {
      this.tabs.push({
        icon: '',
        label: 'Assign Contact',
        id: 'contact'
      });
      this.selectedTab = this.tabs[0];
    } else if (this.assignType == 'deal') {
      this.tabs.push({
        icon: '',
        label: 'Assign Deal',
        id: 'deal'
      });
      this.selectedTab = this.tabs[0];
    }
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        // this.isBusinessTime = _garbage.business_time.is_enabled;
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  assignAutomation(): void {
    if (!this.contacts?.length && !this.deals?.length) {
      return;
    }
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
            this._assignAutomation();
          }
        });
    } else {
      this._assignAutomation();
    }
  }

  _assignAutomation(): void {
    this.submitted = true;
    if (this.selectedTab.id === 'contact') {
      if (!this.selectedAutomation || !this.contacts.length) {
        return;
      }
    } else {
      if (!this.selectedAutomation || !this.deals.length) {
        return;
      }
    }

    this.loading = true;
    const automation = this.selectedAutomation._id;

    if (this.selectedTab.id === 'contact') {
      const contacts = [];
      this.contacts.forEach((e) => {
        contacts.push(e._id);
      });

      this.automationService.bulkAssign(automation, contacts, null).subscribe(
        (res) => {
          this.loading = false;
          if (res) {
            this.dialogRef.close({ status: true });
            // this.toastr.success(
            //   'Automation is assigned to selected contacts successfully.'
            // );
          }
          this.dialogRef.close(res);
        },
        (err) => {
          this.loading = false;
          this.dialogRef.close({ status: false });
        }
      );
    } else {
      const dealIds = this.deals.map((item) => item._id);
      this.automationService.bulkAssign(automation, null, dealIds).subscribe(
        (res) => {
          this.loading = false;
          if (res) {
            this.dialogRef.close({ status: true });
            // this.toastr.success(
            //   'Automation is assigned to selected contacts successfully.'
            // );
          }
          this.dialogRef.close(res);
        },
        (err) => {
          this.loading = false;
          this.dialogRef.close({ status: false });
        }
      );
    }
  }

  addContacts(contact): any {
    if (this.contacts.length >= 15) {
      this.contactOverflow = true;
      this.contactSelector.clear();
      return;
    } else if (contact && this.contacts.length < 15) {
      const index = this.contacts.findIndex((item) => item._id === contact._id);
      if (index < 0) {
        this.contacts.push(contact);
      }
      this.contactSelector.clear();
    }
  }

  removeContact(contact): void {
    const index = this.contacts.findIndex((item) => item._id === contact._id);
    if (index >= 0) {
      this.contacts.splice(index, 1);
      this.contactOverflow = false;
    }
  }

  showAddContact(): void {
    this.dialog
      .open(ContactCreateEditComponent, DialogSettings.CONTACT)
      .afterClosed()
      .subscribe((res) => {
        if (res && res.created) {
        }
      });
  }

  addDeal(deal): void {
    if (this.deals.length >= 15) {
      this.contactOverflow = true;
      this.dealSelector.clear();
      return;
    } else if (deal && this.deals.length < 15) {
      const index = this.deals.findIndex((item) => item._id === deal._id);
      if (index < 0) {
        this.deals.push(deal);
      }
      this.dealSelector.clear();
    }
  }

  removeDeal(deal): void {
    const index = this.deals.findIndex((item) => item._id === deal._id);
    if (index >= 0) {
      this.deals.splice(index, 1);
      this.contactOverflow = false;
    }
  }

  getStageTitle(deal): any {
    if (deal) {
      return deal.pipe_line?.['title'] + ' / ' + deal.deal_stage?.['title'];
    }
    return '';
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

  submit() {
    this.submitted = true;
    this.assignAutomation();
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }
}
