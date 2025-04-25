import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AutomationListService } from '@app/services/automation-list.service';
import { UserService } from '@app/services/user.service';
import { contactTableFields } from '@utils/data';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-custom-token',
  templateUrl: './confirm-custom-token.component.html',
  styleUrls: ['./confirm-custom-token.component.scss']
})
export class ConfirmCustomTokenComponent implements OnInit {
  submitting = false;
  customTokens = [];
  fields = contactTableFields;
  garbageSubscription: Subscription;
  addtionalFields: any[] = [];
  constructor(
    private dialogRef: MatDialogRef<ConfirmCustomTokenComponent>,
    private service: AutomationListService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.customTokens = this.data.duplicatedTokens;
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        if (_garbage._id) {
          this.addtionalFields = _garbage.additional_fields;
        }
      }
    );
  }

  doConfirm(): void {
    this.submitting = true;
    const tokens = [];
    this.customTokens.forEach((e) => {
      const matched_fields = e.match_fields;
      matched_fields.forEach((f) => {
        if (f.selected && f.token_user !== 'me') {
          const index = this.fields.findIndex(
            (field) => field.value === f.field_name
          );
          tokens.push({
            name: e.name,
            match_field: f.field_name,
            token_user: f.token_user,
            is_standard_field: index === -1 ? false : true
          });
        }
      });
    });
    this.service.downloadDuplicatedTokens(tokens).subscribe((res) => {
      this.submitting = false;
      if (res) {
        this.dialogRef.close();
      }
    });
  }

  isSelectedMatchField(index: number, m_index: number): boolean {
    return this.customTokens[index].match_fields[m_index].selected;
  }

  isSelectedAddtionalField(match_field: any): boolean {
    if (match_field.value) {
      return false;
    }
    const standardIndex = this.fields.findIndex(
      (field) => field.value === match_field.field_name
    );
    const addtionalIndex = this.addtionalFields.findIndex(
      (field) => field.name === match_field.field_name
    );
    return (
      match_field.selected &&
      standardIndex === -1 &&
      addtionalIndex === -1 &&
      match_field.token_user !== 'me'
    );
  }

  selectMatchField(index: number, field_name: any): void {
    for (let i = 0; i < this.customTokens[index].match_fields.length; i++) {
      if (this.customTokens[index].match_fields[i].field_name === field_name) {
        this.customTokens[index].match_fields[i].selected = true;
      } else {
        this.customTokens[index].match_fields[i].selected = false;
      }
    }
  }
}
