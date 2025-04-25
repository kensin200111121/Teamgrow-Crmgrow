import * as _ from 'lodash';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CountryISO } from 'ngx-intl-tel-input';
import { PHONE_COUNTRIES } from '@constants/variable.constants';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-schedule-location-edit',
  templateUrl: './schedule-location-edit.component.html',
  styleUrls: ['./schedule-location-edit.component.scss']
})
export class ScheduleLocationEditComponent implements OnInit, OnDestroy {
  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;

  Locations = [
    {
      name: 'In-person meeting',
      value: 'in_person'
    },
    {
      name: 'Phone Call',
      value: 'phone'
    },
    {
      name: 'Webinar',
      value: 'webinar'
    }
  ];

  locationType: string = 'in_person';
  meetingAddress: string = '';
  meetingPhone: any = {};
  meetingEmail: string = '';

  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;

  constructor(
    private dialogRef: MatDialogRef<ScheduleLocationEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService
  ) {
    if (this.data) {
      this.locationType = this.data.type;
      if (this.data.type === 'in_person') {
        this.meetingAddress = this.data.additional;
      } else if (this.data.type === 'phone') {
        this.meetingPhone = {
          internationalNumber: this.data.additional
        };
      } else if (this.data.type === 'webinar') {
        this.meetingEmail = this.data.additional;
      }
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  handleAddressChange(evt: any): void {
    console.log({ evt });
    this.meetingAddress = evt.formatted_address;
  }

  save(): any {
    if (!this.locationType) {
      return this.toast.warning('Please select a location type.');
    }
    if (this.locationType === 'phone' && !this.phoneControl.valid) {
      return;
    }

    const additionalData =
      this.locationType === 'in_person'
        ? this.meetingAddress
        : this.locationType === 'phone'
        ? this.meetingPhone.internationalNumber
        : this.meetingEmail;

    this.dialogRef.close({
      type: this.locationType,
      additional: additionalData
    });
  }
}
