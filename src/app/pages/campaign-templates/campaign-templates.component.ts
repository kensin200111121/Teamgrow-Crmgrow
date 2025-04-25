import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { BulkActions, STATUS } from '@constants/variable.constants';
import { Theme } from '@models/theme.model';
import * as _ from 'lodash';
import { ThemeService } from '@services/theme.service';
import { searchReg } from '@app/helper';
import { sortStringArray } from '@utils/functions';
import moment from 'moment-timezone';
@Component({
  selector: 'app-campaign-templates',
  templateUrl: './campaign-templates.component.html',
  styleUrls: ['./campaign-templates.component.scss']
})
export class CampaignTemplatesComponent implements OnInit {
  newsletters = [];
  DISPLAY_COLUMNS = [
    'select',
    'thumbnail',
    'title',
    'videos',
    'pdfs',
    'images',
    'time',
    'actions'
  ];
  ACTIONS = BulkActions.CampaignTemplates;
  STATUS = STATUS;

  selectedLists = new SelectionModel<any>(true, []);
  isLoading = false;

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  searchStr = '';
  filteredResult = [];
  selectedSort = '';
  page = 1;
  searchCondition = {
    title: false,
    status: false
  };

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.themeService.getNewsletters(true);
    this.themeService.newsletters$.subscribe((newsletters) => {
      this.isLoading = false;
      this.deselectAll();
      if (newsletters) {
        this.newsletters = newsletters;
        this.newsletters = _.uniqBy(this.newsletters, '_id');
        this.filteredResult = this.newsletters;
      }
    });
  }

  isSelectedPage(): any {
    if (this.newsletters.length) {
      for (let i = 0; i < this.newsletters.length; i++) {
        const e = this.newsletters[i];
        if (!this.selectedLists.isSelected(e._id)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  selectAllPage(): void {
    if (this.isSelectedPage()) {
      this.newsletters.forEach((e) => {
        if (this.selectedLists.isSelected(e._id)) {
          this.selectedLists.deselect(e._id);
        }
      });
    } else {
      this.newsletters.forEach((e) => {
        if (!this.selectedLists.isSelected(e._id)) {
          this.selectedLists.select(e._id);
        }
      });
    }
  }

  selectAll(): void {
    this.newsletters.forEach((e) => {
      if (!this.selectedLists.isSelected(e._id)) {
        this.selectedLists.select(e._id);
      }
    });
  }

  deselectAll(): void {
    this.newsletters.forEach((e) => {
      if (this.selectedLists.isSelected(e._id)) {
        this.selectedLists.deselect(e._id);
      }
    });
  }

  openTemplate(template: Theme): void {
    this.router.navigate(['/newsletter/edit/' + template._id]);
  }

  duplicateTemplate(template: Theme): void {
    this.router.navigate(['/newsletter/clone/' + template._id]);
  }

  deleteTemplate(template: Theme): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'delete_newletter',
        message: 'confirm_delete_newsletter',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.themeService.deleteNewsletter(template._id);
      }
    });
  }

  changeSearchStr(): void {
    const filtered = this.newsletters.filter((list) => {
      const str = list.title;
      return searchReg(str, this.searchStr);
    });
    this.filteredResult = filtered;
    this.sort(this.selectedSort, true);
    this.page = 1;
  }
  sort(field: string, keep = false) {
    if (this.selectedSort !== field) {
      this.selectedSort = field;
      return;
    }
    this.selectedSort = field;
    this.filteredResult = sortStringArray(
      this.filteredResult,
      field,
      this.searchCondition[field]
    );
    this.page = 1;
    if (!keep) {
      this.searchCondition[field] = !this.searchCondition[field];
    }
  }
  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }

  isAllSelected(): boolean {
    return this.filteredResult.length === this.selectedLists.selected.length;
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
            title: 'delete_newletters',
            message: 'confirm_delete_newsletters',
            confirmLabel: 'Delete',
            mode: 'warning',
            cancelLabel: 'Cancel'
          }
        });
        confirmDialog.afterClosed().subscribe((res) => {
          if (res) {
            this.themeService
              .bulkRemove(this.selectedLists.selected)
              .subscribe((res) => {
                if (res.status && res.failed && res.failed.length > 0) {
                  // const confirmBulkDialog = this.dialog.open(
                  //   ConfirmRemoveBulkMailingComponent,
                  //   {
                  //     position: { top: '100px' },
                  //     data: {
                  //       title: 'Delete Campaigns',
                  //       additional: res.failed,
                  //       message:
                  //         "You can't remove following campaigns. Click expand to see detail reason."
                  //     }
                  //   }
                  // );
                  // confirmBulkDialog.afterClosed().subscribe((res1) => {
                  //   this.themeService.reload();
                  //   this.deselectAll();
                  // });
                  console.log(res.failed);
                  this.themeService.reload();
                  this.deselectAll();
                } else if (res.status) {
                  this.themeService.reload();
                  this.deselectAll();
                }
              });
          }
        });
      }
    }
  }
}
