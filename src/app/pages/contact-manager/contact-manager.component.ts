import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { TabItem } from '@utils/data.types';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-contact-manager',
  templateUrl: './contact-manager.component.html',
  styleUrls: ['./contact-manager.component.scss']
})
export class ContactManagerComponent implements OnInit {
  tabs: TabItem[] = [
    { id: 'tag-manager', icon: '', label: 'Tag Manager' },
    { id: 'status', icon: '', label: 'Statuses' },
    { id: 'custom-contact-fields', icon: '', label: 'Custom Contact Fields' }
  ];
  selectedTab: TabItem = this.tabs[0];
  currentPage: string = this.tabs[0].id;

  routeChangeSubscription: Subscription;
  profileSubscription: Subscription;
  isSspa = environment.isSspa;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {});
  }

  ngOnInit(): void {
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      const tabIndex = this.tabs.findIndex((tab) => tab.id === params['page']);
      this.selectedTab = this.tabs[tabIndex];
    });
  }

  ngOnDestroy(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    this.currentPage = tab.id;
    this.router.navigate(['contacts/contact-manager/' + tab.id]);
  }
}
