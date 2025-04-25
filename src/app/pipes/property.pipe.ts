import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'property_format'
})
export class PropertyPipe implements PipeTransform {
  transform(property: any): string {
    let message = '';

    if (property.price) {
      message = `${message} $${_.toNumber(property.price) / 1000}k - `;
    }

    if (property.type) {
      message = `${message} ${property.type}`;
    }

    if (property.bedrooms) {
      message = `${message} ${property.bedrooms} Beds`;
    }

    if (property.bathrooms) {
      message = `${message} ${property.bathrooms} Baths`;
    }

    if (property.area) {
      message = `${message}, Area ${property.area}`;
    }

    return message;
  }
}
