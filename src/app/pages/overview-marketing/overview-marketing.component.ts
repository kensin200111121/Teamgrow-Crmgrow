import { Component, OnInit } from '@angular/core';
import { MaterialService } from '@app/services/material.service';
import { TabItem } from '@utils/data.types';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-overview-marketing',
  templateUrl: './overview-marketing.component.html',
  styleUrls: ['./overview-marketing.component.scss']
})
export class OverviewMarketingComponent implements OnInit {
  isSspa = false;
  tabs: TabItem[] = [
    { label: 'Landing Page', id: 'landing_page', icon: '' },
    { label: 'Lead Form', id: 'lead_form', icon: '' },
    { label: 'Materials', id: 'materials', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  material_sent = 0;
  material_unique_views = 0;
  materials = [];
  materialLoading = false;

  constructor(private materialService: MaterialService) {}

  ngOnInit(): void {
    this.getMaterialActivities();
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
  }

  getMaterialActivities() {
    const duration = 30;
    this.materialLoading = true;
    this.materialService.activities(duration).subscribe((res) => {
      if (res) {
        const materials = res;
        let sent = 0;
        let unique_views = 0;
        materials.forEach((element) => {
          sent += element.sent;
          unique_views += element.trackers;
        });
        this.material_sent = sent;
        this.material_unique_views = unique_views;
        this.materials = materials.slice(0, 5);
      }
      this.materialLoading = false;
    });
  }
}
