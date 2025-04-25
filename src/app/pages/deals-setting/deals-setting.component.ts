import { Component, OnInit } from '@angular/core';
import { DealsService } from '@services/deals.service';
import { Subscription } from 'rxjs';
import { UserService } from '@app/services/user.service';
import { TabItem } from '@app/utils/data.types';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environment';
@Component({
  selector: 'app-deals-setting',
  templateUrl: './deals-setting.component.html',
  styleUrls: ['./deals-setting.component.scss']
})
export class DealsSettingComponent implements OnInit {
  isSspa = environment.isSspa;
  tabs: TabItem[] = [
    { id: 'preference', icon: '', label: 'Stages & Automation Preferences' },
    { id: 'custom-fields', icon: '', label: 'Custom Deal Fields' }
  ];
  selectedTab: TabItem = this.tabs[0];
  private _routeChangeSubscription: Subscription;

  constructor(
    public dealsService: DealsService,
    private router: Router,
    private route: ActivatedRoute,
    protected userService: UserService
  ) {}

  ngOnInit(): void {
    this._routeChangeSubscription = this.route.params.subscribe((params) => {
      let tabIndex = this.tabs.findIndex((tab) => tab.id === params['page']);
      if (tabIndex === -1) tabIndex = 0;
      this.selectedTab = this.tabs[tabIndex];
    });
  }

  ngOnDestroy(): void {
    this._routeChangeSubscription &&
      this._routeChangeSubscription.unsubscribe();
  }
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.router.navigate(['pipeline/pipeline-manager/' + tab.id]);
  }

  back(): void {
    this.router.navigate(['pipeline']);
  }
}
