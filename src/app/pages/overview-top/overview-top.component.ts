import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '@models/user.model';
import { PurchaseMessageComponent } from '@app/components/purchase-message/purchase-message.component';
import { DetailErrorComponent } from '@components/detail-error/detail-error.component';
import { UserService } from '@app/services/user.service';
import { ChartType, ChartOptions, ChartDataset, ChartEvent } from 'chart.js';
import { Subscription } from 'rxjs';
import { ContactService } from '@app/services/contact.service';
import { DealsService } from '@app/services/deals.service';
import { environment } from '@environments/environment';
import { ProspectService } from '@app/services/prospect.service';
import { SmsSubscribeComponent } from '@app/components/sms-subscribe/sms-subscribe.component';
import { SspaService } from '@app/services/sspa.service';
import { NewLeadsOverview } from '@app/types/prospect.type';

@Component({
  selector: 'app-overview-top',
  templateUrl: './overview-top.component.html',
  styleUrls: ['./overview-top.component.scss']
})
export class OverviewTopComponent implements OnInit, OnDestroy {
  isSspa = environment.isSspa;
  user: User = new User();
  // Prospect Count
  prospectCount = 0;
  prospectMonthCount = 0;
  // New Leads;
  newLeadsOverview: NewLeadsOverview;
  plusOverview: any;
  // Contact Count
  contactCount = 0;
  contactMonthCount = 0;
  // Deals Count
  dealCount = 0;
  dealMonthCount = 0;
  isVortex = true;

  VIEW_OPTIONS = [
    { id: 'last_day', label: 'Today', days: 1, view: 'day', value: 'day-0' },
    {
      id: 'last_week',
      label: 'Last 7 Days',
      days: 7,
      view: 'week',
      value: 'week-1'
    },
    {
      id: 'last_month',
      label: 'Last 30 Days',
      days: 30,
      view: 'month',
      value: 'month-0'
    }
  ];
  viewNewLeadsOption = this.VIEW_OPTIONS[1];
  viewPulseOption = this.VIEW_OPTIONS[1];
  // Usage of SMS
  leftSms = 0;
  usageData = [
    { id: 'Remaining', count: 0, color: '#E6E6E6' },
    { id: 'Used', count: 0, color: '#6554C0' }
  ];
  // Usage Pie chart
  public pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: false,
        external: (context) => {
          let tooltipEl = document.getElementById('external-tooltip');

          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'external-tooltip';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.background = 'rgba(0, 0, 0, 0.85)';
            tooltipEl.style.color = '#fff';
            tooltipEl.style.padding = '6px 8px';
            tooltipEl.style.borderRadius = '6px';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.transition = '0.2s ease';
            tooltipEl.style.zIndex = '9999';
            tooltipEl.style.fontSize = '12px';
            document.body.appendChild(tooltipEl);
          }

