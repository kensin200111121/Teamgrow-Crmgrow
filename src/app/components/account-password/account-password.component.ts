import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { User } from '@models/user.model';
import { UserService } from '@services/user.service';
import { generatePassword, getRandomInt } from '@utils/functions';

@Component({
  selector: 'app-account-password',
  templateUrl: './account-password.component.html',
  styleUrls: ['./account-password.component.scss']
})
export class AccountPasswordComponent implements OnInit {
  saving = false;
  autoPassword = false;
  regeneratePassword = false;
  pass = '';
  passwordType = 'password';
  user: User = new User();

  constructor(
    private dialogRef: MatDialogRef<AccountPasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private toastr: ToastrService
  ) {
    this.user = this.data.user;
  }

  ngOnInit(): void {}

  onSwitchPassword(auto: boolean): void {
    this.autoPassword = auto;
    if (this.autoPassword) {
      this.generatePassword();
    } else {
      this.pass = '';
      this.passwordType = 'password';
    }
    document.getElementById('password').focus();
  }

  onRegeneratePassword(): void {
    this.regeneratePassword = true;
  }

  onCancelRegeneratePassword(): void {
    this.regeneratePassword = false;
  }

  generatePassword(): void {
    const length = getRandomInt(6, 12);
    this.pass = generatePassword(length);
  }

  close(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    const data = {
      hasPassword: this.pass ? true : false,
      password: this.pass
    };
    this.saving = true;
    const result = await this.userService
      .updateSubAccount(this.user._id, data)
      .toPromise();
    this.saving = false;  
    if (result['status']) {
      this.toastr.success('Change the password successfully');
      this.user.hasPassword = data.hasPassword;
      this.dialogRef.close(this.user);
    }
  }
}
