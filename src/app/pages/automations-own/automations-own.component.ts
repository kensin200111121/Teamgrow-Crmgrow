import {
  Component,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AutomationType,
  ListType,
  ResourceCategory
} from '@core/enums/resources.enum';
import {
  AutomationItem,
  BulkActionItem,
  FilterTypeItem,
  SortTypeItem
} from '@core/interfaces/resources.interface';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { BulkActions } from '@constants/variable.constants';
import { AutomationListService } from '@services/automation-list.service';
import { UserService } from '@services/user.service';
import { ResourceListBase } from '@pages/resource-list-base/resource-list-base.component';
import { AutomationAssignComponent } from '@components/automation-assign/automation-assign.component';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { ConfirmRemoveAutomationComponent } from '@components/confirm-remove-automation/confirm-remove-automation.component';
import { AutomationService } from '@services/automation.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-automations-own',
  templateUrl: './automations-own.component.html',
  styleUrls: ['./automations-own.component.scss'],
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({ height: '0px', minHeight: '0', display: 'none' })
      ),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      )
    ])
  ]
})
export class AutomationsOwnList extends ResourceListBase<
  AutomationItem,
  AutomationListService,
  AutomationType
> {
  DISPLAY_COLUMNS: string[] = [
    'select',
    'title',
    'share',
    'type',
    // 'label',
    'state',
    'start-trigger',
    'action-count',
    'contacts',
    'created',
    'actions'
  ];
  LIST_TYPE: ListType = ListType.OWN;
  FILTER_TYPES: FilterTypeItem<AutomationType>[] = [
    { id: AutomationType.ALL, label: 'All types' },
    { id: AutomationType.FOLDER, label: 'Folder' },
    { id: AutomationType.CONTACT, label: 'Contact' },
    { id: AutomationType.DEAL, label: 'Deal' }
  ];
  filterType = this.FILTER_TYPES[0];
  SORT_TYPES: SortTypeItem[];
  sortType: SortTypeItem;
  BULK_ACTIONS: BulkActionItem[] = BulkActions.Automations;
  FOLDER_ACTIONS: BulkActionItem[] = BulkActions.Folders;
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.AUTOMATION;
  BASE_URL = '/automations/own';

  isPackageAutomation = true;
  isShowTooltip = true;
  @ViewChild(NgbTooltip) tooltip: NgbTooltip;
  profileSubscription: Subscription;
  @ViewChildren(NgbTooltip) tooltips: QueryList<NgbTooltip>;
  constructor(
    protected service: AutomationListService,
    protected toast: ToastrService,
    protected dialog: MatDialog,
    protected route: ActivatedRoute,
    protected router: Router,
    protected userService: UserService,
    private automationService: AutomationService,
    protected myElement: ElementRef
  ) {
    super();
    this.initSubscribers();
    this.sortField = 'created_at';
    this.sortDir = true;
  }

  initSubscribers(): void {
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.isPackageAutomation = res.automation_info?.is_enabled;
    });
  }

  assignAutomation(event: Event, automation: AutomationItem): void {
    event.stopPropagation();
    this.dialog
      .open(AutomationAssignComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          automation,
          assignType: automation.type
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.status) {
          this.load();
        } else {
          this.tooltips.forEach((t) => t.close());
        }
      });
  }

  openAutomation(event: Event, automation: AutomationItem): void {
    event.stopPropagation();
    this.router.navigate(['/autoflow/edit/' + automation._id]);
  }

  duplicate(event: Event, automation: AutomationItem): void {
    event.stopPropagation();
    if (this.currentFolder) {
      this.router.navigate(['/autoflow/clone/' + automation._id], {
        queryParams: { folder: this.currentFolder }
      });
    } else {
      this.router.navigate(['/autoflow/clone/' + automation._id]);
    }
  }

  createAutomation(): void {
    if (this.currentFolder) {
      this.router.navigate(['/autoflow/new/'], {
        queryParams: { folder: this.currentFolder }
      });
    } else {
      this.router.navigate(['/autoflow/new/']);
    }
  }

  deleteAutomation(event: Event, automation: AutomationItem): void {
    event.stopPropagation();
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete Automation',
        message: 'Are you sure you want to delete the automation?',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.automationService
          .delete(this.currentFolder, automation._id)
          .subscribe((res2) => {
            if (
              res2.status &&
              res2.error_message &&
              res2.error_message.length > 0
            ) {
              const confirmBulkDialog = this.dialog.open(
                ConfirmRemoveAutomationComponent,
                {
                  position: { top: '100px' },
                  data: {
                    title: 'Delete Automation',
                    additional: res2.error_message,
                    automation_id: automation._id,
                    message:
                      "You can't remove automation '" + automation.title + "'."
                  }
                }
              );
              confirmBulkDialog.afterClosed().subscribe((res1) => {
                //   this.automationService.reload();
                //   this.automationService.loadLibrary(true);
              });
            } else {
              this.toast.success('Automation successfully deleted.');
              this.load();
            }
          });
      }
    });
  }

  deleteAutomations(): void {
    if (!this.selectedFiles.length) {
      return;
    } else {
      const confirmDialog = this.dialog.open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Automations',
          message:
            this.selectedFiles.length === 1
              ? 'single_automation_delete_confirmation'
              : 'multiple_automations_delete_confirmation',
          confirmLabel: 'Delete',
          mode: 'warning',
          cancelLabel: 'Cancel'
        }
      });
      confirmDialog.afterClosed().subscribe((res) => {
        if (res) {
          this.automationService
            .bulkRemove(this.currentFolder, this.selectedFiles)
            .subscribe((res) => {
              if (res.status && res.failed && res.failed.length > 0) {
                const confirmBulkDialog = this.dialog.open(
                  ConfirmRemoveAutomationComponent,
                  {
                    position: { top: '100px' },
                    data: {
                      title: 'Delete Automations',
                      additional: res.failed,
                      message:
                        "You can't remove following automations. Click expand to see detail reason."
                    }
                  }
                );
                confirmBulkDialog.afterClosed().subscribe((res1) => {
                  this.load();
                  this.selectedFiles = [];
                });
              } else if (res.status) {
                this.toast.success('Automations successfully deleted.');
                this.load();
                this.selectedFiles = [];
              }
            });
        }
      });
    }
  }

  doAction(action: BulkActionItem): void {
    switch (action.command) {
      case 'select':
        this.selectAll();
        break;
      case 'deselect':
        this.selectedFiles = [];
        this.selectedFolders = [];
        break;
      case 'folder':
        this.moveToOtherFolder();
        break;
      case 'share':
        this.share();
        break;
      case 'delete':
        this.deleteAutomations();
        break;
    }
  }
  doFolderAction(action: BulkActionItem): void {
    switch (action.command) {
      case 'edit':
        this.editFolder();
        break;
      case 'delete':
        this.deleteFolder();
        break;
      case 'deselect':
        this.selectedFolders = [];
        break;
    }
  }
}
