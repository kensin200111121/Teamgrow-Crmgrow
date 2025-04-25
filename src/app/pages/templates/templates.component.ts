import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { TemplatesService } from '@services/templates.service';
import { UserService } from '@services/user.service';
import { Location } from '@angular/common';
import * as _ from 'lodash';
import { TabItem } from '@utils/data.types';
import { Router, ActivatedRoute } from '@angular/router';
import { HandlerService } from '@services/handler.service';
import userflow from 'userflow.js';
import { User } from '@models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { TemplatesOwnList } from '@pages/templates-own/templates-own.component';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent implements OnInit, OnDestroy {
  user: User = new User();
  tabs: TabItem[] = [
    { label: 'My Templates List', id: 'own', icon: '' },
    { label: 'Templates Library', id: 'library', icon: '' }
  ];
  folderId = '';
  selectedTab: TabItem = this.tabs[0];
  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;
  @ViewChild('templatesList') templatesList: TemplatesOwnList;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public templatesService: TemplatesService,
    private userService: UserService,
    private handlerService: HandlerService,
    private location: Location,
    private dialog: MatDialog,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.router.url === '/templates') {
      this.router.navigate(['templates/own/root']);
      return;
    }
    this.handlerService.pageName.next('templates');
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.user = profile;
          if (
            !this.user.onboard.template_download &&
            this.selectedTab.id == 'own' &&
            userflow.isIdentified()
          ) {
            userflow.start('9cd17f08-9ff0-4ef4-8621-3edeff6e823f');
          }
        }
      }
    );
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      if (params['tab'] === 'own') {
        this.selectedTab = this.tabs[0];
      } else if (params['tab'] === 'library') {
        this.selectedTab = this.tabs[1];
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

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.router.navigate(['/templates/' + tab.id]);
    if (
      !this.user.onboard.template_download &&
      this.selectedTab.id == 'own' &&
      userflow.isIdentified()
    ) {
      userflow.start('9cd17f08-9ff0-4ef4-8621-3edeff6e823f');
    }
  }

  createFolder(): void {
    this.templatesList.createFolder(null);
  }
}
