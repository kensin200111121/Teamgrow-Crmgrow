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
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import * as _ from 'lodash';
@Component({
  selector: 'app-label-select',
  templateUrl: './label-select.component.html',
  styleUrls: ['./label-select.component.scss']
})
export class LabelSelectComponent implements OnInit, AfterViewInit {
  @Input()
  public set value(val: string) {
    if (typeof val !== 'undefined') {
      const labels = this.sharedWith?.length ? this.labelService.sharedLabels.getValue()[this.sharedWith] : this.labelService.allLabels.getValue();
      if (labels?.length) {
        const selected = _.find(labels, (e) => e._id === val);
        this.label = selected && selected._id ? selected._id : '';
        this.formControl.setValue(selected, { emitEvent: false });
      } else {
        this.label = val;
      }
    } else if (this.hasKeepLabel) {
      this.formControl.setValue('keep');
      this.label = '';
    }
  }
  @Output() valueChange = new EventEmitter();
  @Input('title') title = '';
  @Input('type') type = ''; // form style input
  @Input('defaultLabel') defaultLabel = 'No Status'; // default label input.
  @Input('hasKeepLabel') hasKeepLabel = false;
  @Input() disabled = false;
  @Input('sharedWith') sharedWith = '';
  @Input('user') user = '';
  @Input('placement') placement = 'left';
  @Input('isHideLabel') isHideLabel = true;
  @Input('isOutline') isOutline = false;
  @Output() clearLabel = new EventEmitter();
  @ViewChild('selector') selector: MatSelect;
  @ViewChild('auto') autoComplete: MatAutocomplete;
  @ViewChild('inputField') trigger: ElementRef;
  @ViewChild(MatAutocompleteTrigger)
  autocompleteTrigger: MatAutocompleteTrigger;
  label = '';
  formControl: UntypedFormControl = new UntypedFormControl();
  constructor(public labelService: LabelService) {}

  ngOnInit(): void {
    if (this.hasKeepLabel) {
      this.label = undefined;
    }
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

    if(this.sharedWith?.length){
      this.labelService.sharedLabels$.subscribe((res) => {
        this.setLabel(res[this.sharedWith]);
      });
    }else{
      this.labelService.allLabels$.subscribe((res) => {
        this.setLabel(res);
      });
    }
  }

  setLabel(labels: any[]): void {
    if (typeof this.label !== 'undefined') {
      const value = _.find(labels, (e) => e._id === this.label);
      this.formControl.setValue(value, { emitEvent: false });
    } else {
      this.formControl.setValue('keep', { emitEvent: false });
    }
  }

  onChangeLabel(event: MatAutocompleteSelectedEvent): void {}

  ngAfterViewInit(): void {}

  focusField(): void {
    if (!this.disabled) {
      this.trigger.nativeElement.focus();
      this.trigger.nativeElement.blur();
    }
  }

  /**
   * Open Manage Label Panel
   */
  openManageLabel(): void {
    this.trigger.nativeElement.blur();
    this.labelService.manageLabel.next(true);
  }

  closePopups() {
    if (this.autocompleteTrigger && this.autocompleteTrigger.panelOpen) {
      this.autocompleteTrigger.closePanel();
    }
  }
}
