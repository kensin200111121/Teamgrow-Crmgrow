import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-task-type',
  templateUrl: './task-type.component.html',
  styleUrls: ['./task-type.component.scss']
})
export class TaskTypeComponent implements OnInit {
  @Input() value: string;
  @Output() valueChange = new EventEmitter<string>();
  readonly USER_FEATURES = USER_FEATURES;
  isSspa = environment.isSspa;

  constructor() {}

  ngOnInit(): void {}

  updateValue(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
  }
}
