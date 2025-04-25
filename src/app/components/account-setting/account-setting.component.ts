import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { PermissionSetting } from '@app/utils/data.types';
import { Garbage } from '@app/models/garbage.model';

@Component({
  selector: 'app-account-setting',
  templateUrl: './account-setting.component.html',
  styleUrls: ['./account-setting.component.scss']
})
export class AccountSettingComponent implements OnInit {
  saving = false;
  isSubmitted = false;
  login_enabled = false;
  master_enabled = false;
  billing_access_enabled = false;
  team_stay_enabled = true;
  assignee_info_is_editable = false;
  user: User = new User();
  garbage: Garbage = new Garbage();
  is_team = false;
  teamSettings: PermissionSetting[] = [];
  currentPageItem: PermissionSetting;
  loading = false;
  constructor(
    private dialogRef: MatDialogRef<AccountSettingComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private clipboard: Clipboard,
    private toastr: ToastrService
  ) {}

  async ngOnInit(): Promise<void> {
    this.is_team = this.data.is_team;
    this.loading = true;
    this.teamSettings = await this.userService.getTeamSettings().toPromise();
    //data.team_settings;
    if (!this.data.is_team && this.data.user) {
      this.user = this.data.user;
      this.login_enabled = this.user.login_enabled;
      this.master_enabled = this.user.master_enabled;
      this.billing_access_enabled = this.user.billing_access_enabled;
      this.team_stay_enabled = this.user.team_stay_enabled;
      this.assignee_info_is_editable =
        this.user.assignee_info?.is_editable || false;
    } else if (this.data.is_team) {
      this.currentPageItem = this.teamSettings[0];
    }
    this.loading = false;
  }

  async saveMemeberSettings(): Promise<boolean> {
    this.user.master_enabled = this.master_enabled;
    this.user.login_enabled = this.login_enabled;
    this.user.billing_access_enabled = this.billing_access_enabled;
    this.user.team_stay_enabled = this.team_stay_enabled;
    if (!this.user.assignee_info)
      this.user.assignee_info = {
        is_editable: this.assignee_info_is_editable,
        is_enabled: false
      };
    else this.user.assignee_info.is_editable = this.assignee_info_is_editable;

    const data = {
      master_enabled: this.user.master_enabled,
      login_enabled: this.user.login_enabled,
      billing_access_enabled: this.user.billing_access_enabled,
      team_stay_enabled: this.user.team_stay_enabled,
      assignee_info: {
        is_editable: this.user.assignee_info.is_editable
      }
    };

    const result = await this.userService
      .updateSubAccount(this.user._id, data)
      .toPromise();
    return result['status'];
  }

  saveTeamSettings(): boolean {
    const result = this.userService
      .updateTeamSettings(this.teamSettings)
      .toPromise();
    return result['status'];
  }

  clickDrowdownMemberOption(id): void {
    const setings = this.teamSettings.find((x) => x.id === id);
    this.user.login_enabled = this.login_enabled =
      setings.options.find((x) => x.id === id + '.login_enabled')?.value ||
      false;
    this.user.master_enabled = this.master_enabled =
      setings.options.find((x) => x.id === id + '.master_enabled')?.value ||
      false;
    this.user.billing_access_enabled = this.billing_access_enabled =
      setings.options.find((x) => x.id === id + '.billing_access_enabled')
        ?.value || false;
    this.user.team_stay_enabled = this.team_stay_enabled =
      setings.options
        .find((x) => x.id === id + '.billing_access_enabled')
        ?.options.find((y) => y.id === id + '.team_stay_enabled')?.value ||
      true;
    this.user.assignee_info.is_editable = this.assignee_info_is_editable =
      setings.options.find((x) => x.id === id + '.assignee_info.is_editable')
        ?.value || false;
  }

  changeTab(tab: PermissionSetting): void {
    this.currentPageItem = tab;
  }

  close(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    let result;
    this.saving = true;
    if (this.is_team) {
      result = await this.saveTeamSettings();
    } else {
      result = await this.saveMemeberSettings();
    }
    this.saving = false;
    if (result) {
      this.toastr.success('Udate settings successfully');
      if (!this.is_team) this.dialogRef.close(this.user);
      else this.dialogRef.close();
    }
  }

  getOptionTranslation(option: string): string {
    const index = option.indexOf('.');
    if (index === -1) return '';
    return option.substring(index + 1);
  }
}
