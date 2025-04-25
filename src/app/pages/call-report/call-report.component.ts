import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { DialerService } from '@services/dialer.service';
import { Router } from '@angular/router';
import { Contact } from '@models/contact.model';
import { MatDrawer } from '@angular/material/sidenav';
import { SearchOption } from '@models/searchOption.model';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';

const TimeReportItems = [
  'Today',
  'Yesterday',
  'This Week',
  'Last Week',
  'This Month',
  'Last Month',
  'For a week',
  'For a month'
];
const LabelReportItems = [
  'Interested',
  'Not Interested',
  'Callback Set',
  'Appointment Set',
  'Voice Message',
  'No Answer',
  'Wrong Number',
  'Trash'
];
const StatusReportItems = [
  'HUNG_UP',
  'USER_HUNG_UP',
  'NO_ANSWER',
  'BUSY',
  'DISCONNECTED',
  'CALLBACK',
  'VOICEMAIL',
  'NO_CALLBACK',
  'NO_VOICEMAIL',
  'UNKNOWN'
];
const StatusReportItemDescription = {
  HUNG_UP: 'Call Ended',
  USER_HUNG_UP: 'Call Ended',
  NO_ANSWER: 'The call rang, but no one picked up.',
  BUSY: 'The number was busy when you called.',
  DISCONNECTED: 'The number is no longer in service.',
  CALLBACK: 'Your callback message was played.',
  VOICEMAIL: 'Your voicemail message was played.',
  NO_CALLBACK:
    'No callback message played (you haven’t recorded one yet).',
  NO_VOICEMAIL:
    'No voicemail message played (you haven’t recorded one yet).',
  UNKNOWN: 'The call ended, but we couldn’t tell why.'
};
@Component({
  selector: 'app-call-report',
  templateUrl: './call-report.component.html',
  styleUrls: ['./call-report.component.scss']
})
export class CallReportComponent implements OnInit {
  pageSize = 50;
  DISPLAY_COLUMNS: string[] = [
    'contact',
    'email',
    'phone',
    'label',
    'status',
    'duration',
    'note',
    'created_at'
  ];
  SORT_TYPES = [
    { id: 'alpha_up', label: 'Alphabetical Z-A' },
    { id: 'alpha_down', label: 'Alphabetical A-Z' },
    { id: 'last_called', label: 'Last called' },
    { id: 'status', label: 'Status' }
  ];
  sortType = this.SORT_TYPES[2];
  OutcomeDescDic = StatusReportItemDescription;

  // Report Count Data
  reportData = {
    time: [],
    label: [],
    status: []
  };

  // Total calls count that are made
  totalLogsCount = 0;
  // Total duration of calls
  totalDuration = 0;
  // Average line duration
  avgDuration = 0;
  // Average duration during conversation
  avgConversationDuration = 0;
  // Selected item to show in more detail
  selectedReportItem: any = null;
  // Duration for the reports
  logDayItem: any = null;
  // Duration for the logs
  reportDayItem: any = null;
  // logs count to show in table
  selectedReportLogsCount = 0;
  // logs to show in table
  callLogs: any[] = [];
  // page number of current table
  page = 1;
  // loading status of the logs
  loadingLogs = false;
  // string to the search contacts
  searchStr = '';
  // loading status of the report data
  loadingReport = false;

  // load subscription for api call
  reportDataLoadSubscription: Subscription;
  statisticDataLoadSubscritpion: Subscription;
  logsLoadSubscription: Subscription;

  constructor(private dialerService: DialerService, private router: Router) {
    const page = localStorage.getCrmItem(KEY.CALL_LOG.PAGE);
    const reportDayItem = localStorage.getCrmItem(KEY.CALL_LOG.SORT_DURATION);
    const sortType = localStorage.getCrmItem(KEY.CALL_LOG.SORT_ALPHABET);
    if (page) {
      this.page = parseInt(page);
    }
    if (reportDayItem) {
      const parsedDayItem = JSONParser(reportDayItem);
      if (parsedDayItem) {
        this.reportDayItem = parsedDayItem;
      }
    }
    if (sortType) {
      const parsedSortType = JSONParser(sortType);
      if (parsedSortType) {
        this.sortType = parsedSortType;
      }
    }
  }

