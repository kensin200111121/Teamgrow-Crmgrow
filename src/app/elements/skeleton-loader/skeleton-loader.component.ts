import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss']
})
export class SkeletonLoaderComponent implements OnInit {
  @Input() radius = '6px';
  @Input() height = '30px';
  @Input() width = '100%';

  constructor() {}

  ngOnInit(): void {}
}
