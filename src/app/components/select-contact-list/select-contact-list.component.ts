import {
  Component,
  OnInit,
  Input,
  ViewChild,
  OnDestroy,
  Output,
  EventEmitter,
  AfterViewInit,
  TemplateRef
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subject, ReplaySubject } from 'rxjs';
import { Contact } from '@models/contact.model';
import { MatSelect } from '@angular/material/select';
import * as _ from 'lodash';
@Component({
  selector: 'app-select-contact-list',
  templateUrl: './select-contact-list.component.html',
  styleUrls: ['./select-contact-list.component.scss']
})
export class SelectContactListComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  protected _onDestroy = new Subject<void>();

  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('selector') selector: MatSelect;
  filteredResults: ReplaySubject<Contact[]> = new ReplaySubject<Contact[]>(1);
  private _isViewInited = false;

  @Output() onSelect = new EventEmitter();
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Select contact';

  private _contacts: Contact[] = [];
  @Input()
  set contacts(val: Contact[]) {
    this._contacts = val;
    this.filteredResults.next(val);
    this.updateFormControlValue(this.value);
  }
  get contacts() {
    return this._contacts;
  }

  private _value: string;
  @Input()
  public set value(val: string) {
    if (this._value !== val) {
      this._value = val;
      this.updateFormControlValue(val);
    }
  }
  get value(): string {
    return this._value;
  }

  constructor() {}

  ngOnInit(): void {
    this.formControl.valueChanges.subscribe((val) => {
      this.onSelect.emit(val);
    });
  }

  closePopups(): void {
    if (this.selector) {
      this.selector.close();
    }
  }

  ngAfterViewInit(): void {
    this.selector._positions = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
      }
    ];
    this._isViewInited = true;
    this.updateFormControlValue(this.value);
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  private updateFormControlValue(val: string): void {
    if (!this._isViewInited) {
      return;
    }
    const index = this.contacts.findIndex((e) => e._id === val);
    if (index === -1) {
      this.formControl.setValue(null, { emitEvent: true });
    } else {
      this.formControl.setValue(this.contacts[index], { emitEvent: true });
    }
  }

  cancelSelect(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.onSelect.emit(null);
  }
}
