import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { orderOriginal, REGIONS } from '@app/constants/variable.constants';
import { ContactService } from '@app/services/contact.service';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';

@Component({
  selector: 'app-address-input',
  templateUrl: './address-input.component.html'
})
export class AddressInputComponent implements OnInit, OnDestroy {
  COUNTRY_REGIONS: any[] = [];
  LOCATION_COUNTRIES = ['US'];
  orderOriginal = orderOriginal;
  DefaultCountryStates = REGIONS;
  COUNTRIES: { code: string; name: string }[] = [];

  _address: Record<string, any> = {};

  @Input() key: number;
  @Input()
  set address(val: Record<string, any>) {
    this._address = val;
  }
  @Output() addressChange: EventEmitter<Record<string, any>> =
    new EventEmitter();

  @ViewChild('cityplacesRef') cityPlaceRef: GooglePlaceDirective;
  @ViewChild('addressplacesRef') addressPlacesRef: GooglePlaceDirective;

  constructor(private contactService: ContactService) {
    this.COUNTRIES = this.contactService.COUNTRIES;
    this.COUNTRY_REGIONS = this.contactService.COUNTRY_REGIONS;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  handleAddressChange(evt: any): void {
    this._address.street = '';
    for (const component of evt.address_components) {
      if (!component['types']) {
        continue;
      }
      if (component['types'].indexOf('street_number') > -1) {
        this._address.street = component['long_name'] + ' ';
      }
      if (component['types'].indexOf('route') > -1) {
        this._address.street += component['long_name'];
      }
      if (component['types'].indexOf('administrative_area_level_1') > -1) {
        this._address.state = component['long_name'];
      }
      if (
        component['types'].indexOf('sublocality_level_1') > -1 ||
        component['types'].indexOf('locality') > -1
      ) {
        this._address.city = component['long_name'];
      }
      if (component['types'].indexOf('postal_code') > -1) {
        this._address.zip = component['long_name'];
      }
      if (component['types'].indexOf('country') > -1) {
        this._address.country = component['short_name'];
      }
    }
    this.addressChange.emit(this._address);
  }

  setContactStates(): void {
    this.addressPlacesRef.options.componentRestrictions.country =
      this._address.country;
    this.cityPlaceRef.options.componentRestrictions.country =
      this._address.country;
    this.cityPlaceRef.reset();
    this.addressPlacesRef.reset();
    this.addressChange.emit(this._address);
  }
}
