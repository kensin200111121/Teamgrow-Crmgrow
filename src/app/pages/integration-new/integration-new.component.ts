import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { User } from '@models/user.model';
import * as _ from 'lodash';
import { environment } from '@environments/environment';
import { Subscription } from 'rxjs';
import { UserService } from '@app/services/user.service';
import { Garbage } from '@app/models/garbage.model';
import { ConnectService } from '@app/services/connect.service';
import { Alias, TabItem } from '@app/utils/data.types';
import { initData } from '@app/utils/functions';
import { MatDialog } from '@angular/material/dialog';
import { IntegrationDialogComponent } from '@app/components/integration-dialog/integration-dialog.component';
import { AliasDialogComponent } from '@app/components/alias-dialog/alias-dialog.component';
import { FormType } from '@app/utils/enum';
import { CalendlyListComponent } from '@components/calendly-list/calendly-list.component';
import { openSettings } from '@wavv/messenger';
import {
  PROFILE_INTEGRAIONS,
  GARBAGE_INTEGRAIONS
} from '@app/constants/integraions';
@Component({
  selector: 'app-integration-new',
  templateUrl: './integration-new.component.html',
  styleUrls: ['./integration-new.component.scss']
})
export class IntegrationNewComponent implements OnInit {
  readonly tabs: TabItem[] = [
    { icon: '', label: 'Integrations', id: 'integration' }
  ];
  tab: TabItem = this.tabs[0];
  private readonly isSspa = environment.isSspa;
  private readonly isProduction = environment.production;
  private readonly agentFirePage = environment.AGENTFIRE;
  private features: Record<string, boolean> = {};
  isLoading = false;

  private profileSubscription: Subscription;
  private garbageSubscription: Subscription;
  private user: User = new User();
  private garbage: Garbage = new Garbage();

  private googleCalendars = [];
  private outlookCalendars = [];
  private calendlyLength = 0;

  sspaIdList = [
    'dialer',
    'agent_fire',
    'zoom',
    'download_crmgrow',
    'chrome_extension'
  ];
  mostPopulars = [];
  filterList = ['Email', 'Calendar', 'Tools', 'IDX'];
  filteredIntegrations = [];
  profileIntegrations = [];
  garbageIntegrations = [];
  selectedTypes: string[] = ['Email', 'Calendar', 'Tools', 'IDX'];
  isProduct = false;
  productsList = [];
  searchQuery = '';

  calendarEmail = '';

  constructor(
    public sspaService: SspaService,
    private userService: UserService,
    private connectService: ConnectService,
    private dialog: MatDialog
  ) {
    this.loadUserConnectionStatus();
  }

  ngOnInit(): void {}

