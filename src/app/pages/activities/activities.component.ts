import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { STATUS } from '@constants/variable.constants';
import { ActivityService } from '@services/activity.service';
import { ContactService } from '@services/contact.service';
import { HandlerService } from '@services/handler.service';
import { StoreService } from '@services/store.service';
import { ColumnEditComponent } from '@components/column-edit/column-edit.component';
import { JSONParser } from '@utils/functions';
import * as _ from 'lodash';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss']
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  STATUS = STATUS;
  /* DISPLAY_COLUMNS = [
    'contact_name',
    'contact_label',
    'activity',
    'activity_time',
    'contact_email',
    'contact_phone',
    'contact_address'
  ]; */
  DEFAULT_ALL_COLUMNS = [
    {
      id: 'contact_name',
      name: 'Contact Name',
      selected: true,
      order: 0
    },
    {
      id: 'contact_label',
      name: 'Label',
      selected: true,
      order: 1
    },
    {
      id: 'activity',
      name: 'Last Activity',
      selected: true,
      order: 2
    },
    {
      id: 'activity_time',
      name: 'Time',
      selected: true,
      order: 3
    },
    {
      id: 'contact_email',
      name: 'Email',
      selected: true,
      order: 4
    },
    {
      id: 'contact_phone',
      name: 'Phone',
      selected: true,
      order: 5
    },
    {
      id: 'contact_address',
      name: 'Address',
      selected: true,
      order: 6
    },
    {
      id: 'contact_tags',
      name: 'Tags',
      selected: false,
      order: 7
    },
    {
      id: 'country',
      name: 'Country',
      selected: false,
      order: 8
    },
    {
      id: 'state',
      name: 'State',
      selected: false,
      order: 9
    },
    {
      id: 'city',
      name: 'City',
      selected: false,
      order: 10
    }
  ];

  DISPLAY_COLUMNS = [];

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 20, label: '20' },
    { id: 50, label: '50' }
  ];

  isUpdating = false;
  updateSubscription: Subscription;

  pageSize = this.PAGE_COUNTS[2];
  page = 1;

  columnsTarget = 'activity_columns';

  constructor(
    public handlerService: HandlerService,
    public storeService: StoreService,
    public activityService: ActivityService,
    private contactService: ContactService,
    private dialog: MatDialog,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    //Read localstorage for columns
    this.initColumns();

    const currentPageSize = this.activityService.pageSize.getValue();
    this.PAGE_COUNTS.some((e) => {
      if (e.id === currentPageSize) {
        this.pageSize = e;
        return true;
      }
    });
    this.activityService.load(0);
  }

  ngOnDestroy(): void {
    this.activityService.pageSize.next(this.pageSize.id);
  }

  changePage(page: number): void {
    this.page = page;
    this.activityService.load(page);
  }

  onOverPages(page: number): void {
    this.changePage(page);
  }

  changePageSize(type: any): void {
    // Calculate New Page
    const newPage =
      Math.floor((this.pageSize.id * (this.page - 1)) / type.id) + 1;

    this.pageSize = type;
    this.activityService.pageSize.next(type.id);
    this.changePage(newPage);
  }

  updateLabel(label: string, _id: string): void {
    const newLabel = label ? label : null;
    const ids = [_id];
    this.isUpdating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.contactService
      .bulkUpdate(ids, { label: newLabel }, {})
      .subscribe((status) => {
        this.isUpdating = false;
        if (status) {
          this.handlerService.bulkContactUpdate$(ids, { label: newLabel }, {});
        }
      });
  }

  loadPage(param: string): void {
    if (param === 'first') {
      this.activityService.load(null);
      return;
    }
    if (param === 'next') {
      const last_activity = this.storeService.activities
        .getValue()
        .slice(-1)[0];
      let ids;
      if (
        last_activity.additional_field &&
        last_activity.additional_field.length
      ) {
        ids = [...last_activity.additional_field, last_activity._id];
      } else {
        ids = [last_activity._id];
      }
      ids.sort((a, b) => (a < b ? -1 : 1));
      this.activityService.load({ starting_after: ids[0] });
      return;
    }
    if (param === 'prev') {
      // this.activityService.load(0);
      const first_activity = this.storeService.activities.getValue()[0];
      let ids = [];
      if (
        first_activity.additional_field &&
        first_activity.additional_field.length
      ) {
        ids = [...first_activity.additional_field, first_activity._id];
      } else {
        ids = [first_activity._id];
      }
      ids.sort((a, b) => (a > b ? -1 : 1));
      this.activityService.load({ ending_before: ids[0] });
      return;
    }
  }

  private initColumns(): void {
    const columns = localStorage.getCrmItem(this.columnsTarget);
    let displayColumns = [];
    if (columns) {
      const parsedData = JSONParser(columns);
      if (parsedData && typeof parsedData[0] !== 'string') {
        for (let i = 0; i < this.DEFAULT_ALL_COLUMNS.length; i++) {
          const index = _.findIndex(parsedData, {
            id: this.DEFAULT_ALL_COLUMNS[i].id
          });
          if (index !== -1) {
            this.DEFAULT_ALL_COLUMNS[i].selected = parsedData[index].selected;
            this.DEFAULT_ALL_COLUMNS[i].order = parsedData[index].order;
          }
        }
        this.DEFAULT_ALL_COLUMNS.sort((a, b) => a.order - b.order);
        displayColumns = this.DEFAULT_ALL_COLUMNS.filter((e) => e.selected).map(
          (e) => e.id
        );
      } else {
        const allColumnIds = this.DEFAULT_ALL_COLUMNS.map((e) => e.id);
        displayColumns = _.intersection(parsedData, allColumnIds);
      }
    }
    if (!displayColumns?.length) {
      displayColumns = this.DEFAULT_ALL_COLUMNS.filter((e) => e.selected).map(
        (e) => e.id
      );
    }
    localStorage.setCrmItem(this.columnsTarget, JSON.stringify(displayColumns));
    this.setDisplayColumns(displayColumns);
  }

  openColumnEdit(): void {
    this.dialog
      .open(ColumnEditComponent, {
        position: { top: '100px' },
        width: '150vw',
        maxWidth: '1000px',
        data: {
          defaultColumns: this.DEFAULT_ALL_COLUMNS,
          customColumns: [],
          columnsTarget: this.columnsTarget
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.selectedColumns) {
          const selectCols = [...res.selectedColumns];
          localStorage.setCrmItem(
            this.columnsTarget,
            JSON.stringify(selectCols)
          );
          this.setDisplayColumns(selectCols);
        }
      });
  }

  setDisplayColumns(columns): void {
    this.DISPLAY_COLUMNS = columns;
  }
}
