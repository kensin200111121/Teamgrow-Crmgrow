import { SspaService } from '../../services/sspa.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LandingPage } from '@app/core/interfaces/resources.interface';
import { LandingPageService } from '@app/services/landing-page.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-landing-page-browser',
  templateUrl: './landing-page-browser.component.html',
  styleUrls: ['./landing-page-browser.component.scss']
})
export class LandingPageBrowserComponent implements OnInit {
  isLoading = false;
  landingPages = [];
  selection: string[] = [];

  @Input() set setSelection(data: LandingPage[]) {
    this.selection = (data ?? []).map((item) => item._id);
  }
  @Output() onChangeSelect = new EventEmitter<string[]>();
  @Input() multiple;
  @Input() hideLandingPageItems;

  constructor(
    private landingPageService: LandingPageService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.landingPageService.loadPublishedPages().subscribe((data) => {
      if (data.status) {
        //TO-DO replace correct API
        this.landingPages = (data.data || []).filter(
          (item: LandingPage) => !this.hideLandingPageItems.includes(item._id)
        );
        this.isLoading = false;
      }
    });
  }

  toggleSelect(): void {
    this.onChangeSelect.emit();
  }

  isSelected(element: any): boolean {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      return true;
    } else {
      return false;
    }
  }

  isAllSelected(): boolean {
    const filteredIds = [];
    this.landingPages.forEach((e) => {
      filteredIds.push(e._id);
    });
    const selectedMaterials = _.intersection(this.selection, filteredIds);
    return (
      this.landingPages.length &&
      selectedMaterials.length === this.landingPages.length
    );
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.landingPages.forEach((e) => {
        const pos = this.selection.indexOf(e._id);
        if (pos !== -1) {
          this.selection.splice(pos, 1);
        }
      });
    } else {
      this.landingPages.forEach((e) => {
        const pos = this.selection.indexOf(e._id);
        if (pos === -1) {
          this.selection.push(e._id);
        }
      });
    }

    const selectedItems = this.landingPages.filter((item) =>
      this.selection.includes(item._id)
    );
    this.onChangeSelect.emit(selectedItems);
  }

  clearSelection(): void {
    this.selection = [];
    this.onChangeSelect.emit([]);
  }

  toggleElement(element: LandingPage): void {
    const data = [...this.selection];
    const pos = data.indexOf(element._id);
    if (pos !== -1) {
      data.splice(pos, 1);
    } else {
      data.push(element._id);
    }
    const selectedItems = this.landingPages.filter((item) =>
      data.includes(item._id)
    );
    this.onChangeSelect.emit(selectedItems);
  }
}
