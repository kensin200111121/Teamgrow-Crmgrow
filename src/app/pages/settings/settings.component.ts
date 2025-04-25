import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { User } from '@models/user.model';
import { PageMenuItem } from '@utils/data.types';
import { UserService } from '@services/user.service';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  menuItems: PageMenuItem[] = [
    {
      id: 'notifications',
      icon: 'i-notification',
      label: 'Notification Setting'
    },
    { id: 'sms', icon: 'i-sms-limits', label: 'SMS' },
    { id: 'affiliate', icon: 'i-affiliate', label: 'Affiliate' },
    { id: 'assistant', icon: 'i-assistant', label: 'Assistant' },
    {
      id: 'landing-page-theme',
      icon: 'i-lead-capture',
      label: 'Landing Page Theme'
    },
    { id: 'integration', icon: 'i-integration', label: 'Store' },
    // { id: 'integration-old', icon: 'i-integration-old', label: 'Integration Old' },
    { id: 'business-hour', icon: 'i-timer', label: 'Business Hour' },
    { id: 'social-profile', icon: 'i-social', label: 'Social Profile' }
  ];
  defaultPage = 'notifications';
  currentPage: string;
  currentPageItem: PageMenuItem[];

  queryParamSubscription: Subscription;
  routeChangeSubscription: Subscription;
  profileSubscription: Subscription;
  user: User = new User();
  disableMenuItems = [];
  isPackageAssistant = true;
  isPackageCapture = true;
  isPackageText = true;
  isGuest;
  title;
  connected: boolean;
  isLoadingProfile = true;
  isWavvUser = false;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private userService: UserService,
    private toast: ToastrService,
    private router: Router
  ) {
    this.isGuest = localStorage.getCrmItem('guest_loggin');
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      if (res && res._id) {
        this.user = res;
        this.isPackageAssistant = res.assistant_info?.is_enabled;
        this.isPackageCapture = res.capture_enabled;
        this.isPackageText = res.text_info?.is_enabled;
        this.disableMenuItems = [];
        this.isWavvUser =
          this.user.source === 'vortex' || !this.user.twilio_number;
        this.isLoadingProfile = false;
        if (!this.isPackageAssistant) {
          this.disableMenuItems.push({
            id: 'assistant',
            icon: 'i-assistant',
            label: 'Assistant'
          });
        }
        if (!this.isPackageText) {
          this.disableMenuItems.push({
            id: 'sms',
            icon: 'i-sms-limits',
            label: 'SMS'
          });
        }
        if (!res['is_primary']) {
          this.disableMenuItems.push({
            id: 'affiliate',
            icon: 'i-affiliate',
            label: 'Affiliate'
          });
        }
        if (this.isGuest) {
          this.disableMenuItems.push(
            { id: 'assistant', icon: 'i-assistant', label: 'Assistant' },
            { id: 'integration', icon: 'i-integration', label: 'Integration' }
          );
        }
      }
    });
  }

  ngOnInit(): void {
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        const page = this.route.snapshot.routeConfig.path;
        let action = '';
        if (page.indexOf('profile/outlook') !== -1) {
          action = 'outlook';
        } else if (page.indexOf('profile/gmail') !== -1) {
          action = 'gmail';
        } else if (page.indexOf('profile/zoom') !== -1) {
          action = 'zoom';
        }
        if (action == 'outlook') {
          this.currentPage = 'integration';
          this.userService.authorizeOutlook(params['code']).subscribe(
            (res) => {
              this.user.connected_email_type = 'outlook';
              this.user.primary_connected = true;
              this.user.connected_email = res?.data?.account;
              this.user.connected_email_id = res?.data?.id;
              if (!this.user.onboard.connect_email) {
                this.user.onboard.connect_email = true;
                this.userService
                  .updateProfile({ onboard: this.user.onboard })
                  .subscribe(() => {
                    this.userService.updateProfileImpl({
                      onboard: this.user.onboard
                    });
                  });
              }
              this.userService.updateProfileImpl(this.user);
              this.location.replaceState('/settings/integration');
            },
            (err) => {
              this.location.replaceState('/settings/integration');
            }
          );
        }
        if (action == 'gmail') {
          this.currentPage = 'integration';
          this.userService.authorizeGoogle(params['code']).subscribe(
            (res) => {
              this.user.connected_email_type = 'gmail';
              this.user.primary_connected = true;
              this.user.connected_email = res?.data?.account;
              this.user.connected_email_id = res?.data?.id;
              if (!this.user.onboard.connect_email) {
                this.user.onboard.connect_email = true;
                this.userService
                  .updateProfile({ onboard: this.user.onboard })
                  .subscribe(() => {
                    this.userService.updateProfileImpl({
                      onboard: this.user.onboard
                    });
                  });
              }
              this.userService.updateProfileImpl(this.user);
              this.location.replaceState('/settings/integration');
            },
            (err) => {
              this.location.replaceState('/settings/integration');
            }
          );
        }
        if (action == 'zoom') {
          this.currentPage = 'integration';
          this.userService.authorizeZoom(params['code']).subscribe(
            (res) => {
              if (res.email) {
                const zoom = {
                  email: res.email
                };
                this.userService.updateGarbageImpl({ zoom });
              }
              this.location.replaceState('/settings/integration');
            },
            (err) => {
              this.location.replaceState('/settings/integration');
            }
          );
        }
      }
    });

    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      this.connected = false;
      if (
        !params['page'] &&
        this.route.snapshot.routeConfig.path.indexOf('profile') !== -1
      ) {
        this.currentPage = 'integration';
      } else {
        this.currentPage = params['page'] || this.defaultPage;
      }
      this.currentPageItem = this.menuItems.filter(
        (item) => item.id == this.currentPage
      );
    });
  }

  ngOnDestroy(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  isDisableItem(menuItem): boolean {
    if (menuItem && menuItem.id) {
      const index = this.disableMenuItems.findIndex(
        (item) => item.id === menuItem.id
      );
      if (index >= 0) {
        return true;
      }
    }
    return false;
  }

  changeMenu(menu: PageMenuItem): void {
    this.router.navigate([`settings/${menu.id}`]);
  }

  onBrandCreated(): void {
    this.router.navigate([`settings/sms`]);
  }
}
