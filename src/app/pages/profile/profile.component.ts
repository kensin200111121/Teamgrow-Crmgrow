import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SubscriptionCancelReasonComponent } from '@components/subscription-cancel-reason/subscription-cancel-reason.component';
import { PageMenuItem } from '@utils/data.types';
import { UserService } from '@services/user.service';
import { User } from '@models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User = new User();
  profile: any;
  menuItems: PageMenuItem[] = [
    { id: 'general', icon: '', label: 'Info' },
    { id: 'signature', icon: '', label: 'Signature' },
    { id: 'security', icon: '', label: 'Security' },
    { id: 'account', icon: '', label: 'Team' },
    { id: 'subscription', icon: '', label: 'Subscription' },
    { id: 'billing', icon: '', label: 'Billing' }
  ];
  activeItems: PageMenuItem[] = [];
  defaultPage = 'general';
  currentPage: string;
  currentAction: string;
  currentPageItem: PageMenuItem = this.menuItems[0];
  queryParamSubscription: Subscription;

  profileSubscription: Subscription;
  routeChangeSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.profile = profile;
          this.activeItems = [...this.menuItems];
          const suspended = profile.subscription?.is_failed;
          if (suspended) {
            this.activeItems.splice(0, 3);
          }
          if (!profile.billing_access_enabled) {
            this.activeItems.splice(-1);
          }
          if (
            !profile.organization_info ||
            !profile.organization_info.is_owner ||
            !profile.organization_info.is_enabled
          ) {
            this.activeItems.splice(3, 1);
          }
        }
      }
    );
  }
  ngOnInit(): void {
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      this.currentPage = params['page'] || this.defaultPage;
      this.currentAction = params['action'] || '';
      if (this.currentPage === 'upgrade-plan') {
        this.currentPage = 'billing';
      } else if (this.currentPage === 'cancel-account') {
        this.currentPage = 'billing';
      } else if (
        this.currentPage === 'subscription' &&
        this.currentAction === 'cancel'
      ) {
        this.cancelAccount();
      }
      this.currentPageItem = this.menuItems.filter(
        (item) => item.id === this.currentPage
      )[0];
    });
  }

  cancelAccount(): void {
    const messageDialog = this.dialog.open(SubscriptionCancelReasonComponent, {
      width: '800px',
      maxWidth: '800px',
      disableClose: true,
      data: {}
    });
    messageDialog['_ref']['overlayRef']['_host'].classList.add('top-dialog');
    messageDialog.afterClosed().subscribe((res) => {
      if (res) {
      }
    });
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  /**
   * Change the page and replace the location
   * @param menu : SubMenu Item
   */
  changeMenu(menu: PageMenuItem): void {
    this.router.navigate([`profile/${menu.id}`]);
  }

  changeTab(menu: PageMenuItem): void {
    this.currentPageItem = menu;
    this.router.navigate([`profile/${menu.id}`]);
  }
}
