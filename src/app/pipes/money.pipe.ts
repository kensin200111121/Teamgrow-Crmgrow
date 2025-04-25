import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'money'
})
export class MoneyPipe implements PipeTransform {
  transform(value: any, args?: any): string {
    try {
      const origin = parseFloat(value + '');
      const converted = origin / 100;
      if (converted == 0) {
        return '0';
      }
      return converted.toFixed(2);
    } catch (error) {
      return '0';
    }
  }
}
