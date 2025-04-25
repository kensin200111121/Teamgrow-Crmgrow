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
import { BehaviorSubject, Subscription, Subject } from 'rxjs';
import * as _ from 'lodash';
import { ListType, ResourceCategory } from '@core/enums/resources.enum';
import {
  FilterParam,
  PageCountItem,
  ResourceListItem,
  SortTypeItem,
  BulkActionItem,
  FolderItem,
  TeamInfo,
  CheckRequestItem,
  DownloadRequest,
  FolderItemInfo,
  MaterialItem,
  FilterTypeItem
} from '@core/interfaces/resources.interface';
import { ResourceListService } from '@services/resource-list.service';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { toggle } from '@utils/functions';
import { MatDrawer } from '@angular/material/sidenav';
import { ToastrService } from 'ngx-toastr';
import { NotifyComponent } from '@components/notify/notify.component';
import { MatDialog } from '@angular/material/dialog';
import { MoveFolderComponent } from '@components/move-folder/move-folder.component';
import { FolderComponent } from '@components/folder/folder.component';
import { TeamMaterialShareComponent } from '@components/team-material-share/team-material-share.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { User } from '@models/user.model';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { TeamService } from '@services/team.service';
import { DeleteFolderComponent } from '@components/delete-folder/delete-folder.component';
import { ConfirmBulkMaterialsComponent } from '@components/confirm-bulk-materials/confirm-bulk-materials.component';
import { ConfirmCustomTokenComponent } from '@app/components/confirm-custom-token/confirm-custom-token.component';
import { KEY } from '@constants/key.constant';
import { LeadForm } from '@app/models/lead-form.model';