  ngOnInit(): void {
    this.initStatistics();
    this.dialerService.loadReportData();
    this.loadCallLogs();
    this.changeReportDurationGap(this.reportDayItem);
  }

  /**
   * Init the loading of the statistics data
   */
  initStatistics(): void {
    this.reportDataLoadSubscription &&
      this.reportDataLoadSubscription.unsubscribe();
    this.reportDataLoadSubscription =
      this.dialerService.statusReports$.subscribe((res) => {
        this.generateReportData(res);
      });
  }

  /**
   * Load Statistics
   */
  loadStatistics(data): void {
    this.loadingReport = true;
    this.statisticDataLoadSubscritpion &&
      this.statisticDataLoadSubscritpion.unsubscribe();
    this.statisticDataLoadSubscritpion = this.dialerService
      .loadStatistics(data)
      .subscribe((res) => {
        this.loadingReport = false;
        this.generateReportData(res);
      });
  }

  /**
   * Generate the data to display
   * @param res: report data api result
   */
  generateReportData(res): void {
    let result = [];
    try {
      result = JSON.parse(JSON.stringify(res || []));
    } catch (err) {
      result = [];
    }
    const data = {};
    (result || []).forEach((e) => {
      data[e.type] = e.data;
    });
    if (!data['time']) {
      data['time'] = [];
    }

    let totalCount = 0;
    let totalDur = 0;
    (data['status'] || []).forEach((e) => {
      totalCount += e?.count || 0;
      totalDur += e?.duration || 0;
    });
    this.totalLogsCount = totalCount;
    this.totalDuration = totalDur;
    this.selectedReportLogsCount = totalCount;
    const timeReports = _.keyBy(data['time'], (e) => e.label);
    const labelReports = _.keyBy(data['label'], (e) => e._id || 'Other');
    const statusReports = _.keyBy(data['status'], (e) => e._id || 'UNKNOWN');
    const reportResult = {
      time: [],
      label: [],
      status: []
    };
    if (data['time'].length) {
      TimeReportItems.forEach((e) => {
        reportResult.time.push({
          label: e,
          ...timeReports[e]
        });
        delete timeReports[e];
      });
      for (const key in timeReports) {
        reportResult.time.push({
          ...timeReports[key]
        });
      }
    }
    LabelReportItems.forEach((e) => {
      reportResult.label.push({
        label: e,
        ...labelReports[e]
      });
      delete labelReports[e];
    });
    for (const key in labelReports) {
      reportResult.label.push({
        label: key,
        ...labelReports[key]
      });
    }
    StatusReportItems.forEach((e) => {
      reportResult.status.push({
        label: e,
        ...statusReports[e]
      });
      delete statusReports[e];
    });
    for (const key in statusReports) {
      reportResult.status.push({
        label: key,
        ...statusReports[key]
      });
    }
    if (!data['time'].length) {
      delete reportResult['time'];
    }
    this.reportData = { ...this.reportData, ...reportResult };
  }

  /**
   * Loading all logs by default
   */
  loadCallLogs(): void {
    this.changePage(1);
  }

