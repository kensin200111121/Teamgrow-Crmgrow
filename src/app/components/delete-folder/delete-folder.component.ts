import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Material } from '@models/material.model';
import { Subscription } from 'rxjs';
import { StoreService } from '@services/store.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog
} from '@angular/material/dialog';
import { MaterialService } from '@services/material.service';
import * as _ from 'lodash';
import { UserService } from '@services/user.service';
import {
  FolderItem,
  FolderResponseData
} from '@core/interfaces/resources.interface';
import { ResourceCategory } from '@core/enums/resources.enum';
import { MaterialListService } from '@services/material-list.service';
import { finalize } from 'rxjs/operators';
import { ConfirmBulkMaterialsComponent } from '@components/confirm-bulk-materials/confirm-bulk-materials.component';
import { ConfirmBulkAutomationComponent } from '@components/confirm-bulk-automation/confirm-bulk-automation.component';
import { TemplatesService } from '@services/templates.service';
import { AutomationService } from '@services/automation.service';

@Component({
  selector: 'app-delete-folder',
  templateUrl: './delete-folder.component.html',
  styleUrls: ['./delete-folder.component.scss']
})
export class DeleteFolderComponent implements OnInit, OnDestroy {
  files: FolderItem[] = [];
  sourceFolder: string = '';
  type: ResourceCategory = ResourceCategory.MATERIAL;

  parentFolder: FolderItem;
  currentFolder: FolderItem;
  folders: FolderItem[] = [];
  historyStacks = {};

  isLoading = false;
  submitted = false;

  loadSubscription: Subscription;
  moveSubscription: Subscription;

  currentOption = 'remove-all';
  listService: TemplatesService | AutomationService | MaterialService;

  constructor(
    private service: MaterialListService,
    private materialService: MaterialService,
    private automationService: AutomationService,
    private templateService: TemplatesService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<DeleteFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.type = this.data.type;
    this.files = this.data.folders;
    this.sourceFolder = this.data.source;
  }

  ngOnInit(): void {
    this.goToFolder();
    switch (this.type) {
      case ResourceCategory.AUTOMATION:
        this.listService = this.automationService;
        break;
      case ResourceCategory.TEMPLATE:
        this.listService = this.templateService;
        break;
      case ResourceCategory.MATERIAL:
        this.listService = this.materialService;
        break;
    }
  }

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  goToFolder(folder?: FolderItem): void {
    this.preload(folder);
    this.currentFolder = folder;
    this.load();
  }

  preload(folder?: FolderItem): void {
    const folderId = folder?._id || 'root';
    const historyStacks = this.historyStacks;
    const history = historyStacks[folderId];
    if (history) {
      this.folders = history.results;
      this.parentFolder = history.prevFolder;
    } else {
      this.folders = [];
      this.parentFolder = null;
    }
  }

  load(): void {
    this.isLoading = true;
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.service
      .loadFolder(this.type, this.currentFolder?._id || '')
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.data) {
          const folderIds = this.files.map((e) => e._id);
          const data = res.data.results.filter(
            (e) => !folderIds.includes(e._id)
          );
          this.folders = data;
          this.parentFolder = res.data.prevFolder;
          this.storeHistory(res.data, this.currentFolder?._id);
        }
      });
  }

  storeHistory(data: FolderResponseData, folder?: string): void {
    const history = this.historyStacks;
    const folderId = folder || 'root';
    if (folderId === 'root') {
      history[folderId] = data;
      return;
    }
    // Check the deep current page
    if (Object.keys(history).length > 4) {
      const folderToRemove = Object.keys(history).filter(
        (e) => e !== 'root'
      )[0];
      delete history[folderToRemove];
    }
    history[folderId] = data;
  }

  selectOption(type): void {
    this.currentOption = type;
  }

  isSelectedOption(type): any {
    return this.currentOption === type;
  }

  delete(): void {
    this.submitted = true;
    const ids = this.files.map((e) => e._id);
    const removeData = {
      folder: this.sourceFolder,
      ids,
      mode: this.currentOption,
      target: this.currentFolder?._id || ''
    };
    this.listService.removeFolders(removeData).subscribe((res) => {
      this.submitted = false;
      if (res.status) {
        if (res?.failed?.length > 0) {
          if (this.type == 'material') {
            this.dialog.open(ConfirmBulkMaterialsComponent, {
              position: { top: '100px' },
              width: '657px',
              maxWidth: '657px',
              disableClose: true,
              data: {
                title: 'Delete Materials',
                additional: res.failed,
                message:
                  "You can't remove following materials because those have been used in different places. Click expand to see detail reason."
              }
            });
          } else {
            this.dialog.open(ConfirmBulkAutomationComponent, {
              position: { top: '100px' },
              width: '657px',
              maxWidth: '657px',
              disableClose: true,
              data: {
                title: 'Delete Automations',
                additional: res.failed,
                message:
                  "You can't remove following automations. Click expand to see detail reason."
              }
            });
          }
        } else {
          this.dialogRef.close(true);
        }
      }
    });
  }
}
