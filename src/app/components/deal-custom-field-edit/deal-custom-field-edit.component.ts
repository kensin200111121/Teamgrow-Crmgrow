import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CountryISO } from 'ngx-intl-tel-input';
import {
  DialogSettings,
  PHONE_COUNTRIES
} from '@app/constants/variable.constants';
import { CustomFieldService } from '@app/services/custom-field.service';
import { ConfirmComponent } from '../confirm/confirm.component';

@Component({
  selector: 'app-deal-custom-field-edit',
  templateUrl: './deal-custom-field-edit.component.html',
  styleUrls: ['./deal-custom-field-edit.component.scss']
})
export class DealCustomFieldEdit implements OnInit {
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;
  additional_fields = {};
  value = {};
  isSubmitting = false;
  isCreate = false;
  fields = [];

  private _originalValue = {};

  constructor(
    private customFieldService: CustomFieldService,
    private dialogRef: MatDialogRef<DealCustomFieldEdit>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public router: Router
  ) {
    this.customFieldService.loadDealFields();
    if (this.data) {
      this.additional_fields = this.data?.additional_fields || {};
      this._originalValue = { ...this.additional_fields };
      this.isCreate = false;
    }

    this.customFieldService.dealFields$.subscribe((fields) => {
      this.fields = fields;
    });
  }

  ngOnInit(): void {}

  gotoPipelineManager(): void {
    const newValue = {
      ...this.additional_fields,
      ...this.value
    };
    const isSame = this.fields.every((field) => {
      if (this._originalValue[field.name] === newValue[field.name]) {
        return true;
      }
      return false;
    });
    if (isSame) {
      this.router.navigate(['/pipeline/pipeline-manager/custom-fields']);
      this.dialogRef.close();
    } else {
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Warning',
            message:
              'You will be directed to the Pipeline Manager, updates may be lost. Are you sure?',
            confirmLabel: 'Yes',
            cancelLabel: 'No'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.router.navigate(['/pipeline/pipeline-manager/custom-fields']);
            this.dialogRef.close();
          }
        });
    }
  }

  changeValue(event, field) {
    this.value[field] = event?.internationalNumber || '';
  }

  changeDate(field) {
    const date = new Date(this.additional_fields[field]);
    const formattedDate =
      ('0' + (date.getMonth() + 1)).slice(-2) +
      '/' +
      ('0' + date.getDate()).slice(-2) +
      '/' +
      date.getFullYear();
    this.additional_fields[field] = formattedDate;
  }

  submit() {
    this.dialogRef.close({
      ...this.additional_fields,
      ...this.value
    });
  }
}
