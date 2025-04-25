import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import {
  CONTINENT_TIMEZONES,
  TIME_ZONE_NAMES
} from '@constants/variable.constants';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import moment from 'moment-timezone';
import { MatSelect } from '@angular/material/select';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-select-timezone',
  templateUrl: './select-timezone.component.html',
  styleUrls: ['./select-timezone.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectTimezoneComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: SelectTimezoneComponent,
      multi: true
    }
  ]
})
export class SelectTimezoneComponent implements OnInit, ControlValueAccessor {
  @ViewChild(MatSelect) matDropdown: MatSelect;
  @ViewChild(NgbDropdown) ngbDropdown: NgbDropdown;
  readonly TIME_ZONES = CONTINENT_TIMEZONES;
  readonly TIME_ZONE_NAMES = TIME_ZONE_NAMES;
  ADDITIONAL_TIMEZONE: string; // This is the additional timezone that is not registered in our variables.
  @Input() uiType = 'selector';
  @Input() set disable(val: boolean) {
    this.disabled = val;
  }
  @Input() set timezone(tz_name: string) {
    let timezone;
    if (tz_name) {
      try {
        const timezoneObj = JSON.parse(tz_name);
        timezone = timezoneObj.tz_name;
      } catch (err) {
        timezone = tz_name;
      }
    }
    // else {
    //   timezone = moment()['_z']?.name || moment.tz.guess();
    //   this.timezoneChange.emit(timezone);
    // }
    if (!Object.keys(TIME_ZONE_NAMES).includes(timezone)) {
      this.ADDITIONAL_TIMEZONE = timezone;
    }
    this.value = timezone;
  }

  @Output() timezoneChange = new EventEmitter<string>();

  value: string;

  onChange = (timezone: string) => {};

  onTouched = () => {};

  touched = false;

  disabled = false;

  constructor() {}

  writeValue(timezone: string): void {
    this.value = timezone;
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnInit(): void {}

  closePopups(): void {
    if (this.matDropdown) {
      this.matDropdown.close();
    }
    if (this.ngbDropdown) {
      this.ngbDropdown.close();
    }
  }

  showLocalTime = (timezone: string) => {
    const currentUtcTime = moment.utc();
    const currentTimeInTargetZone = currentUtcTime.tz(timezone);
    return currentTimeInTargetZone.format('HH:mm');
  };

  selectTimezone(timezone: string): void {
    this.value = timezone;
    this.onChange(timezone);
    this.timezoneChange.emit(timezone);
  }
}
