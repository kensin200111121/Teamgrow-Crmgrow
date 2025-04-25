import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'makeRedirect'
})
export class MakeRedirectPipe implements PipeTransform {
  transform(value: string): any {
    if (!value) {
      return '';
    }

    let dom = document.createElement('div');
    dom.innerHTML = value;
    dom.querySelectorAll('a').forEach((e) => {
      if (e.href) {
        e.setAttribute('target', '_blank');
      }
    });

    const result = dom.innerHTML;
    dom = undefined;
    return result;
  }
}
