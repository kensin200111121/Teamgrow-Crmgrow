import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit, OnDestroy {
  constructor() {}

  ngOnInit(): void {
    // Add class for the topbar
    document.body.classList.add('has-topbar');
  }

  ngOnDestroy(): void {
    // Remove class that means the body has topbar
    document.body.classList.remove('has-topbar');
  }
}
