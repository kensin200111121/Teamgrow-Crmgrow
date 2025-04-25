import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {
  isSspa = environment.isSspa;
  @Output() changeTab = new EventEmitter();
  constructor() {}
  ngOnInit(): void {}
  onChangeTab($event: any) {
    this.changeTab.emit($event);
  }
}
