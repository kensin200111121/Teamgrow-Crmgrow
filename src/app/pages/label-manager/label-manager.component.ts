import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { LabelEditComponent } from '@components/label-edit/label-edit.component';
import { LabelService } from '@services/label.service';
import { MatDrawer } from '@angular/material/sidenav';
import * as _ from 'lodash';
import { ContactService } from '@services/contact.service';
import { NgForm } from '@angular/forms';
import { BulkActions, STATUS } from '@constants/variable.constants';
import { LabelMergeComponent } from '@components/label-merge/label-merge.component';
import { Label } from '@models/label.model';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { LabelEditColorComponent } from '@components/label-edit-color/label-edit-color.component';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LabelItem } from '@utils/data.types';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';

@Component({
  selector: 'app-label-manager',
  templateUrl: './label-manager.component.html',
  styleUrls: ['./label-manager.component.scss']
})
export class LabelManagerComponent implements OnInit {
  @ViewChild('ldrawer') ldrawer: MatDrawer;
  saveSubscription: Subscription;

  labels: LabelItem[] = []; // labels list
  pageLabels: LabelItem[] = []; // labels list per page
  isLoadingLabels = false; // flag

  newLabel: Label = new Label().deserialize({
    color: '#000',
    name: ''
  }); // the tag which is creating
  isSavingNewLabel = false; // flag

  selectedLabel: LabelItem; // the tag which is selected to see the contacts list
  selectedLabels: LabelItem[] = []; // selected labels ids list
  existingName = false;

