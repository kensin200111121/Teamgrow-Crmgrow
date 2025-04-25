import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { STATISTICS_DURATION } from '@constants/variable.constants';
import { environment } from '@environments/environment';
import { HandlerService } from '@services/handler.service';
import { DealsService } from '@services/deals.service';
import { TabItem } from '@utils/data.types';
import { Subscription } from 'rxjs';
import { UserService } from '@app/services/user.service';
import { OnboardingService } from '@app/services/onboarding-services';
import { MatDialog } from '@angular/material/dialog';
import { OnboardingSettingComponent } from '@app/components/onboarding-setting/onboarding-setting.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  isSspa = environment.isSspa;
  user_name: string;
  STATISTICS_DURATION = STATISTICS_DURATION;
  tabs: TabItem[] = [
    { label: 'Overview', id: 'overview', icon: '' },
    { label: 'Reports', id: 'reports', icon: '' },
    { label: 'Activity', id: 'activities', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  // Statistics
  duration = STATISTICS_DURATION[0];
  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;

  constructor(
    private location: Location,
    private handlerService: HandlerService,
    private userService: UserService,
    private dialog: MatDialog,
    public dealsService: DealsService,
    public onboardingService: OnboardingService
  ) {}

  ngOnInit(): void {
    this.dealsService.pageStageLoaded.next(false);
    this.handlerService.pageName.next('dashboard');
    // Load the Last Tab Variable from Storage
    const page = localStorage.getCrmItem('homeTab');
    this.selectedTab =
      this.tabs.filter((e) => e.id === page)[0] || this.tabs[0];
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      console.log('profile', res);
      this.user_name = res.user_name;
    });
  }

  ngOnDestroy(): void {
    this.handlerService.pageName.next('');
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  /**
   * Change the Tab -> This will change the view
   * @param tab : TabItem for the Task and Activity
   */
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.location.replaceState(tab.id);
    // Set the storage for the active tab
    localStorage.setCrmItem('homeTab', tab.id);
  }
  /**
   * Change Duration
   * @param value : Duration Value -> monthly | weekly | yearly
   */
  changeDuration(value: string): void {
    this.duration = value;
  }

  openOnbording(event: MouseEvent) {
    event?.preventDefault();

    this.dialog
      .open(OnboardingSettingComponent, {
        width: '100vw',
        maxWidth: '960px',
        panelClass: 'onboarding-setting-container'
      })
      .afterClosed();
  }
}
