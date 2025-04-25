import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    try {
      const origin = parseFloat(value + '');
      if (origin === 0) {
        return 'IMMEDIATELY';
      }
      if (origin < 1) {
        return (origin * 60).toFixed(0) + ' MINS';
      }
      if (origin < 24) {
        return origin + ' HOURS';
      } else {
        return origin / 24 + ' DAYS';
      }
    } catch (error) {
      return '0';
    }
  }
}
