import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-authorize-code-confirm',
  templateUrl: './authorize-code-confirm.component.html',
  styleUrls: ['./authorize-code-confirm.component.scss']
})
export class AuthorizeCodeConfirmComponent implements OnInit {
  email = '';
  code = '';
  isValid = true;

  constructor(
    public dialogRef: MatDialogRef<AuthorizeCodeConfirmComponent>,
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
      this.userService.authorizeSMTPCode(code).subscribe((res) => {
        if (res && res['status']) {
          this.dialogRef.close({ status: true, code: code });
        }
      });
    }
  }
}
