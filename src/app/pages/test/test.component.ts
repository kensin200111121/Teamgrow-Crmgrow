import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { PhoneInputComponent } from '@components/phone-input/phone-input.component';
import { PHONE_COUNTRIES } from '@constants/variable.constants';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {
  COUNTRIES = PHONE_COUNTRIES;
  phoneNumber: any = '+61212345678';
  timezone = 'America/New_York';
  @ViewChild('phoneControl') phoneControl: PhoneInputComponent;
  phoneForm: UntypedFormControl = new UntypedFormControl();

  constructor() {}

  ngOnInit(): void {}

  changePhoneNumber(event) {
    console.log('evnet', event);
  }
}
