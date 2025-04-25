import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { FolderComponent } from '@components/folder/folder.component';
import { ResourceCategory } from '@core/enums/resources.enum';
import { MaterialListService } from '@services/material-list.service';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import {
  AutomationItem,
  MaterialItem,
  TemplateItem,
  FolderItem,
  FolderResponseData
} from '@core/interfaces/resources.interface';
@Component({
  selector: 'app-move-folder',
  templateUrl: './move-folder.component.html',
  styleUrls: ['./move-folder.component.scss']
})
export class MoveFolderComponent implements OnInit, OnDestroy {
  files: (MaterialItem | AutomationItem | TemplateItem)[] = [];
  sourceFolder = '';
  type: ResourceCategory = ResourceCategory.MATERIAL;

  parentFolder: FolderItem;
  currentFolder: FolderItem;
  folders: FolderItem[] = [];
  historyStacks = {};

  isLoading = false;
  moving = false;
  folderName = '';
  pageName = '';
  currentFolderName = '';
  newFolderToggle = false;

  loadSubscription: Subscription;
  moveSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private service: MaterialListService,
    private dialogRef: MatDialogRef<MoveFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService
  ) {
    this.type = this.data.type;
    this.files = this.data.files;
    this.sourceFolder = this.data.source;
  }

  ngOnInit(): void {
    const currentURL = window.location.href;
    if (currentURL.includes('materials')) this.pageName = 'Materials';
    else if (currentURL.includes('automations')) this.pageName = 'Automations';
    else if (currentURL.includes('templates')) this.pageName = 'Templates';
    this.goToFolder();
  }

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  goToFolder(folder?: FolderItem): void {
    if (folder) this.currentFolderName = folder?.title;
    else this.currentFolderName = `My ${this.pageName} List`;
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
          this.folders = res.data.results;
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

  folderAction(evt: any): void {
    if (evt._id == 'new') {
      this.dialog
        .open(FolderComponent, {
          width: '96vw',
          maxWidth: '400px'
        })
        .afterClosed()
        .subscribe((res) => {});
    }
  }

  move(): void {
    const target = this.currentFolder?._id || '';
    const source = this.sourceFolder || '';
    const folderIds = this.files
      .filter((e) => e.item_type === 'folder')
      .map((e) => e._id);
    if (target === source && folderIds.includes(target)) {
      this.toast.error(
        'You can not move the selected files to the current folder.'
      );
      return;
    }
    const videos = [];
    const images = [];
    const pdfs = [];
    const automations = [];
    const templates = [];
    const folders = [];
    if (this.type === ResourceCategory.MATERIAL) {
      this.files.forEach((e) => {
        const itemType = e.item_type || e['material_type'];
        switch (itemType) {
          case 'video':
            videos.push(e._id);
            break;
          case 'pdf':
            pdfs.push(e._id);
            break;
          case 'image':
            images.push(e._id);
            break;
          case 'folder':
            folders.push(e._id);
            break;
        }
      });
    } else if (this.type === ResourceCategory.AUTOMATION) {
      this.files.forEach((e) => {
        if (e.item_type === 'folder') {
          folders.push(e._id);
        } else {
          automations.push(e._id);
        }
      });
    } else if (this.type === ResourceCategory.TEMPLATE) {
      this.files.forEach((e) => {
        if (e.item_type === 'folder') {
          folders.push(e._id);
        } else {
          templates.push(e._id);
        }
      });
    }

    this.moving = true;
    this.moveSubscription = this.service
      .moveFiles(
        { videos, images, pdfs, automations, templates, folders },
        this.currentFolder?._id || '',
        source
      )
      .subscribe((status) => {
        this.moving = false;
        if (status) {
          this.closeDlg(
            source,
            this.currentFolder?._id || '',
            videos,
            images,
            pdfs,
            automations,
            templates,
            folders
          );
        }
      });
  }

  closeDlg(
    source: string,
    target: string,
    videos: string[],
    images: string[],
    pdfs: string[],
    automations: string[],
    templates: string[],
    folders: string[]
  ): void {
    this.dialogRef.close(true);
  }

  removeInput(): void {
    this.folderName = '';
  }
}
