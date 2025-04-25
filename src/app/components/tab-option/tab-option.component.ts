import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TabOption } from '@utils/data.types';

@Component({
  selector: 'app-tab-option',
  templateUrl: './tab-option.component.html',
  styleUrls: ['./tab-option.component.scss']
})
export class TabOptionComponent implements OnInit {
  @Input('options') options: TabOption[] = [];
  @Input() value = ''; //corresponds to value of TabOption
  @Output() valueChange = new EventEmitter<TabOption>();

  constructor() {}

  ngOnInit(): void {}

  changeOption(option: TabOption): void {
    this.valueChange.emit(option);
  }
}
