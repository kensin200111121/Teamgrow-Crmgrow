import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SmsService } from '@services/sms.service';
import { StandardBrand } from '@utils/data.types';

@Component({
  selector: 'app-standard-brand',
  templateUrl: './standard-brand.component.html',
  styleUrls: ['./standard-brand.component.scss']
})
export class StandardBrandComponent implements OnInit {
  brandData: StandardBrand = {
    companyName: '',
    companyEmail: '',
    businessName: '',
    businessProfileUrl: '',
    businessWebsite: '',
    businessRegion: '',
    businessType: '',
    businessIdentifier: '',
    businessIdentity: '',
    businessIndustry: '',
    businessNumber: '',
    firstMemberPosition: '',
    firstMemberFirstName: '',
    firstMemberLastName: '',
    firstMemberPhone: '',
    firstMemberEmail: '',
    firstMemberBusinessTitle: '',
    secondMemberPosition: '',
    secondMemberFirstName: '',
    secondMemberLastName: '',
    secondMemberPhone: '',
    secondMemberEmail: '',
    secondMemberBusinessTitle: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    isoCountry: ''
  };
  creating: boolean = false;
  @Output() cancelled = new EventEmitter();
  @Output() created = new EventEmitter();

  constructor(private smsService: SmsService) {}

  ngOnInit(): void {}

  createBrand(value: StandardBrand): void {
    this.creating = true;
    this.smsService.createStandardBrand(value).subscribe(() => {
      this.creating = false;
      this.created.emit();
    });
  }

  cancelForm(): void {
    this.cancelled.emit();
  }
}
