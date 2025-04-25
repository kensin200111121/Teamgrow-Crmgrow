import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { CampaignAddBroadcastComponent } from '@components/campaign-add-broadcast/campaign-add-broadcast.component';
import { CampaignService } from '@services/campaign.service';
import { sortStringArray } from '@utils/functions';
import {
  BulkActions,
  DialogSettings,
  STATUS,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';
import { Router } from '@angular/router';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { searchReg } from '@app/helper';
import moment from 'moment-timezone';
@Component({
  selector: 'app-campaign-bulk-mailing',
  templateUrl: './campaign-bulk-mailing.component.html',
  styleUrls: ['./campaign-bulk-mailing.component.scss']
})
export class CampaignBulkMailingComponent implements OnInit, OnDestroy {
  bulkLists = [];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  DISPLAY_COLUMNS = [
    'select',
    'title',
    'status',
    'send-time',
    'delivered',
    'opened',
    'clicked',
    'action'
  ];
  page = 1;
  pageSize = this.PAGE_COUNTS[1];
  ACTIONS = BulkActions.BulkMailing;
  STATUS = STATUS;
  filteredResult = [];
  selectedLists = new SelectionModel<any>(true, []);
  isLoading = false;
  selectedSort = '';

  profileSubscription: Subscription;

  smtpConnected = false;
  smtpVerified = false;
  searchStr = '';
  searchCondition = {
    title: false,
    status: false
  };
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    public campaignService: CampaignService
  ) {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user && user._id) {
        this.smtpVerified = user.campaign_smtp_connected;
      }
    });
    this.userService.garbage$.subscribe((res) => {
      if (res && res.smtp_info) {
        this.smtpConnected = res.smtp_info.smtp_connected || false;
      }
    });
    const pageOption = this.campaignService.pageOption.getValue();
    if (pageOption) {
      this.page = pageOption['page'];
      this.pageSize = pageOption['pageSize'];
      this.searchCondition = pageOption['searchCondition'];
      this.selectedSort = pageOption['selectedSort'];
    }
  }

  ngOnInit(): void {
    this.loadBulk();
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  loadBulk(): void {
    this.isLoading = true;
    this.campaignService.loadAll(true);
    this.campaignService.bulkLists$.subscribe(
      (res) => {
        this.isLoading = false;
        if (res) {
          this.bulkLists = res;
          this.bulkLists.forEach((e) => {
            if (e.status == 'draft') {
              return;
            }
            if (!e.contacts) {
              e.status = 'closed';
              return;
            }
            if (e.sent && e.sent >= e.contacts) {
              e.status = 'Completed';
            } else if (e.sent || e.failed) {
              e.status = 'Progressing';
            } else {
              e.status = 'Awaiting';
            }
          });
          this.filteredResult = this.bulkLists;
          if (this.selectedSort !== '') {
            this.sort(this.selectedSort, true);
          }
        }
      },
      (err) => {
        this.isLoading = false;
      }
    );
  }

  isSelectedPage(): any {
    if (this.bulkLists.length) {
      const startIndex = (Number(this.page) - 1) * Number(this.pageSize.id);
      let lastIndex = Number(this.page) * Number(this.pageSize.id);
      lastIndex =
        this.bulkLists.length > lastIndex ? lastIndex : this.bulkLists.length;
      for (let i = startIndex; i < lastIndex; i++) {
        const e = this.bulkLists[i];
        if (!this.selectedLists.isSelected(e._id)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  selectAllPage(): void {
    const startIndex = (Number(this.page) - 1) * Number(this.pageSize.id);
    let lastIndex = Number(this.page) * Number(this.pageSize.id);
    lastIndex =
      this.bulkLists.length > lastIndex ? lastIndex : this.bulkLists.length;
    const isSelected = this.isSelectedPage();
    for (let index = startIndex; index < lastIndex; index++) {
      const element = this.bulkLists[index];
      if (isSelected) {
        this.selectedLists.deselect(element._id);
      } else {
        this.selectedLists.select(element._id);
      }
    }
  }

  selectAll(): void {
    this.bulkLists.forEach((e) => {
      if (!this.selectedLists.isSelected(e._id)) {
        this.selectedLists.select(e._id);
      }
    });
  }

  deselectAll(): void {
    this.bulkLists.forEach((e) => {
      if (this.selectedLists.isSelected(e._id)) {
        this.selectedLists.deselect(e._id);
      }
    });
  }

  /**
   * Check all campaigns in page are selected.
   */
  isAllSelected(): boolean {
    return this.filteredResult.length === this.selectedLists.selected.length;
  }

  addBroadcast(): void {
    this.dialog
      .open(CampaignAddBroadcastComponent, {
        width: '96vw',
        maxWidth: '600px',
        height: 'auto',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.data) {
            const result = { ...res.data };
            if (result.sent && result.sent === result.contacts) {
              result.status = 'Completed';
            } else if (result.sent || result.failed) {
              result.status = 'Progressing';
            } else {
              result.status = 'Awaiting';
            }
            this.bulkLists = [...this.bulkLists, result];
          }
        }
      });
  }

  doAction(action: any): void {
    if (action.command === 'select') {
      this.selectAll();
    } else if (action.command === 'deselect') {
      this.deselectAll();
    } else if (action.command === 'delete') {
      if (!this.selectedLists.selected.length) {
        return;
      } else {
        const confirmDialog = this.dialog.open(ConfirmComponent, {
          position: { top: '100px' },
          data: {
            title: 'delete_bulkemail',
            message: 'confrim_delete_bulkemail',
            confirmLabel: 'Delete',
            mode: 'warning',
            cancelLabel: 'Cancel'
          }
        });
        confirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this.campaignService
              .bulkRemove(this.selectedLists.selected)
              .subscribe((res) => {
                if (res.status && res.failed && res.failed.length > 0) {
                  this.campaignService.reload();
                  this.deselectAll();
                } else if (res.status) {
                  this.campaignService.reload();
                  this.deselectAll();
                }
              });
          }
        });
      }
    }
  }

  connectSMTP(): void {
    this.router.navigate(['/bulk-mail/smtp']);
  }

  verifyEmail(): void {
    this.router.navigate(['/bulk-mail/smtp']);
  }

  changeSearchStr(): void {
    const filtered = this.bulkLists.filter((list) => {
      const str = list.title;
      return searchReg(str, this.searchStr);
    });
    this.filteredResult = filtered;
    this.sort(this.selectedSort, true);
    this.page = 1;
  }

  sort(field: string, keep = false): void {
    if (this.selectedSort !== field) {
      this.selectedSort = field;
      return;
    }
    if (!keep) {
      this.page = 1;
      this.searchCondition[field] = !this.searchCondition[field];
    }
    this.filteredResult = sortStringArray(
      this.filteredResult,
      field,
      this.searchCondition[field]
    );
    this.campaignService.updatePageOption({
      page: this.page,
      selectedSort: field,
      searchCondition: this.searchCondition
    });
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }

  changePage(page: number): void {
    this.page = page;
    this.campaignService.updatePageOption({ page });
  }

  changePageSize(type: any): void {
    this.pageSize = type;
    this.campaignService.updatePageOption({ pageSize: type });
  }

  closeCampaign(campaign: any): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'delete_bulkemail',
          message: 'confrim_delete_bulkemail',
          confirmLabel: 'Ok'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.campaignService.remove(campaign._id).subscribe((res) => {
            if (res && res['status']) {
              this.bulkLists.some((e, index) => {
                if (e._id === campaign._id) {
                  this.bulkLists.splice(index, 1);
                  if (this.selectedLists.isSelected(campaign._id))
                    this.selectedLists.toggle(campaign._id);
                  return true;
                }
              });
            }
          });
        }
      });
  }
}
