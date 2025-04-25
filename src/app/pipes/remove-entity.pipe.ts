import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeEntity'
})
export class RemoveEntityPipe implements PipeTransform {
  transform(value: string, tag?: string): string {
    const txtDom = document.createElement(tag || 'textarea');
    txtDom.innerHTML = value;
    const res = txtDom.textContent;
    return res;
  }
}
