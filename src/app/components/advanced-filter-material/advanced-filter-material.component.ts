import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TabItem } from '@utils/data.types';
import {
  SearchOption,
  MaterialCondition
} from '@models/searchOption.model';
import { ContactService } from '@services/contact.service';

@Component({
  selector: 'app-advanced-filter-material',
  templateUrl: './advanced-filter-material.component.html',
  styleUrls: ['./advanced-filter-material.component.scss']
})
export class AdvancedFilterMaterialComponent implements OnInit {
  materialActions = [];
  tabs: TabItem[] = [
    { label: 'Normal', id: 'normal', icon: '' },
    { label: 'Team', id: 'team', icon: '' }
  ];
  selectedMaterialActions = '';
  selectedMaterial = [];
  selectedTab: TabItem = this.tabs[0];
  searchOption: SearchOption = new SearchOption();
  @Output() filter = new EventEmitter();
  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.materialActions = [
      {
        _id: 1,
        title: 'Material sent',
        count: 0
      },
      {
        _id: 2,
        title: 'No material sent',
        count: 0
      },
      {
        _id: 3,
        title: 'Material reviewed',
        count: 0
      },
      {
        _id: 4,
        title: 'Material not reviewed',
        count: 0
      }
    ];

    this.searchOption = this.contactService.searchOption.getValue();
    if (this.searchOption.materialCondition.sent_video.flag == true)
      this.selectedMaterialActions = 'Material sent';
    if (this.searchOption.materialCondition.not_sent_video.flag == true)
      this.selectedMaterialActions = 'No material sent';
    if (this.searchOption.materialCondition.watched_video.flag == true)
      this.selectedMaterialActions = 'Material reviewed';
    if (this.searchOption.materialCondition.not_watched_video.flag == true)
      this.selectedMaterialActions = 'Material not reviewed';
  }

  enableTeamSearchOption(): boolean {
    if (Object.keys(this.searchOption.teamOptions).length) {
      return true;
    } else {
      return false;
    }
  }

  selectMaterialAction(title: string): void {
    if (this.selectedMaterialActions == title) {
      this.selectedMaterialActions = '';
      this.selectedMaterial = [];
      this.materialActions.forEach((action) => {
        action.count = 0;
      });
      this.searchOption.materialCondition = new MaterialCondition();
    } else {
      this.selectedMaterialActions = title;
      this.materialActions.forEach((action) => {
        action.count = 0;
      });
      this.searchOption.materialCondition = new MaterialCondition();
      if (title === 'Material sent') {
        this.searchOption.materialCondition.sent_video.flag = true;
        this.searchOption.materialCondition.sent_pdf.flag = true;
        this.searchOption.materialCondition.sent_image.flag = true;
      } else if (title === 'No material sent') {
        this.searchOption.materialCondition.not_sent_video.flag = true;
        this.searchOption.materialCondition.not_sent_pdf.flag = true;
        this.searchOption.materialCondition.not_sent_image.flag = true;
      } else if (title === 'Material reviewed') {
        this.searchOption.materialCondition.watched_video.flag = true;
        this.searchOption.materialCondition.watched_pdf.flag = true;
        this.searchOption.materialCondition.watched_image.flag = true;
      } else if (title === 'Material not reviewed') {
        this.searchOption.materialCondition.not_watched_video.flag = true;
        this.searchOption.materialCondition.not_watched_pdf.flag = true;
        this.searchOption.materialCondition.not_watched_image.flag = true;
      }
    }
  }

  save(): void {
    this.filter.emit({
      materialCondition: this.searchOption.materialCondition
    });
  }
}
