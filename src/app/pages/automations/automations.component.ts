import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AutomationService } from '@services/automation.service';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UserService } from '@services/user.service';
import * as _ from 'lodash';
import { TabItem } from '@utils/data.types';
import { HandlerService } from '@services/handler.service';
import { Subscription } from 'rxjs';
import { User } from '@models/user.model';
import userflow from 'userflow.js';
import { AutomationsOwnList } from '@pages/automations-own/automations-own.component';

@Component({
  selector: 'app-automations',
  templateUrl: './automations.component.html',
  styleUrls: ['./automations.component.scss']
})
export class AutomationsComponent implements OnInit, OnDestroy {
  user: User = new User();
  tabs: TabItem[] = [
    { label: 'My Automations List', id: 'own', icon: '' },
    { label: 'Automations Library', id: 'library', icon: '' }
  ];
  folderId = '';
  selectedTab: TabItem = this.tabs[0];
  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;
  @ViewChild('automationsList') automationsList: AutomationsOwnList;

  isPackageAutomation = false;

  constructor(
    public automationService: AutomationService,
    private route: ActivatedRoute,
    private location: Location,
    private handlerService: HandlerService,
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.router.url === '/automations') {
      this.router.navigate(['automations/own/root']);
      return;
    }
    this.handlerService.pageName.next('automations');
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          this.isPackageAutomation = profile.automation_info?.is_enabled;
          if (
            !this.user.onboard.automation_download &&
            this.selectedTab.id == 'own' &&
            userflow.isIdentified()
          ) {
            userflow.start('795db957-8dff-430f-97c2-7142b7d9e9ab');
          }
        }
      }
    );
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['tab']) {
        const tabIndex = this.tabs.findIndex((tab) => tab.id === params['tab']);
        this.selectedTab = this.tabs[tabIndex];
      } else {
        this.selectedTab = this.tabs[0];
      }
      if (params['folder']) {
        this.folderId = params['folder'];
      } else {
        this.folderId = '';
      }
    });
  }

  ngOnDestroy(): void {
    this.handlerService.pageName.next('');
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }
  create(): void {
    this.automationsList.createAutomation();
  }
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.router.navigate(['automations/' + tab.id + '/root']);
    if (
      !this.user.onboard.material_download &&
      this.selectedTab.id == 'own' &&
      userflow.isIdentified()
    ) {
      userflow.start('795db957-8dff-430f-97c2-7142b7d9e9ab');
    }
  }

  createFolder(): void {
    this.automationsList.createFolder(null);
  }
}