  PAGE_COUNTS = [
    { id: 5, label: '5' },
    { id: 10, label: '10' },
    { id: 20, label: '20' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[2]; // current page type object
  page = 1; // current page

  actions = [];
  disabledActions = [];

  constructor(
    private dialog: MatDialog,
    public labelService: LabelService,
    public contactService: ContactService
  ) {
    const page = localStorage.getCrmItem(KEY.LABEL_MANAGER.PAGE);
    const pageSize = localStorage.getCrmItem(KEY.LABEL_MANAGER.PAGE_SIZE);
    if (page) {
      this.page = parseInt(page);
    }
    if (pageSize) {
      const parsedPageSize = JSONParser(pageSize);
      if (parsedPageSize) {
        this.pageSize = parsedPageSize;
      }
    }

    this.actions = BulkActions.TagManager;
    this.labelService.loadLabelsWithCount();
  }

  ngOnInit(): void {
    this.isLoadingLabels = true;
    this.labelService.labelItems$.subscribe((res) => {
      const userlabels = res.filter((item) => item.label.role !== 'admin');
      userlabels.sort((x, y) => y.label.priority - x.label.priority);
      const adminlabels = res.filter((item) => item.label.role === 'admin');
      adminlabels.sort((x, y) => x.label.priority - y.label.priority);
      this.labels = [...userlabels, ...adminlabels];
      this.loadPageLabels();
    });

    this.labelService.loadStatus$.subscribe((status) => {
      this.isLoadingLabels = status === STATUS.REQUEST;
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('overflow-hidden');
  }

  drop(event: CdkDragDrop<string[]>): void {
    this.labelService.changeOrder(event.previousIndex, event.currentIndex);
  }

  loadPageLabels(): void {
    this.selectedLabels = [];
    const length = this.labels.length;
    const startIndex = (this.page - 1) * this.pageSize.id;
    const endIndex =
      this.page * this.pageSize.id > length
        ? length
        : this.page * this.pageSize.id;
    this.pageLabels = this.labels.slice(startIndex, endIndex);
  }

  onChangePage($event: number): void {
    this.page = $event;
    this.loadPageLabels();
    localStorage.setCrmItem(KEY.LABEL_MANAGER.PAGE, this.page + '');
  }

  onChangePageSize($event: any): void {
    if ($event.id === this.pageSize.id) return;
    this.page = 1;
    this.pageSize = $event;
    this.loadPageLabels();
    localStorage.setCrmItem(KEY.LABEL_MANAGER.PAGE, this.page + '');
    localStorage.setCrmItem(
      KEY.LABEL_MANAGER.PAGE_SIZE,
      JSON.stringify(this.pageSize)
    );
  }

  isAllAdminLabels(): boolean {
    for (const label of this.pageLabels) {
      if (label.label.role !== 'admin') return false;
    }
    return true;
  }

  isAllSelected(): boolean {
    for (const label of this.pageLabels) {
      if (label.label.role !== 'admin' && !this.isSelected(label)) return false;
    }
    return true;
  }

  isPartialSelected(): boolean {
    for (const label of this.pageLabels) {
      if (this.isSelected(label)) return true;
    }
    return false;
  }

  isSelected(label: LabelItem): boolean {
    const index = this.selectedLabels.findIndex(
      (_label) => _label.label._id === label.label._id
    );
    return index > -1;
  }

  onSelect(label: LabelItem): void {
    const index = this.selectedLabels.findIndex(
      (_label) => _label.label._id === label.label._id
    );
    if (index === -1) {
      this.selectedLabels.push(label);
    } else {
      this.selectedLabels.splice(index, 1);
    }
    this.updateActionButton();
  }

  onSelectAll(): void {
    const isAllSelected = this.isAllSelected();
    if (isAllSelected) {
      this.selectedLabels = [];
    } else {
      this.pageLabels.map((label) => {
        if (label.label.role !== 'admin' && !this.isSelected(label)) {
          this.selectedLabels.push(label);
        }
      });
    }
    this.updateActionButton();
  }

  updateActionButton(): void {
    this.disabledActions = [];
    const isAllSelected = this.isAllSelected();
    if (isAllSelected) {
      this.disabledActions.push({
        spliter: true,
        label: 'Select all',
        type: 'button',
        command: 'select',
        loading: false
      });
    }
    if (this.selectedLabels.length === 0) {
      this.disabledActions.push({
        label: 'Deselect',
        type: 'button',
        command: 'deselect',
        loading: false
      });
    }
    if (this.selectedLabels.length > 1) {
      this.disabledActions.push({
        spliter: true,
        label: 'Edit',
        type: 'button',
        icon: 'i-edit',
        command: 'edit',
        loading: false
      });
    } else {
      this.disabledActions.push({
        spliter: true,
        label: 'Merge',
        type: 'button',
        icon: 'i-merge',
        command: 'merge',
        loading: false
      });
    }
  }

  onChangeNewLabelName(): void {
    const label = this.labels.find((e) => e.label.name.toLocaleLowerCase() === this.newLabel.name.toLocaleLowerCase());
    if (label) {
      this.existingName = true;
    } else {
      this.existingName = false;
    }
  }

  onCreateNewLabel(form: NgForm): void {
    this.onEditLabelColor(form);
  }

  onAction($event: any): void {
    if ($event.command === 'deselect') {
      this.selectedLabels = [];
    } else if ($event.command === 'select') {
      this.onSelectAll();
    } else if ($event.command === 'edit') {
      const label = this.pageLabels.filter(
        (label) => label.label._id === this.selectedLabels[0].label._id
      );
      this.onEditLabel(label[0]);
    } else if ($event.command === 'delete') {
      if (this.selectedLabels.length > 1) {
        this.onDeleteLabels(this.selectedLabels);
      } else {
        this.onDeleteLabel(this.selectedLabels[0]);
      }
    } else if ($event.command === 'merge') {
      this.onMergeLabels();
    }
  }

  onEditLabelColor(form: NgForm): void {
    this.dialog
      .open(LabelEditColorComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        maxHeight: '400px'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.newLabel.color = res;
          if (this.newLabel.name.replace(/\s/g, '').length == 0) {
            this.newLabel.name = '';
            return;
          }
          if (this.existingName) return;

          this.isSavingNewLabel = true;
          this.saveSubscription && this.saveSubscription.unsubscribe();
          this.saveSubscription = this.labelService
            .createLabel(this.newLabel)
            .subscribe((res) => {
              if (res) {
                this.isSavingNewLabel = false;
                this.labelService.create$(res);
                this.loadPageLabels();
                this.newLabel = new Label().deserialize({
                  color: '#000',
                  name: ''
                });
                form.resetForm();
              } else {
                this.isSavingNewLabel = false;
              }
            });
        }
      });
  }

  onEditLabel(label: LabelItem): void {
    this.dialog.open(LabelEditComponent, {
      position: { top: '100px' },
      width: '100vw',
      maxWidth: '400px',
      maxHeight: '400px',
      disableClose: true,
      data: label.label
    });
  }

  onDeleteLabel(label: LabelItem): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete status',
        message: 'Are you sure to delete the status?',
        cancelLabel: 'No',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.labelService.deleteLabel(label.label._id).subscribe((status) => {
          if (status) {
            this.labelService.delete$(label.label._id);
          }
        });
      }
    });
  }

  onDeleteLabels(labels: LabelItem[]): void {
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete status',
        message: 'Are you sure to delete the status?',
        cancelLabel: 'No',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });
    const deleteLabels = labels.map((label) => label.label).concat();
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.labelService.deleteLabels(deleteLabels).subscribe((status) => {
          if (status) {
            const ids = deleteLabels.map((label) => label._id).concat();
            ids.map((id) => this.labelService.delete$(id));
          }
        });
      }
    });
  }

  onMergeLabel(label: LabelItem): void {
    const mergeList = this.labels
      .filter((_label) => _label.label._id !== label.label._id)
      .map((label) => label.label)
      .concat();
    this.dialog
      .open(LabelMergeComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          mergeList: mergeList,
          mergeLabels: [label.label]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.labelService.loadLabelsWithCount();
        }
      });
  }

  onMergeLabels(): void {
    const mergeLabels = this.selectedLabels
      .map((label) => label.label)
      .concat();
    const mergeList = this.labels
      .filter((_label) => {
        for (const item of this.selectedLabels) {
          if (
            _label.label.role === 'admin' ||
            _label.label._id === item.label._id
          )
            return true;
        }
        return false;
      })
      .map((label) => label.label);
    this.dialog
      .open(LabelMergeComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          mergeList: mergeList,
          mergeLabels: mergeLabels
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.labelService.loadLabelsWithCount();
        }
      });
  }

  toggleBody(event: any): void {
    if (event) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }

  onShowLabelContacts(label: LabelItem): void {
    this.selectedLabel = label;
    this.ldrawer.open();
  }
}
