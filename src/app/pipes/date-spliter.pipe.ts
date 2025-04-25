import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment-timezone';

@Pipe({
  name: 'dateSpliter'
})
export class DateSpliterPipe implements PipeTransform {
  transform(value: string | number | Date, format: string): string {
    let input;
    try {
      if (value instanceof Date) {
        input = value;
      }
      input = new Date(value);
      const todayString = moment().startOf('day').format('YYYY-MM-DD');
      const yesterdayString = moment()
        .subtract(1, 'day')
        .startOf('day')
        .format('YYYY-MM-DD');
      const inputString = moment(input).startOf('day').format('YYYY-MM-DD');
      if (todayString === inputString) {
        return 'Today';
      } else if (inputString === yesterdayString) {
        return 'Yesterday';
      } else {
        return new DatePipe('en').transform(input, format);
      }
    } catch (err) {
      return '';
    }
  }
}
