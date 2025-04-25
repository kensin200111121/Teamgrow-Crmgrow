import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  QueryList,
  ViewChildren,
  ElementRef
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ListType, ResourceCategory } from '@core/enums/resources.enum';
import {
  FilterParam,
  FilterTypeItem,
  PageCountItem,
  ResourceListItem,
  SortTypeItem
} from '@core/interfaces/resources.interface';
import * as _ from 'lodash';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ResourceListService } from '@services/resource-list.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-resource-browser-base',
  template: ''
})
export abstract class ResourceBrowserBase<
  ListItem extends { item_type: ResourceType; _id: string },
  Service extends ResourceListService<ListItem, ResourceType>,
  ResourceType
> implements OnInit, OnDestroy
{
  readonly PAGE_COUNTS: PageCountItem[] = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  readonly loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  abstract DISPLAY_COLUMNS: string[];
  abstract LIST_TYPE: ListType;
  abstract SORT_TYPES: FilterTypeItem<ResourceType>[];
  abstract sortType: FilterTypeItem<ResourceType>;
  abstract RESOURCE_TYPE: ResourceCategory;

  pageSize: PageCountItem = this.PAGE_COUNTS[2];
  page = 1;

  protected items: ResourceListItem<ListItem>[] = [];
  filteredItems: ResourceListItem<ListItem>[] = [];
  selection: string[] = [];
  hideItems: string[] = [];

  sharing = false;
  currentFolder = '';
  parentFolder = '';
  sortField: string;
  sortDir: boolean;
  filterParam: FilterParam<ResourceType> = {};

  protected abstract service: Service;
  protected abstract dialogRef: MatDialogRef<any>;
  protected loadSubscription: Subscription;

  set isLoading(isLoading: boolean) {
    this.loading$.next(isLoading);
  }

  get isLoading(): boolean {
    return this.loading$.getValue();
  }
  onChangeKeyword = new Subject<string>();
  constructor() {
    this.onChangeKeyword
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((keyword) => {
        this.filterParam.search = keyword;
        this.load();
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  goToFolder(folder: string): void {
    this.preload(folder);
    this.filterParam.folder = folder;
    this.load();
  }

  preload(folder: string): void {
    this.selection = [];
    const historyStacks = this.service.getHistory(this.LIST_TYPE);
    const history = historyStacks[folder || 'root'];
    if (history) {
      this.items = history.results;
      this.parentFolder = history.prevFolder || '';
    } else {
      this.items = [];
      this.parentFolder = '';
    }
    this.filter();
    this.currentFolder = folder;
  }

  load(): void {
    this.isLoading = true;
    this.filterParam.loadType = 'browser';
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.service
      .load(this.filterParam, this.LIST_TYPE, '')
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.data) {
          this.items = res.data.results.filter(
            (e) => !this.hideItems.includes(e._id)
          );
          this.parentFolder = res.data.prevFolder;
          this.service.storeFolderHistory(
            this.LIST_TYPE,
            res.data,
            this.filterParam.folder
          );
          this.filter();
        }
      });
  }

  filter(): void {
    if (this.filterParam.type) {
      this.filteredItems = this.items.filter(
        (e) => e.item_type === this.filterParam.type
      );
    } else {
      this.filteredItems = this.items;
    }
    this.sort();
    this.page = 1;
  }

  sort(): void {
    const field = this.sortField || 'title';
    const gravity = this.sortDir ? 1 : -1;
    const folders = this.filteredItems.filter((e) => e.item_type === 'folder');
    const files = this.filteredItems.filter((e) => e.item_type !== 'folder');
    folders.sort((a, b) => (a[field] > b[field] ? 1 * gravity : -1 * gravity));
    files.sort((a, b) => (a[field] > b[field] ? 1 * gravity : -1 * gravity));
    this.filteredItems = [...folders, ...files];
  }

  onChangeType(type: FilterTypeItem<ResourceType>): void {
    this.sortType = type;
    this.filterParam.type = type.id;
    this.filter();
  }

  changePageSize(data: PageCountItem): void {
    this.pageSize = data;
  }

  changePage($event: number): void {
    this.page = $event;
  }

  isAllSelected(): boolean {
    const filteredMaterialIds = [];
    this.filteredItems.forEach((e) => {
      filteredMaterialIds.push(e._id);
    });
    const selectedMaterials = _.intersection(
      this.selection,
      filteredMaterialIds
    );
    return (
      this.filteredItems.length &&
      selectedMaterials.length === this.filteredItems.length
    );
  }

  isSelected(element: ResourceListItem<ListItem>): boolean {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      return true;
    } else {
      return false;
    }
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.filteredItems.forEach((e) => {
        const pos = this.selection.indexOf(e._id);
        if (pos !== -1) {
          this.selection.splice(pos, 1);
        }
      });
    } else {
      const validItems =
        this.RESOURCE_TYPE === 'material'
          ? _.filter(this.filteredItems, (item) => item.item_type !== 'folder')
          : this.filteredItems;
      validItems.forEach((e) => {
        const pos = this.selection.indexOf(e._id);
        if (pos === -1) {
          this.selection.push(e._id);
        }
      });
    }
  }

  clearSelection(): void {
    this.selection = [];
  }

  toggleElement(element: ResourceListItem<ListItem>): void {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      this.selection.splice(pos, 1);
    } else {
      this.selection.push(element._id);
    }
  }

  getElementById(id: string): any {
    const index = this.items.findIndex((item) => item._id === id);
    if (index >= 0) {
      return this.items[index];
    }
    return null;
  }

  select(): void {
    this.sharing = true;
    const selectedResources = [];
    for (const selected of this.selection) {
      if (this.getElementById(selected)) {
        selectedResources.push(this.getElementById(selected));
      }
    }

    let data;
    if (this.RESOURCE_TYPE === 'material') {
      data = {
        materials: selectedResources
      };
    } else if (this.RESOURCE_TYPE === 'automation') {
      data = {
        automations: selectedResources
      };
    } else if (this.RESOURCE_TYPE === 'template') {
      data = {
        templates: selectedResources
      };
    } else {
      data = {
        pipelines: selectedResources
      };
    }
    this.dialogRef.close(data);
  }
}
