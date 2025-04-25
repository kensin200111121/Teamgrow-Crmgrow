import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AutomationService } from '@services/automation.service';
import { TemplatesService } from '@services/templates.service';
import { FolderComponent } from '@components/folder/folder.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-change-folder',
  templateUrl: './change-folder.component.html',
  styleUrls: ['./change-folder.component.scss']
})
export class ChangeFolderComponent implements OnInit {
  folders: any[] = [];
  files: any[] = [];
  rootFolder = { _id: 'root' };
  newFolder = { _id: 'new' };
  selectedFolder: any = {};
  currentFolder: any = {};
  moving = false;
  fileType = 'template';
  isRoot: boolean = true;

  moveSubscription: Subscription;

  constructor(
    private automationService: AutomationService,
    private templateService: TemplatesService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ChangeFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.files = this.data?.files || [];
    this.folders = this.data?.folders || [];
    this.currentFolder = this.data?.currentFolder;
    this.isRoot = !this.currentFolder?._id;
    this.fileType = this.data.fileType || 'template';
    if (!this.isRoot) {
      this.folders = this.folders.filter(
        (e) => e._id !== this.currentFolder?._id
      );
    }
  }

  ngOnDestroy(): void {}

  folderAction(evt: any): void {
    if (evt._id == 'new') {
      this.dialog
        .open(FolderComponent, {
          width: '96vw',
          maxWidth: '400px',
          data: {
            type: this.fileType
          }
        })
        .afterClosed()
        .subscribe((res) => {
          // insert new folder to list(service subject) and select new folder
          this.folders.push(res);
          if (this.fileType === 'template') {
            this.templateService.create$({ ...res, isFolder: true });
          } else {
            this.automationService.create$({ ...res, isFolder: true });
          }
          this.selectedFolder = res;
        });
    }
  }

  move(): void {
    const fileIds = this.files.map((e) => e._id);

    let source = '';
    if (this.currentFolder && this.currentFolder._id) {
      source = this.currentFolder._id;
    }

    const body = {
      files: fileIds,
      source
    };
    if (this.selectedFolder._id === 'root') {
      body['target'] = '';
    } else {
      body['target'] = this.selectedFolder._id;
    }

    this.moving = true;
    if (this.fileType === 'template') {
      this.moveSubscription = this.templateService
        .moveFiles(body)
        .subscribe((status) => {
          this.moving = false;
          if (status) {
            this.closeDlg(body);
          }
        });
    } else if (this.fileType === 'automation') {
      this.moveSubscription = this.automationService
        .moveFiles(body)
        .subscribe((status) => {
          this.moving = false;
          if (status) {
            this.closeDlg(body);
          }
        });
    }
  }

  closeDlg(data: any): void {
    const { source, target, files } = data;
    if (source) {
      if (this.fileType === 'template') {
        const _currentFiles = this.currentFolder.templates;
        _.pullAll(_currentFiles, files);
        this.templateService.update$(source, { templates: _currentFiles });
      } else if (this.fileType === 'automation') {
        const _currentFiles = this.currentFolder.automations;
        _.pullAll(_currentFiles, files);
        this.automationService.update$(source, { automations: _currentFiles });
      }
    }
    if (target) {
      if (this.fileType === 'template') {
        const _targetFiles = this.selectedFolder.templates;
        const _newFiles = _.union(_targetFiles, files);
        this.templateService.update$(target, { templates: _newFiles });
      } else if (this.fileType === 'automation') {
        const _targetFiles = this.selectedFolder.automations;
        const _newFiles = _.union(_targetFiles, files);
        this.automationService.update$(target, { automations: _newFiles });
      }
    }
    this.dialogRef.close();
  }
}
