import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'propertySearch_format'
})
export class PropertySearchPipe implements PipeTransform {
  transform(propertySearch: any): string {
    let message = '';

    if (propertySearch.minPrice || propertySearch.maxPrice) {
      const price = propertySearch.minPrice || propertySearch.maxPrice;
      message = `$${_.toNumber(price) / 1000}k - `;
    }

    if (propertySearch.type) {
      message = `${message} ${propertySearch.type}`;
    }

    if (propertySearch.minBedrooms || propertySearch.maxBedrooms) {
      const rooms = propertySearch.maxBedrooms || propertySearch.minBedrooms;
      message = `${message} ${rooms} Beds`;
    }

    if (propertySearch.minBathrooms || propertySearch.maxBathrooms) {
      const rooms = propertySearch.maxBathrooms || propertySearch.minBathrooms;
      message = `${message} ${rooms} Baths`;
    }

    if (propertySearch.city || propertySearch.state) {
      message = `${message} Address ${propertySearch.city} ${propertySearch.state}`;
    }

    return message;
  }
}
