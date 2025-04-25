import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent implements OnInit {
  @Input('options') options: string[] = [];
  @Input()
  public set value(val: string) {
    if (val) {
      this.form && this.form.reset(val);
      this.originValue = val;
    }
  }
  @Output() onChange = new EventEmitter();
  @Input('class') className: string = '';
  @Input('disabed') disabled: boolean = false;

  public form: UntypedFormControl = new UntypedFormControl('select');
  private originValue: string = '';

  constructor() {}

  ngOnInit(): void {}

  change($event): void {
    const newValue = $event.target.value;
    this.form.reset(this.originValue);
    this.onChange.emit(newValue);
  }
}
