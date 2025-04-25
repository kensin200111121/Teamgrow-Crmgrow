import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TeamService } from '@services/team.service';
import { ContactService } from '@services/contact.service';
import { UserService } from '@services/user.service';
import { ConfirmShareContactsComponent } from '@components/confirm-share-contacts/confirm-share-contacts.component';
import { MatDialog } from '@angular/material/dialog';
import { AutomationService } from '@services/automation.service';
@Component({
  selector: 'app-unassign-bulk-automation',
  templateUrl: './unassign-bulk-automation.component.html',
  styleUrls: ['./unassign-bulk-automation.component.scss']
})
export class UnassignBulkAutomation implements OnInit {
  contacts = [];
  deals = [];
  submitted = false;
  loading = false;
  automation;

  constructor(
    private dialogRef: MatDialogRef<UnassignBulkAutomation>,
    private automationService: AutomationService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.automation = this.data.automation;
      if (this.data.contacts) {
        this.contacts = this.data.contacts;
      }
      if (this.data.deals) {
        this.deals = this.data.deals;
      }
    }
  }

  unassign(): void {
    this.loading = true;
    if (this.contacts && this.contacts.length > 0) {
      const contacts = this.contacts.map((item) => item._id);
      this.automationService
        .bulkUnassign({ contacts, automation: this.automation })
        .subscribe((res) => {
          if (res && res.status) {
            this.loading = false;
            this.dialogRef.close({ status: true });
          } else {
            this.loading = false;
            this.dialogRef.close({ status: false });
          }
        });
    } else if (this.deals && this.deals.length > 0) {
      const deals = this.deals.map((item) => item._id);
      this.automationService
        .bulkUnassign({ deals, automation: this.automation })
        .subscribe((res) => {
          if (res && res.status) {
            this.loading = false;
            this.dialogRef.close({ status: true });
          } else {
            this.loading = false;
            this.dialogRef.close({ status: false });
          }
        });
    }
  }
}
