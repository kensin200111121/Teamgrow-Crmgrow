import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss']
})
export class LoadingOverlayComponent implements OnInit {
  @Input('status') status = '';
  @Input('type') type = '';

  defaultPage = {
    title: '',
    meta: {
      title: '',
      description: '',
      image: ''
    }
  };

  constructor() {}

  ngOnInit() {}

  smallItems = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
}
