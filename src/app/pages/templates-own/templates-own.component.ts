import { SspaService } from '../../services/sspa.service';
import {
  Component,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FilterMode,
  ListType,
  ResourceCategory,
  TemplateType
} from '@core/enums/resources.enum';
import {
  BulkActionItem,
  SortTypeItem,
  TemplateItem,
  FilterTypeItem
} from '@core/interfaces/resources.interface';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { BulkActions } from '@constants/variable.constants';
import { UserService } from '@services/user.service';
import { ResourceListBase } from '@pages/resource-list-base/resource-list-base.component';
import { TemplateListService } from '@services/template-list.service';
import { Template } from '@models/template.model';
import { finalize } from 'rxjs/operators';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { ConfirmBulkTemplatesComponent } from '@components/confirm-bulk-templates/confirm-bulk-templates.component';

@Component({
  selector: 'app-templates-own',
  templateUrl: './templates-own.component.html',
  styleUrls: ['./templates-own.component.scss']
})
export class TemplatesOwnList
  extends ResourceListBase<TemplateItem, TemplateListService, TemplateType>
  implements AfterViewInit
{
  readonly FilterMode = FilterMode;
  DISPLAY_COLUMNS: string[] = [
    'select',
    'title',
    'share',
    'download',
    'content',
    'type',
    'default',
    'actions'
  ];
  LIST_TYPE: ListType = ListType.OWN;
  SORT_TYPES: SortTypeItem[] = [
    { id: 'az', label: 'A-Z' },
    { id: 'za', label: 'Z-A' },
    { id: 'newest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' }
  ];
  FILTER_TYPES: FilterTypeItem<TemplateType>[] = [
    { id: TemplateType.FOLDER, label: 'Folder' },
    { id: TemplateType.EMAIL, label: 'Email' },
    { id: TemplateType.TEXT, label: 'Text' }
  ];
  BULK_ACTIONS: BulkActionItem[] = BulkActions.Automations;
  FOLDER_ACTIONS: BulkActionItem[] = BulkActions.Folders;
  sortType = this.SORT_TYPES[0];
  filterType = this.FILTER_TYPES[0];
  RESOURCE_TYPE: ResourceCategory = ResourceCategory.TEMPLATE;
  BASE_URL = '/templates/own';

  ICONS: { [key: string]: string } = {
    text: 'sms-sent',
    email: 'message',
    folder: 'folder'
  };

  profileSubscription: Subscription;
  garbageSubscription: Subscription;

  emailDefault: string | undefined;
  smsDefault: string | undefined;
  isSetting = false;
  scrollPos = 0;

  constructor(
    protected service: TemplateListService,
    protected toast: ToastrService,
    protected dialog: MatDialog,
    protected route: ActivatedRoute,
    protected router: Router,
    protected userService: UserService,
    protected myElement: ElementRef,
    public sspaService: SspaService,
    private cdr: ChangeDetectorRef
  ) {
    super();
    this.scrollPos = 0;
    this.initSubscribers();
  }
  ngAfterViewInit() {
    // Restore the scroll position after the view has been initialized
    this.restoreScrollPosition();
  }
  initSubscribers(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        if (garbage && garbage.canned_message) {
          this.emailDefault = garbage.canned_message.email;
          this.smsDefault = garbage.canned_message.sms;
        }
      }
    );
  }

  doAction(action: BulkActionItem): void {
    const selectedMaterials = this.filteredItems.filter(
      (e) =>
        e.item_type !== TemplateType.FOLDER &&
        this.selectedFiles.includes(e._id)
    );

    switch (action.command) {
      case 'delete': {
        this.deleteTemplate();
        break;
      }
      case 'share': {
        this.share();
        break;
      }
      case 'folder': {
        this.moveToOtherFolder();
        break;
      }
      case 'select': {
        this.selectedFiles = this.filteredItems
          .filter((e) => e.item_type !== 'folder')
          .map((e) => e._id);
        break;
      }
      case 'deselect': {
        this.selectedFiles = [];
        break;
      }
      case 'restore_pos': {
        this.cdr.detectChanges();
        this.restoreScrollPosition();
        break;
      }
    }
  }
  doFolderAction(action: BulkActionItem): void {
    switch (action.command) {
      case 'edit': {
        this.editFolder();
        break;
      }
      case 'delete': {
        this.deleteFolder();
        break;
      }
      case 'deselect': {
        this.selectedFolders = [];
        break;
      }
    }
  }

  /**
   * Set as default
   * @param template
   */
  setDefault(template: TemplateItem): void {
    const cannedMessage = {
      email: this.emailDefault,
      sms: this.smsDefault
    };
    if (template._id === this.emailDefault) {
      delete cannedMessage.email;
    } else if (template._id === this.smsDefault) {
      delete cannedMessage.sms;
    } else if (template.type === TemplateType.EMAIL) {
      cannedMessage.email = template._id;
    } else {
      cannedMessage.sms = template._id;
    }
    if (!cannedMessage.email) {
      delete cannedMessage.email;
    }
    if (!cannedMessage.sms) {
      delete cannedMessage.sms;
    }

    this.isSetting = true;
    this.userService
      .updateGarbage({ canned_message: cannedMessage })
      .pipe(
        finalize(() => {
          this.isSetting = false;
        })
      )
      .subscribe(() => {
        this.userService.updateGarbageImpl({ canned_message: cannedMessage });
        if (template.type === TemplateType.EMAIL) {
          if (cannedMessage.email) {
            this.userService.email.next(new Template().deserialize(template));
          } else {
            this.userService.email.next(null);
          }
        }
        if (template.type === TemplateType.TEXT) {
          if (cannedMessage.sms) {
            this.userService.sms.next(new Template().deserialize(template));
          } else {
            this.userService.sms.next(null);
          }
        }
      });
  }

  deleteTemplate(element?: TemplateItem): void {
    let selectedTemplates = [];
    if (element) {
      selectedTemplates = [element];
    } else {
      selectedTemplates = this.filteredItems.filter(
        (e) =>
          e.item_type !== TemplateType.FOLDER &&
          this.selectedFiles.includes(e._id)
      );
    }
    const dialog = this.dialog.open(ConfirmComponent, {
      data: {
        title: 'Delete template(s)',
        message: 'Are you sure to delete these templates?',
        confirmLabel: 'Delete',
        mode: 'warning'
      }
    });

    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.service
          .deleteTemplates(this.currentFolder, selectedTemplates)
          .subscribe((res1) => {
            if (res1.status && res1?.failed?.length) {
              this.dialog.open(ConfirmBulkTemplatesComponent, {
                position: { top: '100px' },
                data: {
                  title: 'Delete Templates',
                  additional: res1.failed,
                  message:
                    "You can't remove following templates. Click expand to see detail reason."
                }
              });
            } else if (res1.status) {
              this.selectedFiles = [];
              this.scrollPos = window.scrollY;
              this.load();
            }
          });
      }
    });
  }

  private restoreScrollPosition() {
    setTimeout(() => {
      window.scrollTo(0, this.scrollPos);
    }, 0);
  }
}