  private loadUserConnectionStatus() {
    this.isLoading = true;
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        if (profile._id) {
          this.isLoading = false;
          this.user = profile;
          this.profileIntegrations = JSON.parse(
            JSON.stringify(PROFILE_INTEGRAIONS)
          );
          if (
            (this.user.connected_email_type == 'gmail' ||
              this.user.connected_email_type == 'gsuit') &&
            this.user.primary_connected
          ) {
            const item = this.profileIntegrations.find(
              (integration) => integration.title === 'Google Mail'
            );
            item.isConnected = true;
            item.authorizedInfo = [
              {
                connected_email: this.user.connected_email
              }
            ];
            item.aliasList = this.loadAlias();
          }
          if (
            (this.user.connected_email_type == 'outlook' ||
              this.user.connected_email_type == 'microsoft') &&
            this.user.primary_connected
          ) {
            const item = this.profileIntegrations.find(
              (integration) => integration.title === 'Microsoft 365 Mail'
            );
            item.isConnected = true;
            item.authorizedInfo = [
              {
                connected_email: this.user.connected_email
              }
            ];
            item.aliasList = this.loadAlias();
          }
          if (
            this.user.connected_email_type == 'smtp' &&
            this.user.primary_connected
          ) {
            const item = this.profileIntegrations.find(
              (integration) => integration.title === 'SMTP Mail'
            );
            item.isConnected = true;
            item.authorizedInfo = [
              {
                connected_email: this.user.connected_email
              }
            ];
            item.aliasList = this.loadAlias();
          }
          if (this.user.calendar_list) {
            this.googleCalendars = this.user.calendar_list.filter((e) => {
              if (e.connected_calendar_type === 'google') {
                return true;
              }
            });
            this.outlookCalendars = this.user.calendar_list.filter((e) => {
              return e.connected_calendar_type === 'outlook';
            });
            if (this.googleCalendars.length > 0) {
              const item = this.profileIntegrations.find(
                (integration) => integration.title === 'Google Calendar'
              );
              item.isConnected =
                this.googleCalendars?.length + this.outlookCalendars?.length <
                this.user.calendar_info.max_count
                  ? false
                  : true;
              item.authorizedInfo = this.googleCalendars;
            }
            if (this.outlookCalendars.length > 0) {
              const item = this.profileIntegrations.find(
                (integration) => integration.title === 'Outlook Calendar'
              );
              item.isConnected =
                this.googleCalendars?.length + this.outlookCalendars?.length <
                this.user.calendar_info.max_count
                  ? false
                  : true;
              item.authorizedInfo = this.outlookCalendars;
            }
            if (this.user.dialer_info?.is_enabled) {
              const item = this.profileIntegrations.find(
                (integration) => integration.title === 'Dialer'
              );
              item.isConnected = true;
            }
          }
          this.filterIntegrations();
        }
      }
    );
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = res;
      this.garbageIntegrations = JSON.parse(
        JSON.stringify(GARBAGE_INTEGRAIONS)
      );
      if (this.garbage._id && this.garbage.features) {
        this.features = this.garbage.features;
      }
      if (this.garbage.calendly?.email) {
        this.connectService.getEvent().subscribe((res) => {
          if (res && res['status']) {
            this.calendlyLength = res['data'].length;
          }
        });
        const item = this.garbageIntegrations.find(
          (integration) => integration.title === 'Calendly'
        );
        item.isConnected = true;
        item.authorizedInfo = [
          {
            connected_email: this.garbage.calendly?.email,
            id: this.garbage.calendly?.id,
            link: this.garbage.calendly?.link
          }
        ];
      }
      if (this.garbage.access_token == '') {
        this.connectService.getToken().subscribe((res) => {
          if (res['status'] == true) {
            this.garbage.access_token = res['token'];
          }
        });
      }
      if (this.garbage.zoom) {
        const item = this.garbageIntegrations.find(
          (integration) => integration.title === 'Zoom'
        );
        item.isConnected = true;
        item.authorizedInfo = [{ connected_email: this.garbage.zoom?.email }];
      }
      if (this.garbage.access_token)
        this.garbageIntegrations.find(
          (integration) => integration.title === 'Zapier'
        ).isConnected = true;
      if (this.garbage.api_key)
        this.garbageIntegrations.find(
          (integration) => integration.title === 'Agent Fire'
        ).isConnected = true;

      this.filterIntegrations();
    });
  }

  search() {
    const integrations = [
      ...this.profileIntegrations,
      ...this.garbageIntegrations
    ];
    this.filteredIntegrations = integrations.filter((integration) =>
      integration.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.mostPopulars = this.filteredIntegrations.filter(
      (integration: any) => integration.popular
    );
  }

  filterIntegrations() {
    const integrations = [
      ...this.profileIntegrations,
      ...this.garbageIntegrations
    ];
    if (this.selectedTypes.length === 0) {
      this.filteredIntegrations = [...integrations]; // Reset to all integrations if no filter selected
    } else {
      this.filteredIntegrations = integrations.filter((integration) =>
        this.selectedTypes.includes(integration.type)
      );
    }
    const disabledItems = [];
    this.filteredIntegrations = this.filteredIntegrations.filter((items) => {
      return this.isSspa
        ? !this.sspaIdList.includes(items.id)
        : !disabledItems.includes(items.id);
    });
    this.mostPopulars = this.filteredIntegrations.filter(
      (integration: any) => integration.popular
    );
    this.productsList = this.filteredIntegrations.filter(
      (integration: any) => integration.isConnected
    );
  }

  filterCheckboxChanged(event: any, type: string) {
    if (event.target.checked) {
      this.selectedTypes.push(type);
    } else {
      const index = this.selectedTypes.indexOf(type);
      if (index !== -1) {
        this.selectedTypes.splice(index, 1);
      }
    }
    this.filterIntegrations();
  }

  isSelected(type: string): boolean {
    return this.selectedTypes.includes(type);
  }

  toProducts(): void {
    this.isProduct = !this.isProduct;
  }

  /**
   * Load Alias List
   */
  private loadAlias() {
    const aliasList = this.user.email_alias;
    const defaultAlias = {
      email: this.user.connected_email,
      name: this.user.user_name
    };
    const { list } = initData(defaultAlias, aliasList);
    return list;
  }

  /**
   * Create Email Alias
   */
  createAlias(item): void {
    this.dialog
      .open(AliasDialogComponent, {
        width: '96vw',
        maxWidth: '400px',
        data: {
          aliasList: item.aliasList
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          item.aliasList.push(res);
          const aliasList = item.aliasList.filter((e) => !e.is_default);
          this.userService.updateProfileImpl({ email_alias: aliasList });
        }
      });
  }

  /**
   * Remove the alias
   * @param alias
   */
  removeAlias(item, alias: Alias): void {
    if (alias.primary) {
      return;
    }
    const newAliasList = [...item.aliasList];
    newAliasList.some((e, index) => {
      if (e.email === alias.email) {
        newAliasList.splice(index, 1);
        return true;
      }
    });
    const updateAliasList = newAliasList.filter((e) => !e.is_default);
    this.userService
      .updateProfile({ email_alias: updateAliasList })
      .subscribe((res) => {
        if (!res) return;
        item.aliasList = newAliasList;
        this.userService.updateProfileImpl({ email_alias: updateAliasList });
      });
  }

  setPrimaryAlias(item, alias: Alias): void {
    this.userService
      .editEmailAlias(alias.email, null, true)
      .subscribe((res) => {
        if (!res) return;
        item.aliasList.forEach((e) => {
          if (e.email === alias.email) {
            e.primary = true;
          } else {
            e.primary = false;
          }
        });
        const aliasList = item.aliasList.filter((e) => !e.is_default);
        this.userService.updateProfileImpl({ email_alias: aliasList });
      });
  }

  /**
   * Edit the Alias
   * @param alias
   */
  editAlias(item, alias: Alias): void {
    this.dialog
      .open(AliasDialogComponent, {
        width: '96vw',
        maxWidth: '400px',
        data: {
          alias,
          type: FormType.UPDATE
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          item.aliasList.some((e) => {
            if (e.email === res.email) {
              e.name = res.name;
              return true;
            }
          });
          const aliasList = item.aliasList.filter((e) => !e.is_default);
          this.userService.updateProfileImpl({ email_alias: aliasList });
        }
      });
  }

  connect(item: any): void {
    if (item.hasSpecial) {
      const linkDom = document.createElement('a');
      linkDom.target = '_blank';
      switch (item.hasSpecial) {
        case 'download':
          linkDom.href =
            window.navigator.userAgent.indexOf('Win') !== -1
              ? environment.DESKTOP_APP_LINK.WIN
              : environment.DESKTOP_APP_LINK.MAC;
          break;
        case 'install':
          linkDom.href =
            'https://chrome.google.com/webstore/detail/crmgrow-video-webcam-scre/bcbcnnookeieadihaekplblbfmjaodbb?hl=en-US';
          break;
      }
      linkDom.click();
      return;
    }

    if (item.id === 'dialer' && item.isConnected) {
      openSettings();
      return;
    }
    // TODO: open the connection dialog
    this.dialog
      .open(IntegrationDialogComponent, {
        width: '96%',
        maxWidth: '880px',
        height: '80vh',
        maxHeight: '650px',
        data: {
          integration: item
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && item.id === 'calendly') {
          this.userService
            .updateGarbage({
              calendly: res
            })
            .subscribe(() => {
              this.userService.updateGarbageImpl({
                calendly: { email: res.email, token: res.token }
              });
            });
          this.calendlyLength = res.length;
          this.selectCalendly();
        }
      });
  }

  iDisconnect(item: any): void {
    // TODO: call the disconnection api
    switch (item.id) {
      case 'zoom':
        this.disconnectZoom();
        break;
      case 'calendly':
        this.disconnectCalendly();
        break;
      case 'gmail':
      case 'outlook':
      case 'smtp_mail':
        this.disconnectMail(item.id);
        break;
    }
  }

  private disconnectZoom(): void {
    this.userService.updateGarbage({ zoom: '' }).subscribe(() => {
      this.userService.updateGarbageImpl({ zoom: { email: '' } });
    });
  }

  private disconnectCalendly(): void {
    this.connectService.disconnectCalendly().subscribe((res) => {
      if (res && res['status']) {
        delete this.garbage['calendly'];
        this.userService.updateGarbage({ calendly: {} }).subscribe(() => {
          this.userService.updateGarbageImpl({ calendly: {} });
          // this.toast.success('Calendly disconnected successfully.');
        });
      }
    });
  }

  private disconnectMail(type: string): void {
    let data = {};
    if (this.user.source === 'vortex') {
      data = {
        tokenId: this.user.connected_email_id
      };
    }
    this.userService.disconnectMail(data).subscribe((res) => {
      if (res.status) {
        this.user.primary_connected = false;
        this.user.connected_email_type = '';
        this.user.connected_email = '';
        if (type == 'smtp_mail') {
          const data = {
            primary_connected: false,
            connected_email_type: '',
            connected_email: ''
          };
          this.userService.updateProfile(data).subscribe(() => {
            this.userService.updateProfileImpl(data);
          });
          delete this.user['smtp_info'];
          this.userService.updateProfile(this.user).subscribe(() => {
            this.userService.updateProfileImpl(this.user);
          });
        }
        const data = {
          primary_connected: this.user.primary_connected,
          connected_email_type: this.user.connected_email_type,
          connected_email: this.user.connected_email
        };
        this.userService.updateProfileImpl(data);
        this.filterIntegrations();
      }
    });
  }

  selectCalendly(): void {
    this.dialog.open(CalendlyListComponent, {
      width: '100vw',
      maxWidth: '800px',
      data: {
        key: this.garbage.calendly?.id
      }
    });
  }
  disconnectCalendar(email: string, type: string, id?: string): void {
    const data = {
      connected_email: email,
      id
    };
    this.userService.disconnectCalendar(data).subscribe((res) => {
      if (res && res['status']) {
        if (type == 'gmail') {
          const pos = _.findIndex(
            this.googleCalendars,
            (e) => e.connected_email == email
          );
          this.googleCalendars.splice(pos, 1);
          // this.toast.success(
          //   'Your Google Calendar is disconnected successfully.'
          // );
        } else {
          const pos = _.findIndex(
            this.outlookCalendars,
            (e) => e.connected_email == email
          );
          this.outlookCalendars.splice(pos, 1);
          // this.toast.success(
          //   'Your Outlook Calendar is disconnected successfully.'
          // );
        }
        const pos = _.findIndex(
          this.user.calendar_list,
          (e) => e.connected_email == email
        );
        this.user.calendar_list.splice(pos, 1);
        if (!this.user.calendar_list.length) {
          this.user.calendar_connected = false;
        }
        this.userService.updateProfileImpl({
          calendar_list: this.user.calendar_list,
          connect_calendar: this.user.calendar_connected
        });
      }
    });
  }
}
