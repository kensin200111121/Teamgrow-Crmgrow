import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChartType, ChartOptions, ChartDataset, ChartEvent } from 'chart.js';
import { ContactService } from '@services/contact.service';
import {
  ActivityAnalyticsData,
  ActivityAnalyticsReq,
  FieldAnalyticsData
} from '@utils/data.types';
import { environment } from '@environments/environment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

const COLORS = [
  '#E4E0F3',
  '#9185D2',
  '#362A77',
  '#E4E0F3',
  '#9185D2',
  '#362A77',
  '#E4E0F3',
  '#9185D2',
  '#362A77'
];

const LABEL_ID_DIC = {
  'Never automated': 'never_automated',
  'On automation': 'on_automation',
  'Recently off automation': 'recent_off_automation'
};

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  isSspa = false;

  private fieldOptions: FieldAnalyticsData[] = [
    {
      id: 'missing_email',
      and: true,
      fields: [
        {
          name: 'email',
          exist: false
        },
        {
          name: 'cell_phone',
          exist: true
        }
      ]
    },
    {
      id: 'missing_phone',
      and: true,
      fields: [
        {
          name: 'cell_phone',
          exist: false
        },
        {
          name: 'email',
          exist: true
        }
      ]
    },
    {
      id: 'missing_email_phone',
      and: true,
      fields: [
        {
          name: 'email',
          exist: false
        },
        {
          name: 'cell_phone',
          exist: false
        }
      ]
    }
  ];
  private activityOptions: ActivityAnalyticsReq = {
    options: [
      {
        activities: ['emails', 'texts'],
        id: 'recent_communicated',
        range: 30
      }
    ]
  };
  automationRange = 30;

  fieldAnalytics = [
    { id: 'missing_email', count: 0, color: '#E4E0F3' },
    { id: 'missing_phone', count: 0, color: '#9185D2' },
    { id: 'missing_email_phone', count: 0, color: '#362A77' }
  ];
  automationAnalytics = [
    {
      id: 'Contacts',
      count_on: 0,
      percent_on: 0,
      color_on: '#E4E0F3',
      count_off: 0,
      percent_off: 0,
      color_off: '#362A77',
      count_never: 0,
      percent_never: 0,
      color_never: '#9185D2'
    },
    {
      id: 'Deals',
      count_on: 0,
      percent_on: 0,
      color_on: '#E4E0F3',
      count_off: 0,
      percent_off: 0,
      color_off: '#362A77',
      count_never: 0,
      percent_never: 0,
      color_never: '#9185D2'
    }
  ];
  activityAnalytics: ActivityAnalyticsData[] = [
    {
      id: 'recent_communicated',
      types: ['emails', 'texts'],
      range: 30,
      result: [{ count: 0 }]
    }
  ];
  rateAnalytics = [
    { id: 'one_star', count: 0, percentage: 0, rate: 'one' },
    { id: 'two_star', count: 0, percentage: 0, rate: 'two' },
    { id: 'three_star', count: 0, percentage: 0, rate: 'three' },
    { id: 'four_star', count: 0, percentage: 0, rate: 'four' },
    { id: 'five_star', count: 0, percentage: 0, rate: 'five' },
    { id: 'zero_star', count: 0, percentage: 0, rate: 'zero' }
  ];

  prospectListing = [
    { label: 'Expireds', id: 'expire', icon: 'i-expire', count: 0 },
    { label: 'FSBOs', id: 'fsbo', icon: 'i-fsbo', count: 181 },
    { label: 'FRBOs', id: 'frbo', icon: 'i-frbo', count: 181 },
    {
      label: 'Foreclosures',
      id: 'foreclosure',
      icon: 'i-foreclosure',
      count: 0
    },
    { label: 'My Imports', id: 'import', icon: 'i-import', count: 24 }
  ];

  pluseReports = [
    {
      type: 'call',
      label: 'Calls Made',
      icon: 'i-phone',
      average: '20',
      total: '080'
    },
    {
      type: 'appointment',
      label: 'Appt. Set',
      icon: 'i-event',
      average: '08',
      total: '32'
    },
    {
      type: 'duration',
      label: 'Duration',
      icon: 'i-duration',
      average: '1:38:11',
      total: '24:40'
    }
  ];

  SORT_TYPES = [
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_year', label: 'Last Year' }
  ];
  sortType = this.SORT_TYPES[0];

  loadingFieldAnalytics = false;
  loadingAutomationAnalytics = false;
  loadingRatesAnalytics = false;
  loadingActivityAnalytics = false;
  loadingProspectLists = false;
  loadingPulseReports = false;
  calculating = false;

  // Chart Options
  public pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: ChartEvent, element) => {
      if (event && event['chart']) {
        const dataIndex = element[0].index;
        const label = event['chart'].data.labels[dataIndex];
        const sItem = this.fieldAnalytics[dataIndex];
        this.zone.run(() => {
          this.filterContacts(sItem.id, this.automationRange);
        });
      }
    }
  };
  public pieChartLabels: string[] = [
    'Missing email',
    'Missing phone number',
    'Missing email & phone number'
  ];
  private pieOrgChartLabels: string[] = [
    'Missing email',
    'Missing phone number',
    'Missing email & phone number'
  ];
  public pieChartData: ChartDataset[] = [
    {
      data: [0, 0, 0],
      backgroundColor: ['#E4E0F3', '#9185D2', '#362A77'],
      hoverBackgroundColor: ['#E4E0F3', '#9185D2', '#362A77']
    },
    {
      data: [0]
    }
  ];
  public pieChartType: ChartType = 'doughnut';
  public pieChartLegend = false;
  public pieChartPlugins = [];

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    },
    onClick: (event: ChartEvent, element) => {
      if (event && event['chart']) {
        const dataIndex = element[0].index;
        const sItem = this.automationAnalytics[dataIndex];
        this.zone.run(() => {
          this.filterContacts(sItem.id, this.automationRange);
        });
      }
      // if (element && element[0] && element[0]['_model']) {
      //   this.zone.run(() => {
      //     const optionLabel = element[0]['_model']['label'];
      //     const optionId = LABEL_ID_DIC[optionLabel];
      //     const option = { id: optionId, range: this.automationRange };
      //     this.router.navigate(['/contacts'], {
      //       queryParams: { filter: JSON.stringify(option) }
      //     });
      //   });
      // }
    }
  };
  public barChartLabels: string[] = [
    'Never automated',
    'On automation',
    'Recently off automation'
  ];
  private barOrgChartLabels: string[] = [
    'Never automated',
    'On automation',
    'Recently off automation'
  ];
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = [];
  public barChartData: ChartDataset[] = [
    {
      data: [0, 0, 0],
      label: 'Contacts',
      barThickness: 26,
      maxBarThickness: 28,
      backgroundColor: ['#E4E0F3', '#9185D2', '#362A77'],
      hoverBackgroundColor: ['#E4E0F3', '#9185D2', '#362A77']
    }
  ];

  preloadSubscription: Subscription;
  contactCreateSubscription: Subscription;
  private langChangeSubscription: Subscription;

  constructor(
    private contactService: ContactService,
    private router: Router,
    private translateService: TranslateService,
    private zone: NgZone
  ) {
    this.contactCreateSubscription &&
      this.contactCreateSubscription.unsubscribe();
    this.contactCreateSubscription = this.contactService.created$.subscribe(
      (res) => {
        this.loadFieldAnalytics();
      }
    );
    this.langChangeSubscription = this.translateService.onLangChange.subscribe(
      (event: LangChangeEvent) => {
        this.translateService.get(this.barOrgChartLabels).subscribe((res) => {
          this.barChartLabels = Object.values(res);
        });
        this.translateService.get(this.pieOrgChartLabels).subscribe((res) => {
          this.pieChartLabels = Object.values(res);
        });
      }
    );
  }

  ngOnInit(): void {
    this.preloadUI();
    this.loadFieldAnalytics();
    this.loadAutomationAnalytics();
    this.loadRatesAnalytics();
    this.loadActivityAnalytics();
    this.loadProspectLists();
    this.loadPulseReports();
  }

  ngOnDestroy(): void {
    // pieChartData && pieChartLabels && fieldAnalytics
    // barChartData && barChartLabels && automationAnalytics
    // rateAnalytics
    // activityAnalytics
    this.preloadSubscription && this.preloadSubscription.unsubscribe();
    this.contactCreateSubscription &&
      this.contactCreateSubscription.unsubscribe();
    const analytics = {
      fieldAnalytics: this.fieldAnalytics,
      automationAnalytics: this.automationAnalytics,
      rateAnalytics: this.rateAnalytics,
      activityAnalytics: this.activityAnalytics
    };
    this.contactService.analytics.next(analytics);
    this.langChangeSubscription && this.langChangeSubscription.unsubscribe();
  }

  /**
   * Preload the data from analytics
   */
  preloadUI(): void {
    this.preloadSubscription = this.contactService.analytics$.subscribe(
      (_data) => {
        if (_data) {
          const {
            fieldAnalytics,
            automationAnalytics,
            rateAnalytics,
            activityAnalytics
          } = _data;
          console.log('preload ui ==========>', _data);
          if (fieldAnalytics?.length) {
            const labels = [];
            const data = [];
            const colors = [];
            fieldAnalytics.forEach((e) => {
              labels.push(e.id);
              data.push(e.count);
              colors.push(e.color);
            });
            this.pieChartData[0]['data'] = data;
            this.pieChartData[0]['backgroundColor'] = colors;
            this.pieOrgChartLabels = labels as string[];
            this.translateService.get(labels).subscribe((res) => {
              this.pieChartLabels = Object.values(res);
            });
            this.fieldAnalytics = fieldAnalytics;
          }
          if (automationAnalytics?.length) {
            const labels = [];
            const data = [];
            const colors = [];
            automationAnalytics.forEach((e) => {
              labels.push(e.id);
              data.push(e.count);
              colors.push(e.color);
            });
            this.barChartData[0]['data'] = data;
            this.barOrgChartLabels = labels;
            this.translateService.get(labels).subscribe((res) => {
              this.barChartLabels = Object.values(res);
            });

            this.automationAnalytics = automationAnalytics;
          }
          if (rateAnalytics?.length) {
            this.rateAnalytics = rateAnalytics;
          }
          if (activityAnalytics?.length) {
            this.activityAnalytics = activityAnalytics;
          }
        }
      }
    );
  }

  loadFieldAnalytics(): void {
    this.loadingFieldAnalytics = true;
    this.contactService
      .analyticsByFields(this.fieldOptions)
      .subscribe((res) => {
        this.loadingFieldAnalytics = false;
        this.fillFieldAnalytics(res);
      });
  }

  fillFieldAnalytics(res): void {
    const labels = [];
    const data = [];
    const colors = [];
    const analytics = [];
    res.forEach((e, index) => {
      labels.push(e.id);
      data.push(e.count);
      colors.push(COLORS[index]);
      analytics.push({
        id: e.id,
        count: e.count,
        color: COLORS[index]
      });
    });
    this.pieOrgChartLabels = labels as string[];
    this.translateService.get(labels).subscribe((res) => {
      this.pieChartLabels = Object.values(res);
    });
    this.pieChartData[0]['data'] = data;
    this.pieChartData[0]['backgroundColor'] = colors;
    this.fieldAnalytics = analytics;
  }

  loadAutomationAnalytics(): void {
    this.loadingAutomationAnalytics = true;
    this.contactService
      .analyticsByAutomation(this.automationRange)
      .subscribe((res) => {
        this.loadingAutomationAnalytics = false;
        const { neverAutomated, recentOffAutomation, onAutomation } = res;
        const data = [
          neverAutomated.contactCount || 0,
          onAutomation.contactCount || 0,
          recentOffAutomation.contactCount || 0
        ];
        this.barChartData[0]['data'] = [...data];
        const oBarLabels = [...this.barChartLabels];
        this.barOrgChartLabels = oBarLabels;
        this.translateService.get(oBarLabels).subscribe((res) => {
          this.barChartLabels = Object.values(res);
        });
        const contact_count =
          neverAutomated.contactCount +
          onAutomation.contactCount +
          recentOffAutomation.contactCount;
        const deal_count =
          neverAutomated.dealCount +
          onAutomation.dealCount +
          recentOffAutomation.dealCount;
        this.automationAnalytics = [
          {
            id: 'Contacts',
            count_on: onAutomation.contactCount,
            percent_on: Math.ceil(
              (onAutomation.contactCount / contact_count) * 100
            ),
            color_on: '#E4E0F3',
            count_off: recentOffAutomation.contactCount,
            percent_off: Math.ceil(
              (recentOffAutomation.contactCount / contact_count) * 100
            ),
            color_off: '#362A77',
            count_never: neverAutomated.contactCount,
            percent_never: Math.ceil(
              (neverAutomated.contactCount / contact_count) * 100
            ),
            color_never: '#9185D2'
          },
          {
            id: 'Deals',
            count_on: onAutomation.dealCount,
            percent_on: Math.ceil((onAutomation.dealCount / deal_count) * 100),
            color_on: '#E4E0F3',
            count_off: recentOffAutomation.dealCount,
            percent_off: Math.ceil(
              (recentOffAutomation.dealCount / deal_count) * 100
            ),
            color_off: '#362A77',
            count_never: neverAutomated.dealCount,
            percent_never: Math.ceil(
              (neverAutomated.dealCount / deal_count) * 100
            ),
            color_never: '#9185D2'
          }
        ];
      });
  }

  loadRatesAnalytics(): void {
    this.loadingRatesAnalytics = true;
    this.contactService.analyticsByRate().subscribe((res) => {
      this.loadingRatesAnalytics = false;
      this.rateAnalytics.forEach((e) => {
        e.count = 0;
        e.percentage = 0;
      });
      let totalCount = 0;
      res.forEach((e) => {
        totalCount += e.count;
        if (e._id) {
          this.rateAnalytics[e._id - 1]['count'] = e.count;
        }
      });
      let noRatePercentage = 100;
      let noRateCount = totalCount;
      this.rateAnalytics.forEach((e) => {
        e.percentage = Math.ceil((e.count / totalCount) * 100);
        noRateCount -= e.count;
        noRatePercentage -= e.percentage;
      });
      if (noRatePercentage < 0) {
        noRatePercentage = 0;
        noRateCount = 0;
      }
      this.rateAnalytics[5].percentage = noRatePercentage;
      this.rateAnalytics[5].count = noRateCount;
    });
  }

  loadActivityAnalytics(): void {
    this.loadingActivityAnalytics = true;
    this.contactService
      .analyticsByActivities(this.activityOptions)
      .subscribe((res) => {
        this.loadingActivityAnalytics = false;
        this.activityAnalytics = res;
      });
  }

  calculateRates(): void {
    if (this.calculating) {
      return;
    }
    this.calculating = true;
    this.contactService.calculateRates().subscribe(() => {
      this.calculating = false;
      this.loadRatesAnalytics();
    });
  }

  filterContacts(id: string, range = 125): void {
    const option = { id, range };
    this.router.navigate(['/contacts'], {
      queryParams: { filter: JSON.stringify(option) }
    });
  }

  loadProspectLists(): void {
    this.loadingProspectLists = true;
    setTimeout(() => {
      this.loadingProspectLists = false;
    }, 1000);
  }

  loadPulseReports(): void {
    this.loadingPulseReports = true;
    setTimeout(() => {
      this.loadingPulseReports = false;
    }, 1000);
  }

  changeSort(type: any): void {
    this.sortType = type;
  }
}
