import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';
import { TabItem } from '@utils/data.types';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-campaign',
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss']
})
export class CampaignComponent implements OnInit, AfterViewInit {
  tabs: TabItem[] = [
    { id: 'bulk', icon: '', label: 'Bulk Mailing' },
    { id: 'templates', icon: '', label: 'Newsletters' },
    { id: 'smtp', icon: '', label: 'Connect Smtp' }
  ];
  selectedTab: TabItem = this.tabs[0];
  defaultPage = 'bulk';

  routeChangeSubscription: Subscription;
  profileSubscription: Subscription;

  loading = false;
  connected = false;

  constructor(
    private location: Location,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentTabId = this.route.snapshot.params['page'] || this.defaultPage;
    const tabIndex = this.tabs.findIndex((tab) => tab.id === currentTabId);
    this.selectedTab = this.tabs[tabIndex];

    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      const currentTabId = params['page'] || this.defaultPage;
      const tabIndex = this.tabs.findIndex((tab) => tab.id === currentTabId);
      this.selectedTab = this.tabs[tabIndex];
    });

    this.loading = true;
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.loading = false;
        this.connected = res.campaign_smtp_connected || false;
        if (!this.connected) {
          this.selectedTab = this.tabs[2];
        }
        this.profileSubscription && this.profileSubscription.unsubscribe();
      }
    });
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.router.navigate(['bulk-mail/' + tab.id]);
    // Set the storage for the active tab
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  onConnect(): void {
    this.connected = true;
  }
  onNewConnect(): void {
    this.connected = false;
  }
}
