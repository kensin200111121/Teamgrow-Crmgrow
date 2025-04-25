import { Pipe, PipeTransform } from '@angular/core';
import { convertIdToUrlOnSMS } from '@app/utils/functions';

@Pipe({
  name: 'convertIdToUrl'
})
export class ConvertIdToUrlPipe implements PipeTransform {
  transform(content: string): string {
    return convertIdToUrlOnSMS(content);
  }
}
