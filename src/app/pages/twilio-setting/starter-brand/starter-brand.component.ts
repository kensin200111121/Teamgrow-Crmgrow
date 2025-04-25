import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { REGIONS, REGION_CODE } from '@app/constants/variable.constants';
import { UserService } from '@app/services/user.service';
import { SmsService } from '@services/sms.service';
import { StarterBrand } from '@utils/data.types';
import { CountryISO } from 'ngx-intl-tel-input';

type StartBrandFormData = { customerPhone: any } & Omit<
  StarterBrand,
  'customerPhone'
>;

@Component({
  selector: 'app-starter-brand',
  templateUrl: './starter-brand.component.html',
  styleUrls: ['./starter-brand.component.scss']
})
export class StarterBrandComponent implements OnInit {
  readonly COUNTRIES: { code: string; name: string }[] = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' }
  ];
  readonly REGIONS = REGIONS;
  readonly REGION_CODE = REGION_CODE;
  readonly countries: CountryISO[] = [
    CountryISO.UnitedStates,
    CountryISO.Canada
  ];
  readonly CountryISO = CountryISO;

  profileId: string;
  brandData: StartBrandFormData = {
    customerFirstName: '',
    customerLastName: '',
    customerEmail: '',
    customerPhone: {},
    street: '',
    city: '',
    region: '',
    postalCode: '',
    isoCountry: ''
  };
  shouldUpdate = false;
  creating = false;
  @Output() cancelled = new EventEmitter();
  @Output() created = new EventEmitter();

  constructor(
    private smsService: SmsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.profile$.subscribe((profile) => {
      if (profile._id) {
        this.profileId = profile._id;
        const firstName = (profile.user_name || '').split(' ')[0] || '';
        const lastName = (profile.user_name || '').split(' ')[1] || '';
        const { twilio_brand_info } = this.userService.garbage.getValue() || {};
        this.brandData.customerFirstName =
          twilio_brand_info?.['requestInfo']?.customerFirstName || firstName;
        this.brandData.customerLastName =
          twilio_brand_info?.['requestInfo']?.customerLastName || lastName;
        this.brandData.customerEmail =
          twilio_brand_info?.['requestInfo']?.customerEmail || profile.email;
        this.shouldUpdate = !!Object.keys(
          twilio_brand_info?.['requestInfo'] || {}
        ).length;
      }
    });
  }

  createBrand(): void {
    if (this.shouldUpdate) {
      const brandData = {
        ...this.brandData,
        customerPhone: this.brandData.customerPhone.e164Number
      };
      this.creating = true;
      this.smsService.updateStarterBrand(brandData).subscribe(() => {
        this.creating = false;
        this.created.emit();
      });
      return;
    }

    const brandData = {
      ...this.brandData,
      customerPhone: this.brandData.customerPhone.e164Number
    };
    this.creating = true;
    this.smsService.createStarterBrand(brandData).subscribe(() => {
      this.creating = false;
      this.created.emit();
    });
  }

  cancelForm(): void {
    this.cancelled.emit();
  }
}