          const { tooltip } = context;

          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
          }

          if (tooltip.body && tooltip.dataPoints.length > 0) {
            const dataPoint = tooltip.dataPoints[0];
            const label = dataPoint.label;
            const value = dataPoint.raw;
            const backgroundColor =
              dataPoint.dataset.backgroundColor[dataPoint.dataIndex];

            tooltipEl.innerHTML = `
              <div style="font-size: 12px; font-weight: bold; margin-bottom: 2px;">${label}</div>
              <div style="display: flex; align-items: center;">
                <div style="width: 8px; height: 8px; background: ${backgroundColor}; border-radius: 2px; margin-right: 2px;"></div>
                <span style="font-size: 12px; font-weight: bold;">${value}</span>
              </div>
            `;
          }

          const canvasRect = context.chart.canvas.getBoundingClientRect();

          tooltipEl.style.opacity = '1';
          tooltipEl.style.left = `${canvasRect.left + tooltip.caretX + 10}px`;
          tooltipEl.style.top = `${canvasRect.top + tooltip.caretY + 10}px`;
        }
      }
    }
  };

  ngAfterViewInit(): void {
    const chartCanvas = document.querySelector('canvas');
    chartCanvas?.addEventListener('mousemove', (event) => {
      const tooltipEl = document.getElementById('external-tooltip');
      if (tooltipEl) {
        tooltipEl.style.left = `${event.pageX + 10}px`;
        tooltipEl.style.top = `${event.pageY + 10}px`;
      }
    });
  }

  public pieChartLabels: string[] = ['Remaining', 'Used'];
  public pieChartData: ChartDataset[] = [
    {
      data: [0, 0],
      backgroundColor: ['#E6E6E6', '#6554C0'],
      hoverBackgroundColor: ['#E6E6E6', '#6554C0']
    },
    {
      data: [0]
    }
  ];
  public pieChartType: ChartType = 'doughnut';
  public pieChartLegend = false;
  public pieChartPlugins = [];
  profileSubscription: Subscription;
  contactCountSubscription: Subscription;
  dealCountSubscription: Subscription;
  smsCountSubscription: Subscription;
  constructor(
    private router: Router,
    private location: Location,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private userService: UserService,
    private contactService: ContactService,
    private dealService: DealsService,
    private prospectService: ProspectService,
    public sspaService: SspaService
  ) {
    if (environment.isSspa) {
      this.prospectService.loadProspectOverview().subscribe((res) => {
        if (res.Total) {
          this.prospectCount = res.Total || 0;
          this.prospectMonthCount = res.new || 0;
        }
      });
      this.changeOptionNewLeads(this.VIEW_OPTIONS[1]);
      this.changeOptionPulse(this.VIEW_OPTIONS[1]);
    }

    this.contactCountSubscription &&
      this.contactCountSubscription.unsubscribe();
    this.contactCountSubscription = this.contactService.created$.subscribe(
      (_data) => {
        if (_data) {
          this.getContactCount();
        }
      }
    );
    this.dealCountSubscription && this.dealCountSubscription.unsubscribe();
    this.dealCountSubscription = this.dealService.created$.subscribe(
      (_data) => {
        if (_data) {
          this.getDealCount();
        }
      }
    );
    this.smsCountSubscription && this.smsCountSubscription.unsubscribe();
    this.smsCountSubscription = this.userService.sentSMS$.subscribe((_data) => {
      if (_data) {
        this.getSMSCount();
      }
    });
  }

  ngOnInit(): void {
    this.getContactCount();
    this.getDealCount();
    this.getSMSCount();
  }

  ngOnDestroy(): void {
    this.contactCountSubscription &&
      this.contactCountSubscription.unsubscribe();
    this.dealCountSubscription && this.dealCountSubscription.unsubscribe();
    this.smsCountSubscription && this.smsCountSubscription.unsubscribe();
  }

  getContactCount(): void {
    this.contactService.getOverivewCount().subscribe((res) => {
      if (res) {
        this.contactCount = res.total || 0;
        this.contactMonthCount = res.recent || 0;
      }
    });
  }

  getDealCount(): void {
    this.dealService.getOverivewCount().subscribe((res) => {
      if (res) {
        this.dealCount = res.total || 0;
        this.dealMonthCount = res.recent || 0;
      }
    });
  }

  getSMSCount(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService
      .loadProfile()
      .subscribe((profile) => {
        if (profile) {
          this.isVortex = profile.source === 'vortex';
          this.user = profile;
        }
        if (profile.text_info) {
          let used_count = 0,
            remaining_count = 0;

          if (profile.text_info.is_limit) {
            const max_count = profile.text_info?.max_count || 250;
            used_count =
              (profile.text_info?.count || 0) +
              (profile.text_info.subaccount_used_count || 0);
            const additionalCount =
              profile.text_info?.additional_credit?.amount || 0;
            if (used_count < max_count) {
              remaining_count = max_count - used_count + additionalCount;
            } else {
              remaining_count = additionalCount;
            }
          } else {
            remaining_count = 0;
            used_count = 0;
          }
          this.pieChartData[0]['data'] = [remaining_count, used_count];
          this.pieChartData[0]['backgroundColor'] = ['#E6E6E6', '#6554C0'];
          this.pieChartLabels = ['Remaining', 'Used'];
        }
      });
  }

  checkConnectEmail() {}

  goToPage(page: string) {
    switch (page) {
      case 'contacts':
        this.router.navigate(['/contacts']);
        break;

      case 'pipeline':
        this.router.navigate(['/pipeline']);
        break;

      case 'sms':
        this.router.navigate(['/settings/sms']);
        break;
    }
  }
  getToLink(page: string) {
    return `${window.location.origin}/app/${
      page === 'prospects' ? 'leads' : 'account/email'
    }`;
  }

  openConnectEmail() {
    this.dialog.closeAll();
    const connectEmailDialog = this.dialog.open(DetailErrorComponent, {
      width: '98vw',
      maxWidth: '420px',
      data: {
        errorCode: 406
      }
    });
    connectEmailDialog.afterClosed().subscribe((res) => {
      // TODO: complete the workflow logic here !!!
    });
  }

  purchaseSMS(): void {
    // Wavv Sms Setting.

    if (this.user.twilio_number || this.user.wavv_number) {
      this.dialog
        .open(PurchaseMessageComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '650px',
          disableClose: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.getSMSCount();
          }
        });
    } else {
      this.dialog
        .open(SmsSubscribeComponent, {
          width: '90vw',
          maxWidth: '720px',
          disableClose: true
        })
        .afterClosed()
        .subscribe((res) => {
          console.log(res);
        });
    }
  }
  changeOptionPulse(type: any): void {
    this.viewPulseOption = type;
    const param = {
      date: {
        value: this.viewPulseOption.value
      }
    };
    this.prospectService.loadPulseOverview(param).subscribe((res) => {
      console.log(res);
      if (res) {
        this.plusOverview = res;
      }
    });
  }
  changeOptionNewLeads(type: any): void {
    this.viewNewLeadsOption = type;
    this.prospectService
      .loadNewLeadsOverview(this.viewNewLeadsOption.days)
      .subscribe((res) => {
        if (res) {
          this.newLeadsOverview = res;
        }
      });
  }
}
