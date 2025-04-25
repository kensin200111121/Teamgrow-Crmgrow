import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'name'
})
export class NamePipe implements PipeTransform {
  transform(values: string[], unnamed: string = 'Unnamed Contact'): string {
    const [firstName, lastName] = values;
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return unnamed;
  }
}
