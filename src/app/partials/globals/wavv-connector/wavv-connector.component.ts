import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { DialerLogComponent } from '@app/components/dialer-log/dialer-log.component';
import { DialerReportComponent } from '@app/components/dialer-report/dialer-report.component';
import { Contact } from '@app/models/contact.model';
import { DealsService } from '@app/services/deals.service';
import { DialerService } from '@app/services/dialer.service';
import { UserService } from '@app/services/user.service';
import { WavvStatus } from '@app/utils/wavv';
import {
  addCallAnsweredListener,
  addCallEndedListener,
  addCallRecordedListener,
  addCallStartedListener,
  addCampaignEndedListener,
  addClosedListener,
  addDialerVisibleListener,
  addLinesChangedListener,
  addMiniDialerVisibleListener,
  addWaitingForContinueListener,
  continueCampaign,
  removeContact,
  close
} from '@wavv/dialer';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DOCUMENT, Location } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { Strings } from '@app/constants/strings.constant';

const CLOSE_LOG = {
  contactId: 'callCursor',
  campaignClosed: true,
  ended: true
};

@Component({
  selector: 'app-wavv-connector',
  templateUrl: './wavv-connector.component.html',
  styleUrls: ['./wavv-connector.component.scss']
})
export class WavvConnectorComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  private _wavvEventListeners = [];
  siblingDeals = null;
  currentDeal = null;
  callWaitingDeal = null; // deal that waiting new call (next or prev)
  calling = false;

  logDialog = null;
  userId = '';

  siblingDealsLoadSubscription: Subscription;
  private WavvWidth = '';

  constructor(
    private dialerService: DialerService,
    private dealService: DealsService,
    private dialog: MatDialog,
    private zone: NgZone,
    private router: Router,
    private toast: ToastrService,
    public userService: UserService,
    private location: Location,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.initServiceHandlers();
    const user = this.userService.profile.getValue();
    this.userId = user._id;
  }

  ngOnInit(): void {
    this.dialerService.initStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => {
        if (status === WavvStatus.INITED) {
          this.initWavvEventListeners();
        } else if (status === WavvStatus.DESTROYED) {
          this.destroyWavvEventListender();
        }
      });

    const currentPath = this.location.path();
    if (currentPath.startsWith('/pipeline?deals=')) {
      this.currentDeal = currentPath.replace('/pipeline?deals=', '');
    } else {
      this.currentDeal = null;
    }
    this.routerHandle();
  }

  ngOnDestroy(): void {
    this.dialerService.initStatus.next(WavvStatus.DESTROYED);
  }

  private async initWavvEventListeners() {
    if (this._wavvEventListeners.length) {
      return;
    }

    const lineChangeListener = addLinesChangedListener(({ lines }) => {
      console.log('=== Line Changed === ', lines);
      const call = lines.find(({ focused }) => focused);
      if (call) {
        this.goToContactPage(call);
      }
    });
    this._wavvEventListeners.push(lineChangeListener);

    const campaignWaitingListener = addWaitingForContinueListener((e) => {
      if (e.waiting) {
        console.log('waiting for', e);
        this.zone.run(() => {
          this.openLogDialog(e);
        });
      }
    });
    this._wavvEventListeners.push(campaignWaitingListener);

    const callStartListener = addCallStartedListener((data) => {
      this.calling = true;
      console.log('=== call started listener ===', data);
      this.zone.run(() => {
        this.dialerService.updateCall({ ...data, started: true });
      });
    });
    this._wavvEventListeners.push(callStartListener);

    const callEndListener = addCallEndedListener((data) => {
      console.log('=== call is ended ===', data);
      this.calling = false;
      this.zone.run(() => {
        this.dialerService.updateCall({ ...data, ended: true });
      });
    });
    this._wavvEventListeners.push(callEndListener);

    const callRecordedListener = addCallRecordedListener((data) => {
      console.log('=== callRecordedListener ===');
      this.zone.run(() => {
        this.dialerService.updateCall(data);
      });
    });
    this._wavvEventListeners.push(callRecordedListener);

    const callAnsweredListener = addCallAnsweredListener((data) => {
      console.log('=== callAnsweredListener ===');
      this.zone.run(() => {
        this.dialerService.updateCall(data);
      });
    });
    this._wavvEventListeners.push(callAnsweredListener);

    const campaignEndedListener = addCampaignEndedListener((e) => {
      console.log('=== Campagin End ===', e);
      this.dialerService.setWavvCallStatus(false);
      this.calling = false;
      this.zone.run(() => {
        this.openReportDialog();
      });
      close();
    });
    this._wavvEventListeners.push(campaignEndedListener);

    const wavvClosedListener = addClosedListener(() => {
      console.log('=== wavvClosedListener ===');
      this.calling = true;
      this.zone.run(() => {
        this.openReportDialog();
      });
    });
    this._wavvEventListeners.push(wavvClosedListener);

    const element = document.getElementById('wavv-dialer-mini');
    const resizeObserver = new MutationObserver((entries) => {
      const { target } = entries[0];
      const el = target as HTMLElement;
      const width = el.style.width;

      if (width !== this.WavvWidth) {
        el.style.minWidth = width;
        this.WavvWidth = width;

        const dragElement = document.getElementById('wavv-mini-drag');
        const iconElement = document.getElementById('wavv-frame-dialer-mini');
        const isMiniMode = width === '40px';

        dragElement?.classList.toggle('drag_head', isMiniMode);
        iconElement?.classList.toggle('wavv-frame-mini', isMiniMode);
      }
      return true;
    });
    resizeObserver.observe(element, {
      attributes: true,
      attributeFilter: ['style']
    });
    const { enableNavigationPrevention, disableNavigationPrevention } =
      await import('@redx/api-ui');
    const wavvVisibleListener = addMiniDialerVisibleListener(({ visible }) => {
      if (visible) {
        enableNavigationPrevention({
          message: Strings.DISABLED_NAVIGATION,
          isSoftPrevention: false,
          urlWhitelist: [
            '/crm/contacts',
            '/crm/home',
            '/crm/calendar',
            '/crm/tasks',
            new RegExp('/crm/.*', 'i')
          ]
        });
      } else {
        disableNavigationPrevention();
      }
    });
    this._wavvEventListeners.push(wavvVisibleListener);
  }

  private destroyWavvEventListender(): void {
    this._wavvEventListeners.forEach((e) => {
      e && e.remove();
    });
    this._wavvEventListeners = [];
    this.destroy$.next(true);
    this.destroy$.complete();
    this.dialerService.initStatus.next(WavvStatus.NONE);
  }

  private goToContactPage(data): void {
    if (!data || !data.contactId) {
      return;
    }
    this.zone.run(() => {
      if (
        !this.dialerService.command?.deal &&
        !this.dialerService.command?.dealStages
      ) {
        this.router.navigate([`/contacts/${data.contactId}`]);
      }

      if (this.dialerService.command?.dealStages) {
        const dealStages = this.dialerService.command.dealStages;
        const contactId = data.contactId;
        let dealId = '';
        for (const key in dealStages) {
          if (dealStages[key].includes(contactId)) {
            dealId = key;
            break;
          }
        }
        if (dealId) {
          this.dialerService.command.deal = dealId;
          this.router.navigate(['/pipeline'], {
            queryParams: { deals: dealId }
          });
        }
      }
    });
  }

  private openLogDialog(data): void {
    if (data && !this.logDialog) {
      this.logDialog = this.dialog
        .open(DialerLogComponent, {
          width: '100vw',
          maxWidth: '500px',
          disableClose: true,
          data
        })
        .afterClosed()
        .subscribe((res) => {
          this.logDialog = null;
          continueCampaign({ resume: true });
          this.dialerService.isCallLogged.next(true);
          if (res?.isClosed) {
            this.openReportDialog();
          }
        });
    }
  }

  private openReportDialog(): void {
    if (this.logDialog) {
      this.dialerService.updateCall(CLOSE_LOG);
      return;
    }
    if (!this.dialerService.logs.getValue()?.length) {
      this._campaignCloseHandler();
      return;
    }
    const command = this.dialerService.command;
    if (
      command?.deal &&
      command?.contacts?.length > 1 &&
      !command?.dealStages
    ) {
      this.logDialog = this.dialog
        .open(DialerReportComponent, {
          width: '100vw',
          maxWidth: '500px',
          disableClose: true,
          data: this.dialerService.command
        })
        .afterClosed()
        .subscribe(() => {
          this.logDialog = null;
          this._campaignCloseHandler();
          // Reload activity in deal
          const currentPath = this.location.path();
          if (currentPath.startsWith('/pipeline?deals=')) {
            this.dealService.called.next(Date.now());
          }
        });
    } else {
      if (
        !command?.deal &&
        !command?.dealContacts?.length &&
        !command?.dealStages
      ) {
        this._saveContactCallReport();
      } else if (command?.deal) {
        this._saveSingleContactDealCallReport();
      } else if (command?.dealStages) {
        this._saveDealStageCallReport();
      }
    }
  }

  private _campaignCloseHandler(): void {
    this.dialerService.command = null;
    this.dialerService.cleanLogs();
    this.checkPromptingDealCall();
  }

  private _saveContactCallReport(): void {
    const contacts = this.dialerService.command?.contacts;
    const contactIds = contacts.map((e) => e.contactId);
    const notification = {
      user: this.userId,
      type: 'personal',
      criteria: 'dialer_call',
      contact: contactIds,
      uuid: this.dialerService?.command?.uuid
    };
    this.dialerService.saveDealDialer(notification).subscribe((res) => {
      if (res && res.status) {
        this._campaignCloseHandler();
      }
    });
  }

  private _saveSingleContactDealCallReport(): void {
    console.log('_saveSingleContactDealCallReport');
    const contacts = this.dialerService.command?.contacts;
    const contactIds = contacts.map((e) => e.contactId);
    const logs = this.dialerService.logs.getValue();
    if (logs.length > 0) {
      const dialCallNote = logs[0].content;
      const dialCallStatus = logs[0].status;
      const notification = {
        user: this.userId,
        type: 'personal',
        criteria: 'dialer_call',
        detail: {
          data: logs[0],
          content: dialCallNote,
          status: dialCallStatus
        },
        contact: contactIds,
        content: dialCallNote,
        status: dialCallStatus,
        deal: this.dialerService?.command?.deal,
        uuid: this.dialerService?.command?.uuid
      };
      this.dialerService.saveDealDialer(notification).subscribe((res) => {
        this._campaignCloseHandler();
      });
    }
  }

  private _saveDealStageCallReport(): void {
    console.log('_saveDealStageCallReport');
    const dealStages = this.dialerService.command?.dealStages;
    const contacts = this.dialerService.command?.contacts;
    const contactIds = contacts.map((e) => e.contactId);
    const logs = this.dialerService.logs.getValue();
    if (logs.length > 0) {
      const contactLogs = [];
      for (let i = 0; i < logs.length; i++) {
        const contactLogObj = {
          contactId: logs[i].contactId,
          status: logs[i].status,
          content: logs[i].content
        };
        contactLogs.push(contactLogObj);
      }
      const notification = {
        user: this.userId,
        type: 'personal',
        criteria: 'dialer_call',
        detail: {
          data: contactLogs
        },
        content: logs[0].status,
        status: logs[0].content,
        contact: contactIds,
        dealStages: dealStages,
        uuid: this.dialerService?.command?.uuid
      };
      this.dialerService.saveDealDialer(notification).subscribe((res) => {
        this._campaignCloseHandler();
      });
    }
    this._campaignCloseHandler();
  }

  private initServiceHandlers(): void {
    this.siblingDealsLoadSubscription?.unsubscribe();
    this.siblingDealsLoadSubscription = this.dealService.siblings$.subscribe(
      (res) => {
        if (res) {
          this.siblingDeals = res;
        }
      }
    );
  }

  /**
   * Call next deal or prev deal
   * @param field: prev | next
   * @returns
   */
  callNewDeal(field: string): void {
    if (!field) {
      return;
    }
    const contacts = this.dialerService.command?.contacts || [];

    for (let i = contacts.length - 1; i >= 0; i--) {
      const contact = contacts[i];
      removeContact({ ...contact, hangup: true, resume: true });
    }

    this.callWaitingDeal = this.siblingDeals?.[field];
  }

  checkPromptingDealCall(): void {
    if (!this.callWaitingDeal) {
      return;
    }
    const deal = this.callWaitingDeal;
    const contacts = [];
    deal.contacts.forEach((e) => {
      const contactObj = new Contact().deserialize(e);
      const contact = {
        contactId: contactObj._id,
        numbers: [contactObj.cell_phone],
        name: contactObj.fullName
      };
      contacts.push(contact);
    });
    if (!contacts.length) {
      this.toast.error('', `These deal contacts don't have cell phone.`);
      return;
    }
    this.router.navigate(['/pipeline'], {
      queryParams: { deals: deal._id }
    });
    this.dialerService.makeCalls(contacts, deal._id);
    this.callWaitingDeal = null;
  }

  goToPrevDeal(): void {
    const prevDealId = this.siblingDeals?.prev?._id;

    if (!prevDealId) {
      return;
    }

    if (this.dialerService.command?.deal === this.currentDeal) {
      this.callNewDeal('prev');
    } else {
      this.router.navigate(['/pipeline'], {
        queryParams: { deals: prevDealId }
      });
    }
  }

  goToNextDeal(): void {
    const nextDealId = this.siblingDeals?.next?._id;

    if (!nextDealId) {
      return;
    }

    this.router.navigate(['/pipeline'], {
      queryParams: { deals: nextDealId }
    });
  }

  routerHandle(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {})
      )
      .subscribe(() => {
        const currentPath = this.location.path();
        if (currentPath.startsWith('/pipeline?deals=')) {
          this.currentDeal = currentPath.replace('/pipeline?deals=', '');
        } else {
          this.currentDeal = null;
        }
      });
  }
}
