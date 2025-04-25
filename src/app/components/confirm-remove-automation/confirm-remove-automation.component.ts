import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from '@services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-confirm-remove-automation',
  templateUrl: './confirm-remove-automation.component.html',
  styleUrls: ['./confirm-remove-automation.component.scss']
})
export class ConfirmRemoveAutomationComponent implements OnInit {
  priority = 0;
  title = '';
  submitted = false;
  saving = false;
  createSubscription: Subscription;
  stages: any[];
  lead_forms: any[];
  event_types: any[];
  deals: any[];
  automations: any[];
  running = false;
  running_automation_id: string;
  d_status = {};
  sharedTeams: any[];
  smartCodes: any[];

  constructor(
    private dealsService: DealsService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<ConfirmRemoveAutomationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.additional) {
      for (let i = 0; i < this.data.additional.length; i++) {
        switch (this.data.additional[i].reason) {
          case 'stages':
            this.stages = this.data.additional[i].stages;
            break;
          case 'lead_forms':
            this.lead_forms = this.data.additional[i].lead_forms;
            break;
          case 'event_types':
            this.event_types = this.data.additional[i].event_types;
            break;
          case 'automations':
            this.automations = this.data.additional[i].automations;
            break;
          case 'running':
            this.running = true;
            this.running_automation_id = this.data.automation_id;
            break;
          case 'shared teams':
            this.sharedTeams = this.data.additional[i].teams;
            break;
          case 'smartcodes':
            this.smartCodes = this.data.additional[i].smartcodes;
            break;
        }
      }
      // this.deals = this.data.deal;
    }
  }

  ngOnInit(): void {}

  expandDetails(id): void {
    if (this.d_status[id]) {
      this.d_status[id] = false;
    } else {
      this.d_status[id] = true;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
