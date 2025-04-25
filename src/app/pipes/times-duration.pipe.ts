import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timesDuration'
})
export class TimesDurationPipe implements PipeTransform {
  transform(value: string[]): string {
    var result =
      (new Date(value[1]).getTime() - new Date(value[0]).getTime()) / 60000 +
      '';
    return result;
  }
}
