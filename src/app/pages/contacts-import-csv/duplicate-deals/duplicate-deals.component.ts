import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import _ from 'lodash';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { EditDealComponent } from '@components/edit-deal/edit-deal.component';
import { DialogSettings } from '@constants/variable.constants';
import { DealsService } from '@services/deals.service';
import { DealGroup } from '@utils/data.types';
import { groupRelativeDeals } from '@utils/deal';
import { MergeDealsComponent } from '@components/merge-deals/merge-deals.component';

@Component({
  selector: 'app-duplicate-deals',
  templateUrl: './duplicate-deals.component.html',
  styleUrls: ['./duplicate-deals.component.scss']
})
export class DuplicateDealsComponent implements OnInit {
  @Input() dealGroups: DealGroup[] = [];
  @Input() failedDeals: any[] = [];
  @Input() stages: any[] = [];
  @Output() onPrev = new EventEmitter();
  @Output() onNext = new EventEmitter();

  PAGE_COUNTS = [
    { id: 5, label: '5' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  page: number = 1;
  pageSize = this.PAGE_COUNTS[0];
  loading = true;

  deleteDealSubscription: Subscription;
  bulkDeleteDealsSubscription: Subscription;

  constructor(private dialog: MatDialog, private dealService: DealsService) {}

  ngOnInit(): void {
    const dealGroupIds = [];
    this.dealGroups.forEach((e) => {
      const deals = e.deals.map((e) => e.id);
      dealGroupIds.push(deals);
    });
    this.dealGroups = groupRelativeDeals(dealGroupIds, this.failedDeals);
  }

  ngOnDestroy(): void {
    this.deleteDealSubscription && this.deleteDealSubscription.unsubscribe();
  }

  getDealStageLabel(stageId: any): string {
    const dealStage = this.stages.find((e) => e._id === stageId);
    if (dealStage) {
      return dealStage.title;
    }
    return '';
  }

  onChangePage(page: number): void {
    this.page = page;
  }

  onChangePageSize(type: any): void {
    this.pageSize = type;
  }

  getGroupId(gIndex: number): string {
    return (this.page - 1) * this.pageSize.id + gIndex + '';
  }

  selectGroup(group: DealGroup): void {
    const selected = this.selectedGroup(group);
    if (selected) group.selection = [];
    else group.selection = group.deals.map((e) => e.id);
  }

  selectedGroup(group: DealGroup): boolean {
    for (const deal of group.deals) {
      if (!group.selection.includes(deal.id)) return false;
    }
    return true;
  }

  selectDeal(group: DealGroup, deal: any): void {
    const selected = this.selectedDeal(group, deal);
    if (selected) {
      group.selection = group.selection.filter((e) => e !== deal.id);
    } else {
      group.selection.push(deal.id);
    }
  }

  selectedDeal(group: DealGroup, deal: any): boolean {
    return group.selection.indexOf(deal.id) > -1;
  }

  setPrimary(deal: any, contact: any): void {
    deal.primary_contact = contact;
  }

  editDeal(deal: any, group: DealGroup, dIndex: number, gIndex: number): void {
    if (group.saving) return;
    this.dialog
      .open(EditDealComponent, {
        ...DialogSettings.DEAL,
        maxWidth: '800px',
        maxHeight: '800px',
        data: {
          deal: { ...deal },
          contacts: group.unique_contacts,
          stages: this.stages
        }
      })
      .afterClosed()
      .subscribe((edit) => {
        if (edit && edit.id) {
          if (!group.completed) group.completed = true;
          group.deals[dIndex] = edit;
          const index = (this.page - 1) * this.pageSize.id + gIndex;
          this.dealGroups[index] = group;
        }
      });
  }

  removeDeal(deal: any, group: DealGroup, gIndex: number): void {
    if (group.saving) return;
    const confirmDlg = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      maxWidth: '500px',
      disableClose: true,
      data: {
        title: 'Confirm!',
        message: `Do you want to delete the deal?`,
        confirmLabel: 'Delete',
        mode: 'warning',
        cancelLabel: 'No'
      }
    });
    confirmDlg.afterClosed().subscribe((res) => {
      if (res) {
        group.saving = true;
        this.deleteDealSubscription &&
          this.deleteDealSubscription.unsubscribe();
        this.deleteDealSubscription = this.dealService
          .deleteDeal(deal.id)
          .subscribe((success) => {
            group.saving = false;
            if (success) {
              if (!group.completed) group.completed = true;
              group.deals = group.deals.filter((e) => e.id !== deal.id);
              const index = (this.page - 1) * this.pageSize.id + gIndex;
              this.dealGroups[index] = group;
            }
          });
      }
    });
  }

  bulkRemoveDeals(group: DealGroup, gIndex: number): void {
    if (group.saving) return;
    const confirmDlg = this.dialog.open(ConfirmComponent, {
      ...DialogSettings.CONFIRM,
      maxWidth: '500px',
      disableClose: true,
      data: {
        title: 'Confirm!',
        message: `Do you want to delete the ${group.selection.length} deals?`,
        confirmLabel: 'Delete',
        mode: 'warning',
        cancelLabel: 'No'
      }
    });
    confirmDlg.afterClosed().subscribe((res) => {
      if (res) {
        group.saving = true;
        this.bulkDeleteDealsSubscription &&
          this.bulkDeleteDealsSubscription.unsubscribe();
        this.bulkDeleteDealsSubscription = this.dealService
          .bulkDelete({ deals: group.selection })
          .subscribe((deals) => {
            if (deals && deals.length) {
              group.saving = false;
              if (!group.completed) group.completed = true;
              group.deals = group.deals.filter((e) => !deals.indexOf(e.id));
              const index = (this.page - 1) * this.pageSize.id + gIndex;
              this.dealGroups[index] = group;
            }
          });
      }
    });
  }

  mergeDeals(group: DealGroup, gIndex: number): void {
    if (group.saving) return;
    const deals = group.deals.filter(
      (deal) => group.selection.indexOf(deal.id) > -1
    );
    const contacts = [];
    deals.forEach((e) => {
      contacts.push(...e.contacts);
    });
    const unique_contacts = _.uniqBy(contacts, '_id');
    this.dialog
      .open(MergeDealsComponent, {
        ...DialogSettings.DEAL,
        maxWidth: '800px',
        maxHeight: '800px',
        data: {
          deals: deals,
          contacts: unique_contacts,
          stages: this.stages
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          group.selection = group.selection.filter(
            (e) => res.deletions.indexOf(e) === -1
          );
          const deals = group.deals.filter(
            (e) => res.deletions.indexOf(e.id) === -1
          );
          const dealIndex = deals.findIndex((e) => e.id === res.merge.id);
          if (dealIndex > -1) {
            deals[dealIndex] = res.merge;
          }
          group.deals = deals;
          if (!group.completed) group.completed = true;
          const index = (this.page - 1) * this.pageSize.id + gIndex;
          this.dealGroups[index] = group;
        }
      });
  }

  showBulkRemove(group: DealGroup): boolean {
    let csvDealSelected = false;
    for (const deal of group.deals) {
      if (group.selection.indexOf(deal.id) > -1 && !deal._id) {
        csvDealSelected = true;
        break;
      }
    }
    return group.selection.length > 0 && !csvDealSelected;
  }

  groupContactsLength(group: DealGroup): number {
    const contacts = [];
    group.deals.forEach((deal) => {
      contacts.push(...deal.contacts);
    });
    return contacts.length;
  }

  create(): void {
    this.onNext.emit(this.dealGroups);
  }

  close(): void {
    this.onPrev.emit();
  }
}
