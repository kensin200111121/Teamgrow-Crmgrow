import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';
import { COUNTRIES } from '@constants/countries.constant';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

interface CountrySetting {
  name: string;
  code: string;
  dialCode: string;
  priority?: number;
  areaCodes: string[];
  format: string;
}

@Component({
  selector: 'app-phone-input',
  templateUrl: './phone-input.component.html',
  styleUrls: ['./phone-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ]
})
export class PhoneInputComponent
  implements OnInit, OnChanges, ControlValueAccessor
{
  COUNTRIES = [];

  @Input() selectedCountry: any = {
    areaCodes: undefined,
    dialCode: '',
    iso2: '',
    name: '',
    placeholder: '',
    priority: 0
  };
  @Input() onlyCountries: string[] = [];
  @Input() enableAutoCountrySelect: boolean = true;
  @Input() cssClass: string = 'form-control';
  @Input() phoneValidation: boolean = true;
  @Input() phoneId = 'phone';
  @Output() countryChange = new EventEmitter();
  @Output() onblur = new EventEmitter();
  @Output() onkeyup = new EventEmitter();
  @Input() separateDialCode: boolean = true;
  @Input() selectedCountryISO: string = '';
  @Input() placeholder: string = '';
  @Input() placeholderVisible: boolean = true;
  separateDialCodeClass: string = '';
  phoneNumber: any;
  value: string;
  phoneUtil = PhoneNumberUtil.getInstance();
  @Input() disabled: boolean = false;
  valid = true;

  @ViewChild('control') control: ElementRef;
  @ViewChildren(NgbDropdown) dropdowns: QueryList<NgbDropdown>;

  constructor() {}

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes): void {
    const selectedISO = changes['selectedCountryISO'];
    if (
      this.COUNTRIES &&
      selectedISO &&
      selectedISO.currentValue !== selectedISO.previouseValue
    ) {
      this.getSelectedCountry();
    }
    this.checkSeparateDialCodeStyle();
  }

  init(): void {
    this.fetchCountryData();
    const countriesTemp = [];
    if (this.onlyCountries.length) {
      this.onlyCountries.forEach((country) => {
        this.COUNTRIES.forEach((c) => {
          if (country === c.iso2) {
            countriesTemp.push(c);
          }
        });
      });
    }
    if (countriesTemp.length > 0) {
      this.COUNTRIES = countriesTemp;
    }
    this.getSelectedCountry();
    this.checkSeparateDialCodeStyle();
  }

  closePopups(): void {
    this.dropdowns.forEach((dropdown) => {
      if (dropdown.isOpen()) {
        dropdown.close();
      }
    });
  }

  onPhoneNumberChange() {
    let countryCode;

    if (this.phoneNumber && typeof this.phoneNumber === 'object') {
      const numberObj = this.phoneNumber;
      this.phoneNumber = numberObj.number;
      countryCode = numberObj.countryCode;
    }

    this.value = this.phoneNumber;
    countryCode = countryCode || this.selectedCountry.iso2.toUpperCase();
    let number;
    try {
      number = this.phoneUtil.parse(this.phoneNumber, countryCode);
    } catch (e) {}

    if (this.enableAutoCountrySelect) {
      countryCode =
        number && number.getCountryCode()
          ? this.getCountryIsoCode(number.getCountryCode(), number)
          : this.selectedCountry.iso2;
      if (countryCode && countryCode !== this.selectedCountry.iso2) {
        const newCountry = this.COUNTRIES.sort((a, b) => {
          return a.priority - b.priority;
        }).find((c) => c.iso2 === countryCode);

        if (newCountry) {
          this.selectedCountry = newCountry;
        }
      }
    }

    countryCode = countryCode ? countryCode : this.selectedCountry.iso2;
    this.checkSeparateDialCodeStyle();
    if (!this.value) {
      this.checkValidate(null);
      this.propagateChange(null);
    } else {
      const intlNo = number
        ? this.phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL)
        : '';
      // parse phoneNumber if separate dial code is needed
      if (this.separateDialCode && intlNo) {
        this.value = this.removeDialCode(intlNo);
      }
      const _formattedData = {
        number: this.value,
        internationalNumber: intlNo,
        nationalNumber: number
          ? this.phoneUtil.format(number, PhoneNumberFormat.NATIONAL)
          : '',
        e164Number: number
          ? this.phoneUtil.format(number, PhoneNumberFormat.E164)
          : '',
        countryCode: countryCode.toUpperCase(),
        dialCode: '+' + this.selectedCountry.dialCode
      };
      this.checkValidate(_formattedData);
      this.propagateChange(_formattedData);
    }
  }

  fetchCountryData() {
    this.COUNTRIES = [];
    COUNTRIES.forEach((c) => {
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
      if(this.placeholderVisible){
        country.placeHolder = this.getPhoneNumberPlaceHolder(
          country.iso2.toUpperCase()
        );
      }
      country.mask = country.placeHolder.replace(/[0-9]/gi, '0');
      this.COUNTRIES.push(country);
    });
  }

  getSelectedCountry() {
    if (this.selectedCountryISO) {
      this.selectedCountry = this.COUNTRIES.find((c) => {
        return c.iso2.toLowerCase() === this.selectedCountryISO.toLowerCase();
      });
      if (this.selectedCountry) {
        if (this.phoneNumber) {
          this.onPhoneNumberChange();
        } else {
          // Reason: avoid https://stackoverflow.com/a/54358133/1617590
          // tslint:disable-next-line: no-null-keyword
          this.checkValidate(null);
          this.propagateChange(null);
        }
      }
    }
  }

  getCountryIsoCode(countryCode, number) {
    // Will use this to match area code from the first numbers
    const rawNumber = number['values_']['2'].toString();
    // List of all countries with countryCode (can be more than one. e.x. US, CA, DO, PR all have +1 countryCode)
    const countries = this.COUNTRIES.filter(
      (c) => c.dialCode === countryCode.toString()
    );
    // Main country is the country, which has no areaCodes specified in country-code.ts file.
    const mainCountry = countries.find((c) => c.areaCodes === undefined);
    // Secondary countries are all countries, which have areaCodes specified in country-code.ts file.
    const secondaryCountries = countries.filter(
      (c) => c.areaCodes !== undefined
    );
    let matchedCountry = mainCountry ? mainCountry.iso2 : undefined;
    /*
        Iterate over each secondary country and check if nationalNumber starts with any of areaCodes available.
        If no matches found, fallback to the main country.
    */
    secondaryCountries.forEach((country) => {
      country.areaCodes.forEach((areaCode) => {
        if (rawNumber.startsWith(areaCode)) {
          matchedCountry = country.iso2;
        }
      });
    });
    return matchedCountry;
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

  onCountrySelect(country, el) {
    this.setSelectedCountry(country);
    this.checkSeparateDialCodeStyle();
    if (this.phoneNumber && this.phoneNumber.length > 0) {
      this.value = this.phoneNumber;
      let number;
      try {
        number = this.phoneUtil.parse(
          this.phoneNumber,
          this.selectedCountry.iso2.toUpperCase()
        );
      } catch (e) {}
      const intlNo = number
        ? this.phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL)
        : '';
      // parse phoneNumber if separate dial code is needed
      if (this.separateDialCode && intlNo) {
        this.value = this.removeDialCode(intlNo);
      }
      const _formattedData = {
        number: this.value,
        internationalNumber: intlNo,
        nationalNumber: number
          ? this.phoneUtil.format(number, PhoneNumberFormat.NATIONAL)
          : '',
        e164Number: number
          ? this.phoneUtil.format(number, PhoneNumberFormat.E164)
          : '',
        countryCode: this.selectedCountry.iso2.toUpperCase(),
        dialCode: '+' + this.selectedCountry.dialCode
      };
      this.checkValidate(_formattedData);
      this.propagateChange(_formattedData);
    } else {
      // Reason: avoid https://stackoverflow.com/a/54358133/1617590
      // tslint:disable-next-line: no-null-keyword
      this.checkValidate(null);
      this.propagateChange(null);
    }
    el.focus();
  }

  removeDialCode(phoneNumber) {
    if (this.separateDialCode && phoneNumber) {
      phoneNumber = phoneNumber.substr(phoneNumber.indexOf(' ') + 1);
    }
    return phoneNumber;
  }

  setSelectedCountry(country) {
    this.selectedCountry = country;
    this.countryChange.emit(country);
  }

  checkSeparateDialCodeStyle() {
    if (this.separateDialCode && this.selectedCountry) {
      const cntryCd = this.selectedCountry.dialCode;
      this.separateDialCodeClass =
        'separate-dial-code iti-sdc-' + (cntryCd.length + 1);
    } else {
      this.separateDialCodeClass = '';
    }
  }

  onInputKeyPress(event) {
    const allowedChars = /[0-9\+\-\ ]/;
    const allowedCtrlChars = /[axcv]/; // Allows copy-pasting
    const allowedOtherKeys = [
      'ArrowLeft',
      'ArrowUp',
      'ArrowRight',
      'ArrowDown',
      'Home',
      'End',
      'Insert',
      'Delete',
      'Backspace'
    ];
    if (
      !allowedChars.test(event.key) &&
      !(event.ctrlKey && allowedCtrlChars.test(event.key)) &&
      !allowedOtherKeys.includes(event.key)
    ) {
      event.preventDefault();
    }
  }

  phoneNumberValidator(value) {
    if (!value) {
      this.valid = false;
      return;
    }
    let number;
    try {
      number = PhoneNumberUtil.getInstance().parse(
        value.number,
        value.countryCode
      );
    } catch (e) {
      this.valid = false;
      return;
    }
    if (
      !PhoneNumberUtil.getInstance().isValidNumberForRegion(
        number,
        value.countryCode
      )
    ) {
      this.valid = false;
      return;
    }
    this.valid = true;
    return;
  }

  checkValidate(value) {
    this.phoneNumberValidator(value);
    if (this.valid) {
      setTimeout(() => {
        this.phoneNumber = value.number;
      }, 5);
    }
  }
  propagateChange(value) {}
  onTouched() {}

  writeValue(obj): void {
    if (obj === undefined) {
      this.init();
    }
    this.phoneNumber = obj;
    setTimeout(() => {
      this.onPhoneNumberChange();
    }, 1);
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onBlur(evt: any): void {
    if (evt) {
      this.onblur.emit(evt);
    }
  }

  keyUp(evt: any): void {
    if (evt) {
      this.onkeyup.emit(evt);
    }
  }
}
