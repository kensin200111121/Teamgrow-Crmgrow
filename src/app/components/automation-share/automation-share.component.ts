import { Component, Inject, OnInit } from '@angular/core';
import { Team } from '@models/team.model';
import { Subscription } from 'rxjs';
import { TeamService } from '@services/team.service';
import { ToastrService } from 'ngx-toastr';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Automation } from '@models/automation.model';

@Component({
  selector: 'app-automation-share',
  templateUrl: './automation-share.component.html',
  styleUrls: ['./automation-share.component.scss']
})
export class AutomationShareComponent implements OnInit {
  sharing = false;
  selectedTeam: Team = null;
  shareSubscription: Subscription;
  submitted = false;
  automation: Automation;

  constructor(
    public teamService: TeamService,
    private toast: ToastrService,
    private dialogRef: MatDialogRef<AutomationShareComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.automation) {
      this.automation = this.data.automation;
    }
  }

  ngOnInit(): void {}

  selectTeam(team): void {
    if (team) {
      this.selectedTeam = team;
      this.submitted = false;
    } else {
      this.selectedTeam = null;
    }
  }

  share(): void {
    this.submitted = true;
    if (!this.selectedTeam) {
      return;
    }

    if (this.automation) {
      this.sharing = true;
      this.shareSubscription && this.shareSubscription.unsubscribe();
      this.shareSubscription = this.teamService
        .shareAutomations([this.selectedTeam._id], [this.automation._id])
        .subscribe(
          (res) => {
            this.sharing = false;
            this.dialogRef.close({
              automation: res[0]
            });
          },
          (err) => {
            this.sharing = false;
          }
        );
    }
  }
}
