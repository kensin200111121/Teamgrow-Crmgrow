import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment-timezone';

@Pipe({
  name: 'timezone'
})
export class TimezonePipe implements PipeTransform {
  transform(value: any, ...args: any): unknown {
    if (value) {
      let date;
      if (value instanceof Date) {
        date = value;
      } else {
        date = new Date(value);
      }
      if (!args || !args.length) {
        return date.toLocaleString();
      }
      if (args[0].tz_name) {
        return moment(date)
          .tz(args[0].tz_name)
          .format(args[1] || 'MMM D YYYY, hh:mm A');
      } else if (args[0].zone) {
        const zone = args[0].zone.replace(':', '');
        return moment(date)
          .zone(zone)
          .format(args[1] || 'MMM D YYYY, hh:mm A');
      } else {
        return date.toLocaleString();
      }
    } else {
      return '';
    }
  }
}
