import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import * as _ from 'lodash';
import { ContactService } from '@services/contact.service';

@Component({
  selector: 'app-input-country',
  templateUrl: './input-country.component.html',
  styleUrls: ['./input-country.component.scss']
})
export class InputCountryComponent implements OnInit {
  @Input('selectedCountries') selectedCountries: string[] = [];
  @Output() onSelect = new EventEmitter();

  // COUNTRIES = COUNTRIES;
  COUNTRIES: any[];
  allCountries: any[];
  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  constructor(private contactService: ContactService) {
    this.allCountries = this.contactService.COUNTRIES;
  }

  ngOnInit(): void {
    this.loadCountries();
  }

  remove(country: string): void {
    _.remove(this.selectedCountries, (e) => {
      return e === country;
    });
    this.loadCountries();
    this.onSelect.emit();
  }

  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const country = evt.option.value;
    const index = _.findIndex(this.selectedCountries, function (e) {
      return e === country;
    });
    if (index === -1) {
      this.selectedCountries.push(country);
    }
    this.loadCountries();
    this.inputField.nativeElement.value = '';
    this.formControl.setValue(null);
    this.onSelect.emit();
  }

  loadCountries(): void {
    this.COUNTRIES = [];
    if (this.selectedCountries.length) {
      this.allCountries.forEach((country) => {
        const index = this.selectedCountries.indexOf(country.code);
        if (index === -1) {
          this.COUNTRIES.push(country);
        }
      });
    } else {
      this.COUNTRIES = this.allCountries;
    }
  }
}
