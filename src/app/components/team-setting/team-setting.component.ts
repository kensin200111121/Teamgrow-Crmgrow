import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { TeamService } from '@services/team.service';

@Component({
  selector: 'app-team-setting',
  templateUrl: './team-setting.component.html',
  styleUrls: ['./team-setting.component.scss']
})
export class TeamSettingComponent implements OnInit {
  submitted = false;
  saving = false;
  saveSubscription: Subscription;
  is_public = true;
  team_setting = {
    viewMembers: false,
    requestInvite: false,
    shareMaterial: false,
    downloadMaterial: false,
  };

  constructor(
    public dialogRef: MatDialogRef<TeamSettingComponent>,
    private teamService: TeamService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.team.team_setting) {
      this.team_setting = this.data.team.team_setting;
      this.is_public = this.data.team.is_public;
    }
  }

  ngOnInit(): void {}

  setPrivate(): void {
    this.is_public = !this.is_public;
  }

  setTeamSetting(setting:string): void {    
    switch(setting) {
      case 'viewMembers': 
        const viewMembers = !this.team_setting[setting];
        this.team_setting = { ...this.team_setting, viewMembers };
        break;
      case 'requestInvite': 
        const requestInvite = !this.team_setting[setting];
        this.team_setting = { ...this.team_setting, requestInvite };
        break;
      case 'shareMaterial': 
        const shareMaterial = !this.team_setting[setting];
        this.team_setting = { ...this.team_setting, shareMaterial };
        break;
      case 'downloadMaterial': 
        const downloadMaterial = !this.team_setting[setting];
        this.team_setting = { ...this.team_setting, downloadMaterial };
        break;
    }
  }

  save(): void {
    this.saving = true;
    const data = {
      team_setting: this.team_setting,
      is_public: this.is_public
    };
    this.saveSubscription = this.teamService
      .update(this.data.team._id, data)
      .subscribe(
        (res) => {
          this.saving = false;
          this.dialogRef.close(res);
        },
        (err) => {
          this.saving = false;
        }
      );
  }
  ngOnDestory(): void {
    this.saveSubscription && this.saveSubscription.unsubscribe();
    console.log('teamsetting log');
  }
}
