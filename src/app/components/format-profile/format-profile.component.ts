import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Account } from '@models/user.model';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-format-profile',
  templateUrl: './format-profile.component.html',
  styleUrls: ['./format-profile.component.scss']
})
export class FormatProfileComponent implements OnInit {
  formatOption = 'normally';
  removing = false;
  account: Account;
  recalledCount = 0;

  constructor(
    private dialogRef: MatDialogRef<FormatProfileComponent>,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.account) {
      this.account = this.data.account;
    }
  }

  ngOnInit(): void {}

  deleteProfile(): void {
    this.removing = true;
    this.userService
      .removeSubAccount(this.account._id, { remove_seat: true })
      .subscribe((res) => {
        if (res && res['status']) {
          this.removing = false;
          this.dialogRef.close({
            status: true,
            mode: this.formatOption,
            count: 1
          });
        } else {
          this.removing = false;
        }
      });
  }

  cancelSubscription(count): void {
    this.userService.recallSubAccount({}).subscribe((res) => {
      if (res && res['status']) {
        if (count > 1) {
          this.recalledCount++;
          this.cancelSubscription(count - 1);
        } else {
          this.removing = false;
          this.recalledCount++;
          this.dialogRef.close({
            status: true,
            mode: this.formatOption,
            count: this.recalledCount
          });
        }
      } else {
        if (count > 1) {
          this.cancelSubscription(count - 1);
        } else {
          this.removing = false;
          this.dialogRef.close({
            status: true,
            mode: this.formatOption,
            count: this.recalledCount
          });
        }
      }
    });
  }
}
