import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-data-empty',
  templateUrl: './data-empty.component.html',
  styleUrls: ['./data-empty.component.scss']
})
export class DataEmptyComponent implements OnInit {

  @Input('type') type = ''

  constructor() { }

  ngOnInit() {
  }

}
