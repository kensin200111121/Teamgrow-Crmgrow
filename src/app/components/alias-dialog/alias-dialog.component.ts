import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { Alias } from '@utils/data.types';
import { FormType } from '@utils/enum';

@Component({
  selector: 'app-alias-dialog',
  templateUrl: './alias-dialog.component.html',
  styleUrls: ['./alias-dialog.component.scss']
})
export class AliasDialogComponent implements OnInit {
  readonly FormType = FormType;
  formType: FormType = FormType.CREATE;

  alias: Alias = null;
  aliasList: Alias[] = [];
  email: string = '';
  name: string = '';
  error: string = '';

  creating: boolean = false;
  updating: boolean = false;
  sending: boolean = false;
  verifying: boolean = false;

  createSubscription: Subscription;
  updateSubscription: Subscription;
  sendCodeSubscription: Subscription;
  verifySubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<AliasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private userService: UserService
  ) {
    if (this.data?.alias) {
      this.alias = this.data?.alias;
      this.email = this.alias.email;
      this.name = this.alias.name;
    }
    if (this.data?.type) {
      this.formType = this.data?.type;
    }
    if (this.data?.aliasList?.length) {
      this.aliasList = this.data.aliasList;
    }
  }

  ngOnInit(): void {}

  /**
   * Create the alias
   */
  create(): void {
    // Check the duplication
    const pos = this.aliasList.findIndex((e) => e.email === this.email);
    if (pos !== -1) {
      this.error = 'duplicated';
      return;
    }
    this.creating = true;
    this.createSubscription && this.createSubscription.unsubscribe();
    this.createSubscription = this.userService
      .createEmailAlias(this.email, this.name)
      .subscribe(() => {
        this.creating = false;
        this.dialogRef.close({ name: this.name, email: this.email });
      });
  }

  /**
   * Update the Email Alias
   */
  update(): void {
    this.updating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.userService
      .editEmailAlias(this.email, this.name, false)
      .subscribe(() => {
        this.updating = false;
        this.dialogRef.close({ name: this.name, email: this.email });
      });
  }

  /**
   * Send the code
   */
  sendCode(): void {
    this.sending = true;
    this.sendCodeSubscription && this.sendCodeSubscription.unsubscribe();
    this.sendCodeSubscription = this.userService
      .requestAliasVerification(this.alias.email)
      .subscribe(() => {
        this.sending = false;
      });
  }

  /**
   * Verify the code
   */
  verifyCode(code: string): void {
    this.verifying = true;
    this.verifySubscription && this.verifySubscription.unsubscribe();
    this.verifySubscription = this.userService
      .verifyAlias(this.alias.email, code)
      .subscribe(() => {
        this.verifying = false;
      });
  }
}
