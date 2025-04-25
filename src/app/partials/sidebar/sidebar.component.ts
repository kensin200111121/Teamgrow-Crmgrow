import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { USER_FEATURES } from '@app/constants/feature.constants';
import { UserFeatureService } from '@app/services/user-features.service';
import { environment } from '@environments/environment';
import { UserService } from '@services/user.service';
import { Subscription } from 'rxjs';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
  beta: boolean;
  betaClass: string;
  betaLabel: string;
  protectedRole: string[]; // Can be decorated with Enum Data
  // eslint-disable-next-line @typescript-eslint/ban-types
  subMenuItems: object[];
  active: boolean;
  feature?: string;
}
export const ROUTES: RouteInfo[] = [
  {
    path: 'home',
    title: 'dashboard',
    icon: 'i-dashboard bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: 'tasks',
    title: 'tasks',
    icon: 'i-task bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: []
  },
  {
    path: 'pipeline',
    title: 'pipeline',
    icon: 'i-deals bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      // {
      //   label: 'pipelines_library',
      //   path: 'pipelines-library'
      // },
      {
        label: 'pipeline_manager',
        path: 'pipeline/pipeline-manager/preference'
      }
    ],
    feature: USER_FEATURES.PIPELINE
  },
  ...(environment.production
    ? []
    : [
        {
          path: 'sphere',
          title: 'sphere',
          icon: 'i-sphere bgc-dark',
          class: '',
          beta: false,
          betaClass: '',
          betaLabel: '',
          protectedRole: null,
          active: false,
          subMenuItems: []
        }
      ]),
  {
    path: 'contacts',
    title: 'contacts',
    icon: 'i-lunch bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      {
        label: 'contact_manager',
        path: 'contacts/contact-manager/tag-manager'
      },
      {
        label: 'call_report',
        path: 'contacts/call-report'
      }
    ]
  },
  {
    path: 'materials/own/root',
    title: 'materials',
    icon: 'i-video bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [],
    feature: USER_FEATURES.MATERIAL
  },
  {
    path: '',
    title: 'lead_hub',
    icon: 'i-leadhub bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      {
        path: 'lead-hub/scheduler',
        label: 'scheduler',
        feature: USER_FEATURES.SCHEDULER
      },
      {
        path: 'lead-hub/websites',
        label: 'websites',
        feature: USER_FEATURES.LANDINGPAGE
      },
      {
        path: 'lead-hub/landing-pages',
        label: 'landing_pages',
        feature: USER_FEATURES.LANDINGPAGE
      },
      { path: 'lead-hub/smart-codes', label: 'smart_code' },
      { path: 'lead-hub/lead-capture', label: 'lead_capture' },
      {
        path: 'lead-hub/agent-filter',
        label: 'agent_filter',
        feature: USER_FEATURES.AVM
      }
    ]
  },
  {
    path: 'automations/own/root',
    title: 'automations',
    icon: 'i-automation bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [],
    feature: USER_FEATURES.AUTOMATION
  },
  {
    path: 'bulk-mail',
    title: 'bulk_email',
    icon: 'i-broadcasts bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [],
    feature: USER_FEATURES.CAMPAIGN
  },
  {
    path: 'calendar',
    title: 'calendar',
    icon: 'i-calendar bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [],
    feature: USER_FEATURES.CALENDER
  },
  {
    path: 'templates/own/root',
    title: 'templates',
    icon: 'i-template bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      {
        path: 'templates-list/merged-field-manager',
        label: 'merge_field_manager'
      }
    ],
    feature: USER_FEATURES.BETA
  },
  {
    path: 'community',
    title: 'community',
    icon: 'i-teams bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [],
    feature: USER_FEATURES.COMMUNITY
  },
  {
    path: '',
    title: 'settings',
    icon: 'i-setting bgc-dark',
    class: '',
    beta: false,
    betaClass: '',
    betaLabel: '',
    protectedRole: null,
    active: false,
    subMenuItems: [
      { path: 'settings/notifications', label: 'notifications' },
      { path: 'settings/sms', label: 'sms', feature: USER_FEATURES.TEXT },
      {
        path: 'settings/affiliate',
        label: 'affiliate',
        feature: USER_FEATURES.AFFILIATE
      },
      {
        path: 'settings/assistant',
        label: 'assistant',
        feature: USER_FEATURES.ASSISTANT
      },
      {
        path: 'settings/landing-page-theme',
        label: 'landing_page_theme',
        feature: USER_FEATURES.LANDINGPAGE
      },
      // { path: 'settings/integration-old', label: 'integration-old' },
      { path: 'settings/integration', label: 'integration' },
      { path: 'settings/business-hour', label: 'business_hour' },
      { path: 'settings/social-profile', label: 'social_profile' }
    ]
  }
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  menuItems: RouteInfo[] = JSON.parse(JSON.stringify(ROUTES));
  disableMenuItems: RouteInfo[] = [];
  isCollapsed = false;
  profile: any = {};
  isSuspended = false;
  profileSubscription: Subscription;
  isPackageAutomation = true;
  isPackageCalendar = true;
  isCampaign = false;
  suspendRouting = '/profile/billing';

  constructor(
    private router: Router,
    public userService: UserService,
    private renderer: Renderer2,
    public sspaService: SspaService,
    private featureService: UserFeatureService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user?._id) {
        this.isSuspended = user.subscription?.is_failed;
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  toggle(index: number): void {
    for (let i = 0; i < this.menuItems.length; i++) {
      if (i != index) {
        this.menuItems[i].active = false;
      } else {
        this.menuItems[index].active = !this.menuItems[index].active;
      }
    }
  }
}