@Component({
  selector: 'app-resource-list-base',
  template: ''
})
export abstract class ResourceListBase<
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
  abstract SORT_TYPES: SortTypeItem[];
  abstract FILTER_TYPES: FilterTypeItem<ResourceType>[];
  abstract BULK_ACTIONS: BulkActionItem[];
  abstract FOLDER_ACTIONS: BulkActionItem[];
  abstract sortType: SortTypeItem;
  abstract filterType: FilterTypeItem<ResourceType>;
  abstract RESOURCE_TYPE: ResourceCategory;
  abstract BASE_URL: string;
  user: User = new User();
  userId = '';
  teamId = '';

  pageSize: PageCountItem = this.PAGE_COUNTS[2];
  page = 1;

  protected items: ResourceListItem<ListItem>[] = [];
  filteredItems: ResourceListItem<ListItem>[] = [];
  folders: ResourceListItem<ListItem>[] = [];
  files: ResourceListItem<ListItem>[] = [];
  selectedFolders: string[] = [];
  selectedFiles: string[] = [];
  d_status = '';
  s_status = '';

  currentFolder = '';
  curFolderName = '';
  parentFolder = '';
  teamInfo: TeamInfo;

  sortField: string;
  sortDir: boolean;

  forms: LeadForm[] = [];

  filterParam: FilterParam<ResourceType> = {};
  rootFolderInfo: any;
  protected abstract service: Service;
  protected abstract toast: ToastrService;
  protected abstract dialog: MatDialog;
  protected abstract route: ActivatedRoute;
  protected abstract router: Router;
  protected abstract userService: UserService;
  protected abstract myElement: ElementRef;
  protected loadSubscription: Subscription;
  protected routeSubscription: Subscription;

  set isLoading(isLoading: boolean) {
    this.loading$.next(isLoading);
  }

  get isLoading(): boolean {
    return this.loading$.getValue();
  }

  get selectedCount(): number {
    return this.selectedFiles.length + this.selectedFolders.length;
  }

  get fileCount(): number {
    return this.filteredItems.filter((e) => e.item_type !== 'folder').length;
  }

  @Input() hasAdvancedFilter = false;
  @ViewChildren('mainDrop') dropdowns: QueryList<NgbDropdown>;
  @ViewChild('drawer', { static: false }) drawer: MatDrawer;

  @ViewChild('carouselContent') carouselContent!: ElementRef;
  isAll = false;
  showLeftButton = false;
  showRightButton = true;

  onChangeKeyword = new Subject<string>();
  checkingDowload = false;
  constructor() {
    this.onChangeKeyword
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((keyword) => {
        this.filterParam.search = keyword;
        const data = {
          searchStr: keyword
        };
        this.updatePageOption(data);
        this.load();
      });
  }

  ngOnInit(): void {
    this.initRouteSubscribe();
  }

  ngOnDestroy(): void {
    //TODO: clean the history without root & current folder
  }

  initRouteSubscribe(): void {
    this.userService.profile$.subscribe((_profile) => {
      if (_profile._id) {
        this.userId = _profile._id;
        this.user = _profile;
      }
    });

    this.routeSubscription = this.route.params.subscribe((params) => {
      if (!this.router.url.startsWith(this.BASE_URL)) {
        return;
      }

      const page = params['page'];
      if (page) {
        this.LIST_TYPE = page.toUpperCase();
      }
      const team_id = params['team'];
      const folder_id = params['folder'];
      if (team_id) {
        this.teamId = team_id;
        if (folder_id && folder_id !== 'root') {
          this.goToFolder(folder_id, team_id);
        } else {
          this.goToFolder('');
        }
      } else {
        if (folder_id && folder_id !== 'root') {
          this.goToFolder(folder_id);
        } else {
          this.goToFolder('');
        }
      }
    });
  }

  checkScrollPosition() {
    if (!this.carouselContent) {
      return;
    }
    const scrollLeft = this.carouselContent.nativeElement.scrollLeft;
    const scrollWidth = this.carouselContent.nativeElement.scrollWidth;
    const clientWidth = this.carouselContent.nativeElement.clientWidth;

    this.showLeftButton = scrollLeft > 0;
    this.showRightButton = scrollLeft < scrollWidth - clientWidth;

    if (scrollWidth <= clientWidth) {
      this.showLeftButton = false;
      this.showRightButton = false;
    }
  }

  changePage($event: number): void {
    this.page = $event;
    this.updatePageOption({ page: this.page });
  }

  changePageSize(data: PageCountItem): void {
    this.pageSize = data;
    const _data = {
      pageSize: data.id
    };
    this.updatePageOption(_data);
  }

  changeSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = !this.sortDir;
    } else {
      this.sortField = field;
      this.sortDir = true;
    }
    const data = {
      sort: this.sortField
    };
    localStorage.setCrmItem(
      KEY.RESOURCE_LIST.SORT_OPTION,
      this.sortDir.toString()
    );
    this.updatePageOption(data);
    this.sort();
  }

  public goToFolder(folder: string, teamId = ''): void {
    this._initPageOptions();
    this.preload(folder);
    this.filterParam.folder = folder;
    if (teamId) {
      this.filterParam.team_id = teamId;
      this.LIST_TYPE = ListType.LIBRARY;
    }
    this.load();
  }

  onChangeType(type: FilterTypeItem<ResourceType>): void {
    // filter in loaded data
    this.filterType = type;
    this.filterParam.typeOptions = [];
    if (type.id) {
      this.filterParam.typeOptions.push(type.id as string);
    }
    const data = {
      filterTypes: this.filterParam.typeOptions
    };
    this.updatePageOption(data);
    this.filter();
  }

  onChangeSort(type: SortTypeItem): void {
    // filter in loaded data
    this.sortType = type;
    switch (type.id) {
      case 'az':
        this.sortField = 'title';
        this.sortDir = true;
        break;
      case 'za':
        this.sortField = 'title';
        this.sortDir = false;
        break;
      case 'newest':
        this.sortField = 'created_at';
        this.sortDir = false;
        break;
      case 'oldest':
        this.sortField = 'created_at';
        this.sortDir = true;
        break;
      case 'most_viewed':
        this.sortField = 'views';
        this.sortDir = false;
        break;
      case 'least_viewed':
        this.sortField = 'views';
        this.sortDir = true;
        break;
      default:
        break;
    }
    const data = {
      sort: this.sortField,
      sortType: type
    };
    localStorage.setCrmItem(
      KEY.RESOURCE_LIST.SORT_OPTION,
      this.sortDir.toString()
    );
    this.updatePageOption(data);
    this.filter();
  }

  updatePageOption(data: any): void {
    switch (this.LIST_TYPE) {
      case ListType.OWN:
        this.service.updateListPageOption(data);
        this.getActiveCounts();
        break;
      case ListType.LIBRARY:
        this.service.updateLibPageOption(data);
        break;
      case ListType.TEAM:
        this.service.updateTeamPageOption(data);
      default:
        break;
    }
  }

  clearFilterOptions(): void {
    this.filterParam.teamOptions = [];
    this.filterParam.userOptions = [];
    this.filterParam.typeOptions = [];
    const data = {
      teamOptions: [],
      userOptions: [],
      filterTypes: []
    };
    this.updatePageOption(data);
    this.load();
  }

  onChangeTeamOptions(options: string[]): void {
    this.filterParam.teamOptions = options;
    const data = {
      teamOptions: options
    };
    this.updatePageOption(data);
    this.load();
  }

  onChangeTypeOptions(options: string[]): void {
    this.filterParam.typeOptions = options;
    const data = {
      filterTypes: options
    };
    this.updatePageOption(data);
    this.filter();
  }

  onChangeUserOptions(options: string[]): void {
    this.filterParam.userOptions = options;
    const data = {
      userOptions: options
    };
    this.updatePageOption(data);
    this.load();
  }

  preload(folder: string): void {
    this.selectedFiles = [];
    this.selectedFolders = [];
    const historyStacks = this.service.getHistory(this.LIST_TYPE);
    const history = historyStacks[folder || 'root'];
    if (history) {
      this.items = history.results;
      this.parentFolder = history.prevFolder || '';
    } else {
      this.items = [];
      this.parentFolder = '';
    }
    this.filter(true);
    this.currentFolder = folder;
  }

  private _initPageOptions(): void {
    let pageOption = null;
    switch (this.LIST_TYPE) {
      case ListType.OWN:
        pageOption = this.service.listPageOption.getValue();
        break;
      case ListType.LIBRARY:
        pageOption = this.service.libPageOption.getValue();
        break;
      case ListType.TEAM:
        pageOption = this.service.teamPageOption.getValue();
        break;
      default:
        break;
    }

    this.page = pageOption['page'];
    this.pageSize = {
      id: pageOption['pageSize'],
      label: pageOption['pageSize'] + ''
    };
    const defaultSortType = { id: 'az', label: 'A-Z' };
    this.sortType = pageOption['sortType'] || defaultSortType;
    this.filterParam.type = pageOption['filterType']?.id || '';
    this.filterParam.search = pageOption['searchStr'] || '';
    this.filterParam.teamOptions = pageOption['teamOptions'] || [];
    this.filterParam.userOptions = pageOption['userOptions'] || [];
    this.sortField = pageOption['sort'];
    if (localStorage.getCrmItem(KEY.RESOURCE_LIST.SORT_OPTION) === undefined) {
      localStorage.setCrmItem(KEY.RESOURCE_LIST.SORT_OPTION, 'true');
      this.sortDir = true;
    } else {
      this.sortDir = localStorage.getCrmItem(KEY.RESOURCE_LIST.SORT_OPTION);
    }
  }

  load(id = ''): void {
    this.isLoading = true;
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.service
      .load(this.filterParam, this.LIST_TYPE, this.teamId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          setTimeout(() => {
            this.checkScrollPosition();
          }, 300);
        })
      )
      .subscribe((res) => {
        if (res.data) {
          this.items = res.data.results;
          if (this.LIST_TYPE === ListType.OWN) {
            this.loadViewCount();
            this.curFolderName =
              res.data?.currentFolder?.title || 'My Material List';
          } else {
            this.curFolderName =
              res.data?.team?.name ||
              res.data?.currentFolder?.title ||
              'Materials Library';
          }
          this.parentFolder = res.data.prevFolder;
          this.curFolderName = res.data?.currentFolder?.title || '';
          this.rootFolderInfo = res.data?.currentFolder;
          this.teamInfo = res.data.team || null;
          this.selectedFiles = this.selectedFiles.filter(
            (id) => this.items.findIndex((item) => item._id === id) >= 0
          );
          this.selectedFolders = this.selectedFolders.filter(
            (id) => this.items.findIndex((item) => item._id === id) >= 0
          );
          this.service.storeFolderHistory(
            this.LIST_TYPE,
            res.data,
            this.filterParam.folder
          );
          this.filter(true);
          if (id) {
            this.goToMaterial(id);
          }
        }
      });
  }

  loadViewCount(): void {
    if (!this.service['loadViews']) {
      return;
    }
    const ids = this.items.map((e) => e._id);

    this.service['loadViews']({ _ids: ids }).subscribe((res) => {
      if (res.data) {
        this.items.forEach((item: MaterialItem) => {
          const filteredMaterials = res.data.results.filter(
            (e) => e._id === item._id
          );
          if (filteredMaterials.length > 0) {
            item.views = filteredMaterials[0]['views'] || 0;
            item.sent = filteredMaterials[0]['sent'] || 0;
          } else {
            item.views = 0;
            item.sent = 0;
          }
        });
        if (this.sortField === 'views') {
          this.sort(this.items);
        }
      }
    });
  }

  filter(shouldUpdatePreview = false): void {
    let items = this.items;
    if (this.filterParam.typeOptions?.length > 0) {
      items = this.items.filter((e) =>
        this.filterParam.typeOptions.includes(e.item_type as string)
      );
    }
    this.sort(items);

    // Update the Preview Item
    this.RESOURCE_TYPE === 'material' &&
      this.LIST_TYPE === ListType.OWN &&
      shouldUpdatePreview &&
      this.service.updateItem.next({
        updateAction: 'LoadList'
      });
  }

  sort(items?: ResourceListItem<ListItem>[]): void {
    this.sortDir =
      localStorage.getCrmItem(KEY.RESOURCE_LIST.SORT_OPTION) === 'true'
        ? true
        : false;
    const sourceItems = items ? items : this.filteredItems;
    const field = this.sortField || 'title';
    const gravity = this.sortDir ? 1 : -1;
    const folders = sourceItems.filter((e) => e.item_type === 'folder');
    const files = sourceItems.filter((e) => e.item_type !== 'folder');
    if (field === 'views' || field === 'sent') {
      folders.sort((a, b) => {
        return a[field] > b[field] ? 1 * gravity : -1 * gravity;
      });
      files.sort((a, b) => {
        return a[field] > b[field] ? 1 * gravity : -1 * gravity;
      });
    } else if (field === 'resource') {
      files.sort((a: any, b: any) => {
        return (a.resource_count - b.resource_count) * gravity;
      });
    } else if (field === 'shared_with') {
      folders.sort((a: any, b: any) => {
        const aHasSharedWith = a.shared_with !== undefined;
        const bHasSharedWith = b.shared_with !== undefined;

        if (gravity === -1) {
          if (!aHasSharedWith && bHasSharedWith) {
            return -1;
          }
          if (aHasSharedWith && !bHasSharedWith) {
            return 1;
          }
          return 0;
        } else {
          return (bHasSharedWith ? 1 : 0) - (aHasSharedWith ? 1 : 0);
        }
      });
      files.sort((a: any, b: any) => {
        const aHasSharedWith = a.shared_with !== undefined;
        const bHasSharedWith = b.shared_with !== undefined;

        if (gravity === -1) {
          if (!aHasSharedWith && bHasSharedWith) {
            return -1;
          }
          if (aHasSharedWith && !bHasSharedWith) {
            return 1;
          }
          return 0;
        } else {
          return (bHasSharedWith ? 1 : 0) - (aHasSharedWith ? 1 : 0);
        }
      });
    } else {
      folders.sort((a, b) => {
        return String(a[field]).trim().toLowerCase() >
          String(b[field]).trim().toLowerCase()
          ? 1 * gravity
          : -1 * gravity;
      });
      files.sort((a, b) => {
        return String(a[field]).trim().toLowerCase() >
          String(b[field]).trim().toLowerCase()
          ? 1 * gravity
          : -1 * gravity;
      });
    }
    this.folders = folders;
    this.files = files;

    // This code block will init the lead capture form names for the materials
    this.files.map((file: any) => {
      if (file.capture_form)
        return (file['forms'] = {
          firstForm: this.getName(Object.keys(file.capture_form)[0]),
          secondForm:
            Object.keys(file.capture_form).length > 1
              ? this.getName(Object.keys(file.capture_form)[1])
              : '',
          rest:
            Object.keys(file.capture_form).length > 2
              ? Object.keys(file.capture_form).length - 2
              : 0
        });
      else return file;
    });
    this.filteredItems = [...folders, ...files];
    this.doAction({
      command: 'restore_pos',
      label: '',
      type: ''
    });
    this.getActiveCounts();
  }

  private getName(key: string): string {
    if (!key) {
      return '';
    } else {
      const index = this.forms.findIndex((e) => e._id === key);
      if (index !== -1) {
        return this.forms[index].name;
      } else {
        return '';
      }
    }
  }

  toggleItem(element: ResourceListItem<ListItem>): void {
    if (element.item_type === 'folder') {
      this.selectedFolders = toggle(this.selectedFolders, element._id);
    } else {
      this.selectedFiles = toggle(this.selectedFiles, element._id);
    }
  }

  togglePageItems(): void {
    const start = (this.page - 1) * this.pageSize.id;
    const end = start + this.pageSize.id;
    const pageResourceIds = this.filteredItems
      .slice(start, end)
      .filter((e) => e.item_type !== 'folder')
      .map((e) => e._id);
    const selectedPageResourceIds = _.intersection(
      this.selectedFiles,
      pageResourceIds
    );
    if (selectedPageResourceIds.length === pageResourceIds.length) {
      this.selectedFiles = _.difference(this.selectedFiles, pageResourceIds);
    } else {
      this.selectedFiles = _.union(this.selectedFiles, pageResourceIds);
    }
  }

  selectAll(): void {
    if (!this.isAllSelected()) {
      this.selectedFiles = this.filteredItems
        .filter((e) => e.item_type !== 'folder')
        .map((e) => e._id);
    }
  }

  toggleAllItems(): void {
    if (this.isAllSelected()) {
      this.selectedFiles = [];
    } else {
      this.selectedFiles = this.filteredItems
        .filter((e) => e.item_type !== 'folder')
        .map((e) => e._id);
    }
  }

  isSelected(element: ResourceListItem<ListItem>): boolean {
    return [...this.selectedFolders, ...this.selectedFiles].includes(
      element._id
    );
  }

  isPageSelected(): boolean {
    const start = (this.page - 1) * this.pageSize.id;
    const end = start + this.pageSize.id;
    const pageResourceIds = this.filteredItems
      .slice(start, end)
      .filter((e) => e.item_type !== 'folder')
      .map((e) => e._id);
    const selectedPageResourceIds = _.intersection(
      this.selectedFiles,
      pageResourceIds
    );
    return (
      pageResourceIds.length &&
      pageResourceIds.length === selectedPageResourceIds.length
    );
  }

  isAllSelected(): boolean {
    return (
      this.filteredItems.filter((e) => e.item_type !== 'folder').length ===
      this.selectedFiles.length
    );
  }

  toggleDrawer(): void {
    this.drawer?.open();
  }

  // Common actions
  share(element?: ResourceListItem<ListItem>): void {
    const { data, sharedTeams } = this.generateSelectedData(element);
    this.dialog
      .open(TeamMaterialShareComponent, {
        width: '98vw',
        maxWidth: '450px',
        disableClose: true,
        data: {
          type: this.RESOURCE_TYPE,
          resources: data,
          unshare: false,
          sharedTeams
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.errors?.length) {
          this.dialog.open(ConfirmBulkMaterialsComponent, {
            position: { top: '100px' },
            width: '657px',
            maxWidth: '657px',
            disableClose: true,
            data: {
              title: 'Share Contents',
              additional: res.errors,
              user_id: '',
              message:
                'You are not allowed to share this material with another team because the team owner which you originally got download this material has not permitted you to do so.'
            }
          });
        }
        this.load();
      });
  }

  stopShare(element: ResourceListItem<ListItem>, team?: string): void {
    this.s_status = element._id;
    if (!team) {
      const { data } = this.generateSelectedData(element);
      this.dialog
        .open(TeamMaterialShareComponent, {
          width: '98vw',
          maxWidth: '450px',
          data: {
            type: this.RESOURCE_TYPE,
            resources: data,
            unshare: true
          }
        })
        .afterClosed()
        .subscribe((res) => {
          this.s_status = '';
          if (res) {
            this.load();
          }
        });
    } else {
      const data = {
        team_ids: [team],
        [this.RESOURCE_TYPE + 's']: [
          { _id: element._id, type: element.item_type as string }
        ]
      };
      if (this.RESOURCE_TYPE === 'template') {
        this.service.stopShare(data).subscribe((_res) => {
          if (_res) {
            this.s_status = '';
            this.load();
          }
        });
      } else {
        this.service.checkStopShare(data).subscribe((res) => {
          if (res?.status) {
            const count =
              (res.data?.videos || []).length +
              (res.data?.pdfs || []).length +
              (res.data?.images || []).length +
              (res.data?.titles || []).length +
              (res.data?.templates || []).length;
            if (count == 0) {
              this.service.stopShare(data).subscribe((_res) => {
                if (_res) {
                  this.s_status = '';
                  this.load();
                }
              });
            } else {
              let title;
              if (this.RESOURCE_TYPE === 'automation') {
                title = 'Stop Share Automations';
              } else if (this.RESOURCE_TYPE === 'material') {
                title = 'Stop Share Materials';
              } else if (this.RESOURCE_TYPE === 'pipeline') {
                title = 'Stop Share Pipelines';
              }
              const dialog = this.dialog.open(ConfirmComponent, {
                maxWidth: '400px',
                width: '96vw',
                position: { top: '100px' },
                data: {
                  title,
                  message: 'Stop share failed!',
                  titles: res['data'].titles || [],
                  videos: res['data'].videos || [],
                  images: res['data'].images || [],
                  pdfs: res['data'].pdfs || [],
                  templates: res['data'].templates || [],
                  confirmLabel: 'Yes',
                  cancelLabel: 'No'
                }
              });
              dialog.afterClosed().subscribe((result) => {
                let _data;
                if (result) {
                  _data = { ...data, bulk_data: res.data };
                } else {
                  _data = data;
                }
                this.service.stopShare(_data).subscribe((_res) => {
                  if (_res) {
                    this.s_status = '';
                    this.load();
                  } else {
                    this.s_status = '';
                  }
                });
              });
            }
          } else {
            this.s_status = '';
            this.toast.error(res?.error);
          }
        });
      }
    }
  }

  stopShareBulk(): void {
    const data = {
      team_ids: [this.teamInfo?._id || this.teamId],
      [this.RESOURCE_TYPE + 's']: this.selectedFiles.map((e) => {
        return { _id: e, item_type: this.RESOURCE_TYPE };
      })
    };
    if (this.RESOURCE_TYPE === 'template') {
      this.service.stopShare(data).subscribe((_res) => {
        if (_res) {
          this.load();
          this.selectedFiles = [];
        }
      });
    } else {
      this.service.checkStopShare(data).subscribe((res) => {
        if (res?.status) {
          const count =
            (res.data?.videos || []).length +
            (res.data?.pdfs || []).length +
            (res.data?.images || []).length +
            (res.data?.titles || []).length +
            (res.data?.templates || []).length;
          if (count == 0) {
            this.service.stopShare(data).subscribe((_res) => {
              if (_res) {
                this.load();
                this.selectedFiles = [];
              }
            });
          } else {
            let title;
            if (this.RESOURCE_TYPE === 'automation') {
              title = 'Stop Share Automations';
            } else if (this.RESOURCE_TYPE === 'material') {
              title = 'Stop Share Materials';
            } else if (this.RESOURCE_TYPE === 'pipeline') {
              title = 'Stop Share Pipelines';
            }
            const dialog = this.dialog.open(ConfirmComponent, {
              maxWidth: '400px',
              width: '96vw',
              position: { top: '100px' },
              data: {
                title,
                message: 'Stop share failed!',
                titles: res['data'].titles || [],
                videos: res['data'].videos || [],
                images: res['data'].images || [],
                pdfs: res['data'].pdfs || [],
                templates: res['data'].templates || [],
                confirmLabel: 'Yes',
                cancelLabel: 'No'
              }
            });
            dialog.afterClosed().subscribe((result) => {
              let _data;
              if (result) {
                _data = { ...data, bulk_data: res.data };
              } else {
                _data = data;
              }
              this.service.stopShare(_data).subscribe((_res) => {
                if (_res) {
                  this.load();
                  this.selectedFiles = [];
                }
              });
            });
          }
        } else {
          this.toast.error(res?.error);
        }
      });
    }
  }

  download(element?: ResourceListItem<ListItem>): void {
    if (this.checkingDowload) {
      return;
    }
    this.checkingDowload = true;
    if (element) {
      this.d_status = element._id;
    } else {
      const action = this.BULK_ACTIONS.filter((e) => e.label == 'Download');
      action[0].loading = true;
    }
    const { data } = this.generateSelectedData(element);
    const downloadRequest: DownloadRequest = {
      ...data,
      team: this.teamInfo?._id || this.teamId
    };
    this.service.checkDownload(downloadRequest).subscribe((res) => {
      if (res?.status) {
        if (res.data?.limited) {
          this.toast.error('Exceed max pipelines');
        }
        const downloadedItems = res.data?.downloadedItems || [];
        const unsharedItems = res.data?.unsharedItems || [];
        let title = '';
        let icon = '';
        if (this.RESOURCE_TYPE === 'material') {
          title = 'Download Materials';
          icon = 'i-video';
        } else if (this.RESOURCE_TYPE === 'automation') {
          title = 'Download Automations';
          icon = 'i-automation';
        } else if (this.RESOURCE_TYPE === 'pipeline') {
          title = 'Download Pipelines';
          icon = 'i-deals';
        } else {
          title = 'Download Templates';
          icon = 'i-template';
        }
        if (unsharedItems.length) {
          this.dialog
            .open(ConfirmComponent, {
              maxWidth: '480px',
              width: '96vw',
              position: { top: '100px' },
              data: {
                title,
                message:
                  'Your downloading request can be approved because you are going to download the unshared items.',
                resourceType: this.RESOURCE_TYPE,
                unsharedItems,
                icon,
                case: true
              }
            })
            .afterClosed()
            .subscribe((res) => {
              this.resetDownloadStatus();
            });
        } else {
          const count =
            (res.data?.titles || []).length +
            (res.data?.videos || []).length +
            (res.data?.pdfs || []).length +
            (res.data?.images || []).length +
            (res.data?.dealStages || []).length +
            downloadedItems.length;
          if (count == 0) {
            this.downloadImpl(downloadRequest);
          } else {
            if (count - downloadedItems.length > 0) {
              if (downloadedItems.length > 0) {
                let downloadedItemTitle = '';
                for (const item of downloadedItems) {
                  downloadedItemTitle = downloadedItemTitle
                    ? `${downloadedItemTitle}, ${item.title}`
                    : `${item.title}`;
                }
                this.toast.success(
                  `${downloadedItemTitle} ${
                    downloadedItems.length === 1 ? 'item is' : 'items are'
                  } downloaded to your list already.`
                );
              }
              const ConfirmDialog = this.dialog.open(ConfirmComponent, {
                maxWidth: '480px',
                width: '96vw',
                position: { top: '100px' },
                data: {
                  title,
                  message:
                    'When you download the selected items, followings would be downloaded together because your selected items are using following ones.',
                  resourceType: this.RESOURCE_TYPE,
                  titles: res['data'].titles || [],
                  videos: res['data'].videos || [],
                  images: res['data'].images || [],
                  pdfs: res['data'].pdfs || [],
                  dealStages: res['data'].dealStages || [],
                  relatedItemsCount: count - downloadedItems.length,
                  downloadedItems,
                  icon,
                  confirmLabel: 'Download',
                  cancelLabel: 'Cancel'
                }
              });
              ConfirmDialog.afterClosed().subscribe((status) => {
                if (status) {
                  const itemKey = this.RESOURCE_TYPE + 's';
                  if (status.match_detail) {
                    downloadRequest.stages = status.match_detail;
                  }
                  if (
                    status.selectedDownloadItems &&
                    status.selectedDownloadItems.length > 0
                  ) {
                    const selectedDownloadAgainItems = [
                      ...status.selectedDownloadItems
                    ];
                    const excludedItems = downloadedItems.filter(
                      (e) => !selectedDownloadAgainItems.includes(e._id)
                    );
                    for (let i = 0; i < excludedItems.length; i++) {
                      const index = data[itemKey].findIndex(
                        (e) => e._id !== downloadedItems[i]._id
                      );
                      if (index !== -1) {
                        data[itemKey].splice(index, 1);
                      }
                    }
                  }
                  if (data[itemKey].length) {
                    this.downloadImpl(downloadRequest);
                  } else {
                    this.resetDownloadStatus();
                  }
                } else {
                  this.resetDownloadStatus();
                }
              });
            } else if (downloadedItems.length > 0) {
              let downloadedItemTitle = '';
              for (const item of downloadedItems) {
                downloadedItemTitle = downloadedItemTitle
                  ? `${downloadedItemTitle}, ${item.title}`
                  : `${item.title}`;
              }
              this.toast.success(
                `${downloadedItemTitle} ${
                  downloadedItems.length === 1 ? 'item is' : 'items are'
                } downloaded to your list already.`
              );
              this.resetDownloadStatus();
            }
          }
        }
      } else {
        this.resetDownloadStatus();
      }
    });
  }

  private downloadImpl(downloadRequest): void {
    this.service.download(downloadRequest).subscribe((_res) => {
      this.resetDownloadStatus();
      if (_res.status) {
        if (_res.data?.duplicatedTokens?.length) {
          const duplicatedTokens = _res.data.duplicatedTokens;
          this.dialog.open(ConfirmCustomTokenComponent, {
            maxWidth: '400px',
            width: '96vw',
            position: { top: '100px' },
            data: {
              title: 'Confirm Custom Tokens',
              message: 'There are duplicated custom tokens.',
              duplicatedTokens
            },
            disableClose: true
          });
        }
        this.load();
      }
    });
  }

  resetDownloadStatus(): void {
    this.d_status = '';
    const action = this.BULK_ACTIONS.filter((e) => e.label == 'Download');
    if (action.length) {
      action[0].loading = false;
    }
    this.selectedFiles = [];
    this.selectedFolders = [];
    this.checkingDowload = false;
  }

  generateSelectedData(element?: ResourceListItem<ListItem>): {
    data: Record<string, CheckRequestItem[]>;
    sharedTeams: any[];
  } {
    let selected = [];
    if (element) {
      selected = [element];
    } else {
      selected = this.filteredItems.filter((e) => {
        return (
          this.selectedFolders.includes(e._id) ||
          this.selectedFiles.includes(e._id)
        );
      });
    }
    const items: CheckRequestItem[] = selected.map((e) => ({
      _id: e._id,
      type: e.item_type,
      shared_with: e.shared_with
    }));
    const itemKey = this.RESOURCE_TYPE + 's';
    const sharedTeams = [];
    if (items.length === 1) {
      if (items[0]['shared_with']?.length) {
        items[0]['shared_with'].forEach((e) => {
          const values = Object.values(e);
          values.forEach((v) => {
            sharedTeams.push(v['_id']);
          });
        });
      }
    }
    const data = {
      [itemKey]: items
    };
    return { data, sharedTeams };
  }

  goToMaterial(id: string): void {
    const index = _.findIndex(this.filteredItems, function (e) {
      return e._id == id;
    });
    const folders = this.filteredItems.filter((e) => e.item_type === 'folder');
    const page = Math.ceil((index + folders.length) / this.pageSize.id);
    this.changePage(page);
    setTimeout(() => {
      const el = this.myElement.nativeElement.querySelector(
        '#material-video-' + id
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('focus');
        setTimeout(() => {
          if (el) {
            el.classList.remove('focus');
          }
        }, 2000);
      }
    }, 2000);
  }

  moveToOtherFolder(element?: ResourceListItem<ListItem>): void {
    let selectedFiles = [];
    if (element) {
      selectedFiles = [element];
    } else {
      selectedFiles = this.filteredItems.filter((e) => {
        return e.item_type !== 'folder' && this.selectedFiles.includes(e._id);
      });
    }
    if (!selectedFiles.length) {
      this.dialog.open(NotifyComponent, {
        width: '96vw',
        maxWidth: '360px',
        data: {
          message: 'You have to select material(s) to move those to the folder.'
        }
      });
      return;
    }
    // TODO: Update the move folder component (Folder Structure)
    this.dialog
      .open(MoveFolderComponent, {
        width: '96vw',
        maxWidth: '500px',
        data: {
          type: this.RESOURCE_TYPE,
          files: selectedFiles,
          source: this.currentFolder || ''
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.selectedFiles = [];
          this.load();
        }
      });
  }

  deleteFolder(element?: ResourceListItem<ListItem>): void {
    let selectedfolders = [];
    if (element) {
      selectedfolders = [element];
    } else {
      selectedfolders = this.filteredItems.filter(
        (e) => e.item_type === 'folder' && this.selectedFolders.includes(e._id)
      );
    }
    if (!selectedfolders.length) {
      return;
    } else {
      this.dialog
        .open(DeleteFolderComponent, {
          width: '96vw',
          maxWidth: '500px',
          data: {
            type: this.RESOURCE_TYPE,
            folders: selectedfolders,
            source: this.currentFolder || ''
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.selectedFolders = [];
            this.load();
          }
        });
    }
  }

  editFolder(folder?: FolderItem): void {
    const data = {};
    if (folder) {
      data['folder'] = { ...folder };
    } else {
      const selectedFolders = this.filteredItems.filter((e) => {
        return e.item_type === 'folder' && this.selectedFolders.includes(e._id);
      });
      data['folders'] = [...selectedFolders];
    }
    this.dialog
      .open(FolderComponent, {
        width: '96vw',
        maxWidth: '400px',
        data
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.load();
          this.selectedFolders = [];
        }
      });
  }

  createFolder(event): void {
    event?.stopPropagation();
    event?.preventDefault();
    this.dialog
      .open(FolderComponent, {
        width: '96vw',
        maxWidth: '400px',
        data: {
          type: this.RESOURCE_TYPE,
          folder_id: this.currentFolder
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.load();
        }
      });
  }

  rowHover(index: any): void {
    if (this.dropdowns?.['_results'].length > 0) {
      for (const dropdown of this.dropdowns['_results']) {
        if (dropdown.isOpen()) {
          dropdown.close();
        }
      }
    }
  }

  gotoParentFolder(element: any): void {
    const recParam: FolderItemInfo = {
      folder: this.currentFolder,
      itemId: element._id,
      itemType: element.item_type
    };
    this.service
      .requestFolderId(recParam)
      .pipe()
      .subscribe((res) => {
        if (res) {
          if (res?.data?.folderId) {
            this.onChangeKeyword.next('');
            this.clearFilterOptions();
            if (res?.data?.rootFolder) {
              this.router.navigate(['/' + this.RESOURCE_TYPE + 's/own/root']);
            } else {
              this.router.navigate([
                '/' + this.RESOURCE_TYPE + 's/own/' + res.data.folderId
              ]);
            }
          }
        }
      });
  }

  getActiveCounts(): void {
    if (!this.service['getActiveCounts']) {
      return;
    }
    const start = (this.page - 1) * this.pageSize.id;
    const end = start + this.pageSize.id;
    const pageResourceIds = this.filteredItems
      .slice(start, end)
      .filter((e) => e.item_type !== 'folder')
      .map((e) => e._id);
    if (!pageResourceIds?.length) {
      return;
    }
    this.service['getActiveCounts']({
      automation_ids: pageResourceIds
    }).subscribe((res) => {
      if (res?.data) {
        const countData = res.data;
        this.filteredItems
          .slice(start, end)
          .filter((e) => e.item_type !== 'folder')
          .forEach((e) => {
            countData.some((c) => {
              if (c.id === e['_id']) e['contacts'] = c.contacts;
            });
          });
      }
    });
  }
  // Bulk Actions Interface
  abstract doAction(action: BulkActionItem): void;

  abstract doFolderAction(action: BulkActionItem): void;
}
