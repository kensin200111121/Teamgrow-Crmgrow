import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment-timezone';

@Pipe({
  name: 'timeWithProfile'
})
export class TimeWithProfilePipe implements PipeTransform {
  transform(value: Date | string, format: string): string {
    return moment.tz(value, moment()['_z']?.name).format(format || 'hh:mm A');
  }
}
