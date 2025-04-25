import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment-timezone';

@Pipe({
  name: 'datetimeFormat'
})
export class DatetimeFormatPipe implements PipeTransform {
  transform(dateString: string, _format?: any): any {
    let returnDateString = '';
    if (dateString) {
      const returnDate = new Date(dateString);
      if (_format) {
        if (_format === 'mediumDate') _format = 'MMM DD, YYYY';
        returnDateString = moment(returnDate).format(_format);
      } else {
        const now = new Date();
        const thisYear = now.getFullYear().toString();
        const dateYear = moment(returnDate).format('YYYY');
        if (thisYear !== dateYear) {
          returnDateString = moment(returnDate).format('MMM DD,YYYY, hh:mm A');
        } else {
          returnDateString = moment(returnDate).format('MMM DD, hh:mm A');
        }
      }
    }
    return returnDateString;
  }
}
