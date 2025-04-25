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
import { MatTabChangeEvent } from '@angular/material/tabs';
import { TabItem } from '@utils/data.types';
import * as _ from 'lodash';

@Component({
  selector: 'app-slide-tab',
  templateUrl: './slide-tab.component.html',
  styleUrls: ['./slide-tab.component.scss']
})
export class SlideTabComponent implements OnInit {
  @Input('onlyEmit') onlyEmitOnChange = false;
  @Input('tabs') tabs: TabItem[] = [];
  @Input('disableTabs') disableTabs: TabItem[] = [];
  @Input('selected')
  public set selected(val: TabItem) {
    this._selected = val;
    this.initTab();
  }
  @Input('type') type = '';
  @Input('method') method = '';
  @Input('class') class = '';
  @Input() viewMode: 'normal' | 'colorful' = 'normal';
  @Output() onChange = new EventEmitter();
  @ViewChild('container') container: ElementRef;
  @ViewChild('indicator') indicator: ElementRef;
  tabIndicatorPos = { x: 0, width: 0 };

  _selected: TabItem;
  selectedTabIndex = 0;
  constructor() {}

  ngOnInit(): void {}

  // added by sylla
  ngOnChanges(changes): void {
    if (changes.tabs) {
      const tabIndex = _.findIndex(this.tabs, { id: this._selected.id });
      this.selectedTabIndex = tabIndex;
      this.initTab();
    }
  }
  // end by sylla

  ngAfterViewChecked(): void {
    this.initTab();
  }

  initTab(): void {
    if (this._selected) {
      const tabIndex = _.findIndex(this.tabs, { id: this._selected.id });
      if (this.tabs.length < 5 && this.container) {
        const children = this.container.nativeElement.children[tabIndex + 1];
        if (children) {
          const tabBound =
            this.container.nativeElement.children[
              tabIndex + 1
            ].getBoundingClientRect();
          const wrapper = this.container.nativeElement.getBoundingClientRect();
          this.indicator.nativeElement.style.left =
            Math.floor(tabBound.x - wrapper.x - 1) + 'px';
          this.indicator.nativeElement.style.width =
            Math.floor(tabBound.width) + 'px';
        }
      }
    }
  }

  changeTab(event: Event, item: TabItem): void {
    if (!this.onlyEmitOnChange) {
      const tabBound = (<HTMLElement>event.target)
        .closest('.tab')
        .getBoundingClientRect();
      const wrapper = this.container.nativeElement.getBoundingClientRect();
      this.indicator.nativeElement.style.left =
        Math.floor(tabBound.x - wrapper.x - 1) + 'px';
      this.indicator.nativeElement.style.width =
        Math.floor(tabBound.width) + 'px';
    }
    this.onChange.emit(item);
  }

  selectedTabChange(event: MatTabChangeEvent): void {
    const index = this.tabs.findIndex((e) => e.id === event.tab.textLabel);
    if (index !== -1) {
      this.onChange.emit(this.tabs[index]);
    }
  }

  isDisableTab(tab): boolean {
    if (tab.id) {
      const index = this.disableTabs.findIndex((item) => item.id === tab.id);
      if (index >= 0) {
        return true;
      }
    }
    return false;
  }
}