  /**
   * Select the type to loading the calls
   * @param item
   * @param type
   */
  selectType(item: any = null, type = '', force = false): void {
    // generate the current log duration based on the report duration
    this.logDayItem = this.reportDayItem ? { ...this.reportDayItem } : null;
    if (this.reportDayItem) {
      this.selectedReportItem = {
        duration: {
          start: this.logDayItem.duration.start,
          end: this.logDayItem.duration.end
        },
        query: '',
        label: this.logDayItem.label
      };
    }
    if (!item) {
      this.page = 0;
      this.selectedReportItem = {
        ...this.selectedReportItem,
        query: null,
        label: null
      };
      this.changePage(1);
      return;
    }
    let query;
    if (type === 'label') {
      query = { label: item.label };
    } else if (type === 'status') {
      if (item.label === 'UNKNOWN') {
        query = { status: { $in: [null, 'UNKNOWN'] } };
      } else {
        query = { status: item.label };
      }
    }
    if (!this.selectedReportItem) {
      this.selectedReportItem = {};
    }
    this.selectedReportItem.query = query;
    this.selectedReportItem.label = item.label;
    this.changePage(1);
    document
      .querySelector('#call-logs-list')
      .scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Load the call logs that correspond to the logs
   * @param pageNumber: page number
   */
  changePage(pageNumber: number): void {
    const skip = (pageNumber - 1) * this.pageSize;
    this.page = pageNumber;

    this.loadingLogs = true;
    this.logsLoadSubscription && this.logsLoadSubscription.unsubscribe();
    this.logsLoadSubscription = this.dialerService
      .loadLogs({
        skip,
        limit: this.pageSize,
        query: this.selectedReportItem?.query,
        keyword: this.searchStr || '',
        duration: this.selectedReportItem?.duration,
        sortBy: this.sortType.id
      })
      .subscribe((res) => {
        this.loadingLogs = false;
        this.selectedReportLogsCount =
          res?.count || this.selectedReportLogsCount || 0;
        this.callLogs = (res?.data || []).map((e) => {
          if (e.contact instanceof Array) {
            e.contact = e.contact[0];
          }
          return e;
        });
      });
    localStorage.setCrmItem(KEY.CALL_LOG.PAGE, pageNumber + '');
  }

  /**
   * Change Duration the display the reports
   * @param item:
   * @returns
   */
  changeReportDurationGap(item: any = null): void {
    if (!item) {
      this.page = 0;
      this.selectedReportItem = null;
      this.reportDayItem = null;
      this.loadStatistics(null);
      this.changeLogsDurationGap(null);
      localStorage.removeCrmItem(KEY.CALL_LOG.SORT_DURATION);
      return;
    }
    this.reportDayItem = {
      duration: { start: item.start, end: item.end },
      query: '',
      label: item.label,
      id: 'time' + '_' + item.label
    };
    this.loadStatistics({ start: item.start, end: item.end });
    this.changeLogsDurationGap(item);
    localStorage.setCrmItem(KEY.CALL_LOG.SORT_DURATION, JSON.stringify(item));
  }

  /**
   * Change Duration the display the logs
   * @param item:
   * @returns
   */
  changeLogsDurationGap(item: any = null): void {
    if (!item) {
      this.page = 0;
      this.logDayItem = null;
      this.reportDayItem = null;
      this.changePage(1);
      return;
    }
    this.logDayItem = {
      duration: { start: item.start, end: item.end },
      query: '',
      label: item.label,
      id: 'time' + '_' + item.label
    };
    this.selectedReportItem = {
      duration: { start: item.start, end: item.end },
      query: '',
      label: item.label
    };
    this.selectedReportLogsCount = item.count;
    this.changePage(1);
  }

  /**
   * Change the search keyword
   */
  changeSearchStr(): void {
    this.changePage(1);
  }

  /**
   * Clear the search keyword
   */
  clearSearchStr(): void {
    this.searchStr = '';
    this.changePage(1);
  }

  /**
   * Open the contact detail page
   * @param contact : contact
   */
  openContact(contact: any): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  getAvatarName(data: any): string {
    const contact = new Contact().deserialize(data);
    return contact.avatarName;
  }

  /**
   * Change the sort column and dir
   * @param type: Sort Type
   */
  changeSort(type: any): void {
    this.sortType = type;
    this.changePage(this.page);
    localStorage.setCrmItem(KEY.CALL_LOG.SORT_ALPHABET, JSON.stringify(type));
  }
}
