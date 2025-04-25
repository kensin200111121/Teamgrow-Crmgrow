import { Pipe, PipeTransform } from '@angular/core';
import { parsePhoneNumber } from 'libphonenumber-js/min';
const { phone } = require('phone');

@Pipe({
  name: 'phone_format'
})
export class PhonePipe implements PipeTransform {
  transform(value: string): string {
    const fPhone = phone(value);
    if (!fPhone.length) {
      return value;
    } else {
      const phoneNumber = parsePhoneNumber(fPhone[0]);
      const result = phoneNumber.formatNational();
      return result;
    }
  }
}
