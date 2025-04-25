import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-verify-code-confirm',
  templateUrl: './verify-code-confirm.component.html',
  styleUrls: ['./verify-code-confirm.component.scss']
})
export class VerifyCodeConfirmComponent implements OnInit {
  email = '';
  code = '';
  isValid = true;

  constructor(
    public dialogRef: MatDialogRef<VerifyCodeConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService
  ) {
    if (this.data) {
      if (this.data.email) {
        this.email = this.data.email;
      }
    }
  }

  ngOnInit(): void {}

  onCodeCompleted(code: string): void {
    if (code) {
      this.userService.verifySMTPCode(code).subscribe((res) => {
        if (res && res['status']) {
          this.dialogRef.close({ status: true, code: code });
        }
      });
    }
  }
}
