import { Component, Inject, OnInit } from '@angular/core';
import { SmsService } from '@services/sms.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { NotifyComponent } from '@components/notify/notify.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { SMS_COUNTRIES } from '@app/constants/variable.constants';
import { COUNTRIES } from '@app/constants/countries.constant';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
import { CountryISO } from 'ngx-intl-tel-input';

@Component({
  selector: 'app-add-phone',
  templateUrl: './add-phone.component.html',
  styleUrls: ['./add-phone.component.scss']
})
export class AddPhoneComponent implements OnInit {
  COUNTRIES = [];

  loading = false;
  saving = false;
  searchCode = '';
  phoneNumbers = [];
  selectedPhone = '';
  type = '';
  suggestPhones = [
    {
      phone: '(303) 431-3301',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3302',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3303',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3301',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3302',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3303',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3301',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3302',
      location: 'Denver, CO'
    },
    {
      phone: '(303) 431-3303',
      location: 'Denver, CO'
    }
  ];
  selectedCountry: any = {
    areaCodes: undefined,
    dialCode: '',
    iso2: '',
    name: '',
    placeholder: '',
    priority: 0
  };
  phoneUtil = PhoneNumberUtil.getInstance();

  constructor(
    private smsService: SmsService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<AddPhoneComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.type = this.data.type;
    }
  }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.fetchCountryData();
    this.selectedCountry = this.COUNTRIES.find((c) => {
      return c.iso2.toLowerCase() === CountryISO.UnitedStates.toLowerCase();
    });
    this.searchPhone();
  }

  fetchCountryData() {
    this.COUNTRIES = [];
    const smsCountries = SMS_COUNTRIES.map((e) => e.toString());
    COUNTRIES.forEach((c) => {
      if (smsCountries.indexOf(c[1].toString()) !== -1) {
        const country = {
          name: c[0].toString(),
          iso2: c[1].toString(),
          dialCode: c[2].toString(),
          priority: +c[3] || 0,
          areaCodes: c[4] || undefined,
          htmlId: `iti-0__item-${c[1].toString()}`,
          flagClass: `iti__${c[1].toString().toLocaleLowerCase()}`,
          placeHolder: '',
          mask: ''
        };
        country.placeHolder = this.getPhoneNumberPlaceHolder(
          country.iso2.toUpperCase()
        );
        country.mask = country.placeHolder.replace(/[0-9]/gi, '0');
        this.COUNTRIES.push(country);
      }
    });
  }

  getPhoneNumberPlaceHolder(countryCode) {
    try {
      return this.phoneUtil.format(
        this.phoneUtil.getExampleNumber(countryCode),
        PhoneNumberFormat.NATIONAL
      );
    } catch (e) {
      return e;
    }
  }

  selectPhone(phone: string): void {
    this.selectedPhone = phone;
  }

  isSelected(phone: string): any {
    return this.selectedPhone === phone;
  }

  searchPhone(): void {
    this.loading = true;
    const data = {
      dialCode: `+${this.selectedCountry.dialCode}`,
      countryCode: this.selectedCountry.iso2.toUpperCase()
    };
    if (this.searchCode) {
      data['searchCode'] = parseInt(this.searchCode).toString();
    }

    this.smsService.searchNumbers(data).subscribe((res) => {
      this.loading = false;
      this.phoneNumbers = res?.data;
    });
  }

  onCountrySelect(country, el) {
    this.selectedCountry = country;
    el.focus();
  }

  save(): void {
    if (this.selectedPhone == '') {
      return;
    } else {
      if (this.type == 'edit') {
        this.dialog
          .open(ConfirmComponent, {
            data: {
              title: 'Confirm Phone Number Change?',
              message:
                'By initiating a phone number change and clicking YES, you are agreeing to a one time charge of $9.99.',
              cancelLabel: 'No',
              confirmLabel: 'Yes'
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res) {
              this.saving = true;
              const data = {
                number: this.selectedPhone
              };
              this.smsService.buyNumbers(data).subscribe((res) => {
                if (res?.status) {
                  this.saving = false;
                  this.dialogRef.close(this.selectedPhone);
                } else {
                  this.saving = false;
                }
              });
            }
          });
      } else {
        this.saving = true;
        const data = {
          number: this.selectedPhone
        };
        this.smsService.buyNumbers(data).subscribe((res) => {
          if (res?.status) {
            this.saving = false;
            this.dialogRef.close(this.selectedPhone);
          } else {
            this.saving = false;
          }
        });
      }
    }
  }
}
