import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ContactService } from '@services/contact.service';
import { StoreService } from '@services/store.service';
import { DealsService } from '@services/deals.service';
import { HandlerService } from '@services/handler.service';
import * as _ from 'lodash';
import { CustomFieldAddComponent } from '@components/custom-field-add/custom-field-add.component';
import { CustomFieldDeleteComponent } from '@components/custom-field-delete/custom-field-delete.component';
import { MatDrawer } from '@angular/material/sidenav';
import {
  BulkActions,
  STATUS,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { CustomFieldsMergeComponent } from '@components/custom-fields-merge/custom-fields-merge.component';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';
import { CustomFieldService } from '@app/services/custom-field.service';

@Component({
  selector: 'app-custom-fields',
  templateUrl: './custom-fields.component.html',
  styleUrls: ['./custom-fields.component.scss']
})
export class CustomFieldsComponent implements OnInit {
  @ViewChild('cdrawer') cdrawer: MatDrawer;
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[1];
  page = 1;

  customFields: any[] = []; // custom fields list
  selectedFields: any[] = []; // selected field
  selectedField: any; // selected field to show the contacts list
  actions = BulkActions.TagManager;
  disabledActions = [];
  isLoading = false;
  @Input() type = 'contact';

  constructor(
    public router: Router,
    private dialog: MatDialog,
    public dealsService: DealsService,
    private handlerService: HandlerService,
    public contactService: ContactService,
    public customFieldService: CustomFieldService,
    public storeService: StoreService
  ) {
    const page = localStorage.getCrmItem(
      this.type == 'contact'
        ? KEY.CUSTOM_FIELD_MANAGER.PAGE
        : KEY.CUSTOM_FIELD_MANAGER.PIPELINE_PAGE
    );
    const pageSize = localStorage.getCrmItem(
      this.type == 'contact'
        ? KEY.CUSTOM_FIELD_MANAGER.PAGE_SIZE
        : KEY.CUSTOM_FIELD_MANAGER.PIPELINE_PAGE_SIZE
    );
    if (page) {
      this.page = parseInt(page);
    }
    if (pageSize) {
      const parsedPageSize = JSONParser(pageSize);
      if (parsedPageSize) {
        this.pageSize = parsedPageSize;
      }
    }

    this.isLoading = true;
  }

  ngOnInit(): void {
    this.handlerService.pageName.next('contacts');
    this.customFieldService.loadFields(this.type);
    if (this.type === 'contact') {
      this.customFieldService.fields$.subscribe((fields) => {
        this.customFields = fields;
        const customColumn = this.customFields.map((e) => e.name);
        localStorage.setCrmItem(
          'contact_custom_columns',
          JSON.stringify(customColumn)
        );
      });
    } else {
      this.customFieldService.dealFields$.subscribe((fields) => {
        this.customFields = fields;
        const customColumn = this.customFields.map((e) => e.name);
        localStorage.setCrmItem(
          'contact_custom_columns',
          JSON.stringify(customColumn)
        );
      });
    }

    this.customFieldService.loadStatus$.subscribe((status) => {
      this.isLoading = status === STATUS.REQUEST;
    });
  }

  onCreateField(): void {
    this.dialog
      .open(CustomFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          mode: 'create',
          length: this.customFields.length,
          kind: this.type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reloadFieldLoad();
        }
      });
  }

  onEditField(field: any): void {
    this.dialog
      .open(CustomFieldAddComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          mode: 'edit',
          kind: this.type,
          field: field
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reloadFieldLoad();
        }
      });
  }

  onDeleteField(field: any): void {
    this.dialog
      .open(CustomFieldDeleteComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '450px',
        disableClose: true,
        data: {
          fields: [field],
          kind: this.type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.selectedFields = this.selectedFields.filter(
            (e) => e.id !== field.id
          );
        }
        this.reloadFieldLoad();
      });
  }

  onDeleteFields(): void {
    const fields = this.selectedFields;
    this.dialog
      .open(CustomFieldDeleteComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '450px',
        disableClose: true,
        data: {
          fields: fields,
          kind: this.type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.status) {
          this.selectedFields = [];
          this.reloadFieldLoad();
        }
      });
  }

  onMergeFields(fieldToMerge: any): void {
    this.dialog
      .open(CustomFieldsMergeComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: {
          mergeFields: this.selectedFields,
          mergeList: this.selectedFields,
          selectedField: fieldToMerge
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.selectedFields = [];
          this.reloadFieldLoad();
        }
      });
  }

  isMergebleField(field): boolean {
    const list = this.customFields.filter(
      (_field) => _field.type === field.type
    );
    return list.length > 1;
  }

  isSelected(field: any): boolean {
    const index = this.selectedFields.findIndex(
      (_field) => _field._id === field._id
    );
    return index > -1;
  }

  isAllSelected(): boolean {
    if (this.customFields.length === 0) return false;
    return this.customFields.length === this.selectedFields.length;
  }

  isAllSelectedPage(): boolean {
    const start = (this.page - 1) * this.pageSize.id;
    const end = this.page * this.pageSize.id;
    const pageFields = this.customFields.slice(start, end);
    for (const field of pageFields) {
      if (!this.isSelected(field)) return false;
    }
    if (pageFields?.length) {
      return true;
    }
    return false;
  }

  isPartialSelected(): boolean {
    return this.selectedFields.length > 0;
  }

  onSelect(field: any): void {
    if (this.isSelected(field)) {
      this.selectedFields = this.selectedFields.filter(
        (_field) => _field._id !== field._id
      );
    } else {
      this.selectedFields.push(field);
    }
    this.updateBulkActions();
  }

  onSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedFields = [];
    } else {
      for (const field of this.customFields) {
        if (!this.isSelected(field)) this.selectedFields.push(field);
      }
    }
    this.updateBulkActions();
  }

  onSelectAllPage(): void {
    const start = (this.page - 1) * this.pageSize.id;
    const end = this.page * this.pageSize.id;
    const fields = this.customFields.slice(start, end);
    const isAllSelectedPage = this.isAllSelectedPage();
    if (isAllSelectedPage) {
      fields.forEach((field) => {
        if (this.isSelected(field)) {
          this.selectedFields = this.selectedFields.filter((e) =>
            this.type == 'contact' ? field.id !== e.id : field._id !== e._id
          );
        }
      });
    } else {
      fields.forEach((field) => {
        if (!this.isSelected(field)) {
          this.selectedFields.push(field);
        }
      });
    }
    this.updateBulkActions();
  }

  onChangePage(page: number): void {
    this.page = page;
    localStorage.setCrmItem(KEY.CUSTOM_FIELD_MANAGER.PAGE, this.page + '');
  }

  onChangePageSize(type: any): void {
    if (this.pageSize.id === type.id) return;
    this.pageSize = type;
    localStorage.setCrmItem(
      KEY.CUSTOM_FIELD_MANAGER.PAGE_SIZE,
      JSON.stringify(this.pageSize)
    );
  }

  updateBulkActions(): void {
    this.disabledActions = [];
    const isAllSelected = this.isAllSelected();
    if (this.type != 'contact') {
      this.disabledActions.push({
        spliter: true,
        label: 'Merge',
        type: 'button',
        icon: 'i-merge',
        command: 'merge',
        loading: false
      });
    }
    if (isAllSelected) {
      this.disabledActions.push({
        spliter: true,
        label: 'Select all',
        type: 'button',
        command: 'select',
        loading: false
      });
    }
    if (this.selectedFields.length === 0) {
      this.disabledActions.push({
        label: 'Deselect',
        type: 'button',
        command: 'deselect',
        loading: false
      });
    }
    if (this.selectedFields.length > 1) {
      this.disabledActions.push({
        spliter: true,
        label: 'Edit',
        type: 'button',
        icon: 'i-edit',
        command: 'edit',
        loading: false
      });
    }
    if (this.selectedFields.length < 2) {
      this.disabledActions.push({
        spliter: true,
        label: 'Merge',
        type: 'button',
        icon: 'i-merge',
        command: 'merge',
        loading: false
      });
    } else {
      const type = this.selectedFields[0].type;
      for (const field of this.selectedFields) {
        if (type !== field.type) {
          this.disabledActions.push({
            spliter: true,
            label: 'Merge',
            type: 'button',
            icon: 'i-merge',
            command: 'merge',
            loading: false
          });
          return;
        }
      }
    }
  }

  onAction($action): void {
    switch ($action.command) {
      case 'select':
        this.onSelectAll();
        break;
      case 'deselect':
        this.selectedFields = [];
        break;
      case 'edit':
        this.onEditField(this.selectedFields[0]);
        break;
      case 'delete':
        this.onDeleteFields();
        break;
      case 'merge':
        this.onMergeFields(null);
        break;
      default:
    }
  }

  toggleBody(event: any): void {
    if (event) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }

  onShowContacts(field: any): void {
    this.selectedField = field;
    this.cdrawer.open();
  }
  private reloadFieldLoad(): void {
    this.customFieldService.loadFields(this.type, true);
  }
}
