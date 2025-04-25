import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { LabelService } from '@services/label.service';
import { Label } from '@models/label.model';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import * as _ from 'lodash';

@Component({
  selector: 'app-input-label',
  templateUrl: './input-label.component.html',
  styleUrls: ['./input-label.component.scss']
})
export class InputLabelComponent implements OnInit, AfterViewInit {
  @Input()
  public set value(val: string) {
    if (typeof val !== 'undefined') {
      const labels = this.labelService.allLabels.getValue();
      if (labels.length) {
        const selected = _.find(labels, (e) => e._id === val);
        this.label = selected && selected._id ? selected._id : '';
        this.formControl.setValue(selected, { emitEvent: false });
      } else {
        this.label = val;
      }
    }
  }
  @Output() valueChange = new EventEmitter();
  @Input('type') type = ''; // form style input
  @Input('defaultLabel') defaultLabel = 'No Status'; // default label input.
  @Input('hasKeepLabel') hasKeepLabel = false;
  @Input('sharedWith') sharedWith = '';
  @Input('user') user = '';
  @Input('labels') labels: Label[] = [];
  @Output() clearLabel = new EventEmitter();
  @ViewChild('selector') selector: MatSelect;
  @ViewChild('auto') autoComplete: MatAutocomplete;
  @ViewChild('inputField') trigger: ElementRef;

  sharedLabels = [];
  label = '';
  formControl: UntypedFormControl = new UntypedFormControl();
  constructor(public labelService: LabelService) {}

  ngOnInit(): void {
    if (this.hasKeepLabel) {
      this.label = undefined;
    }
    this.labelService.allLabels$.subscribe((res) => {
      if (typeof this.label !== 'undefined') {
        const value = _.find(res, (e) => e._id === this.label);
        this.formControl.setValue(value, { emitEvent: false });
      } else {
        this.formControl.setValue('keep', { emitEvent: false });
      }
    });

    this.formControl.valueChanges.subscribe((value) => {
      if (value === 'keep') {
        this.clearLabel.emit();
        this.formControl.setValue('keep', { emitEvent: false });
        return;
      }
      if (value && value._id) {
        this.label = value._id;
        this.valueChange.emit(value._id);
      } else {
        this.label = '';
        this.valueChange.emit('');
      }
    });
  }

  onChangeLabel(event: MatAutocompleteSelectedEvent): void {}

  ngAfterViewInit(): void {}

  focusField(): void {
    this.trigger.nativeElement.focus();
    this.trigger.nativeElement.blur();
  }

  /**
   * Open Manage Label Panel
   */
  openManageLabel(): void {
    this.trigger.nativeElement.blur();
    this.labelService.manageLabel.next(true);
  }
}
