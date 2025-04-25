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
import { REGIONS } from '@constants/variable.constants';
import * as _ from 'lodash';
import { ContactService } from '@services/contact.service';

@Component({
  selector: 'app-input-state',
  templateUrl: './input-state.component.html',
  styleUrls: ['./input-state.component.scss']
})
export class InputStateComponent implements OnInit {
  @Input('selectedRegions') selectedRegions: string[] = [];
  @Input('selectedCountries') selectedCountries: string[] = [];
  @Output() onSelect = new EventEmitter();

  // COUNTRY_REGIONS = REGIONS;
  COUNTRY_REGIONS: any[] = [];
  formControl: UntypedFormControl = new UntypedFormControl();
  inputVal = '';
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('auto') autoComplete: MatAutocomplete;

  constructor(public contactService: ContactService) {}

  ngOnInit(): void {
    this.COUNTRY_REGIONS = this.contactService.COUNTRY_REGIONS;
    if (this.selectedCountries.length === 0) {
      this.selectedCountries = ['US'];
    }
  }

  remove(region: string): void {
    _.remove(this.selectedRegions, (e) => {
      return e === region;
    });
    this.onSelect.emit();
  }

  clickEnterKey($event): void {
    const region =
      this.inputVal.slice(0, 1).toUpperCase() + this.inputVal.slice(1);
    if (region) {
      const index = _.findIndex(this.selectedRegions, function (e) {
        return e === region;
      });
      if (index === -1) {
        this.selectedRegions.push(region);
      }
      this.inputField.nativeElement.value = '';
      this.formControl.setValue(null);
      this.onSelect.emit();
    }
  }

  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const region = evt.option.value;
    const index = _.findIndex(this.selectedRegions, function (e) {
      return e === region;
    });
    if (index === -1) {
      this.selectedRegions.push(region);
    }
    this.inputField.nativeElement.value = '';
    this.formControl.setValue(null);
    this.onSelect.emit();
  }
}
