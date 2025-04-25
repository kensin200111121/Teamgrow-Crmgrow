import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AutomationService } from '@services/automation.service';
import { TemplatesService } from '@services/templates.service';

@Component({
  selector: 'app-remove-folder',
  templateUrl: './remove-folder.component.html',
  styleUrls: ['./remove-folder.component.scss']
})
export class RemoveFolderComponent implements OnInit {
  rootFolder = { _id: 'root' };
  currentFolder = null;
  folders = [];
  selectedFolders = [];
  currentOption = 'remove-all';
  selectedFolder: any = {};
  folderType = 'template';
  submitted = false;

  constructor(
    private templateService: TemplatesService,
    private automationService: AutomationService,
    private dialogRef: MatDialogRef<RemoveFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.folders = this.data?.folders || [];
    this.selectedFolders = this.data?.selectedFolders || [];
    this.folderType = this.data?.type || 'template';
    this.currentFolder = this.data?.folder || {};
    if (this.currentFolder) {
      if (!this.selectedFolders.length) {
        this.folders = this.folders.filter(
          (e) => e._id !== this.currentFolder._id
        );
        return;
      } else {
        const selectedIds = this.selectedFolders.map((e) => e._id);
        this.folders = this.folders.filter((e) => {
          if (selectedIds.indexOf(e._id) == -1) {
            return true;
          }
        });
        return;
      }
    }
  }

  ngOnInit(): void {}

  selectOption(type: string): void {
    this.currentOption = type;
  }

  isSelectedOption(type: string): any {
    return this.currentOption === type;
  }

  delete(): void {
    this.submitted = true;
    if (this.currentOption === 'move-other') {
      if (!this.selectedFolder._id) {
        return;
      }
    }
    let data;
    if (this.currentFolder?._id) {
      data = {
        _id: this.currentFolder?._id,
        mode: this.currentOption,
        target: this.selectedFolder?._id
      };
      if (data.target === 'root') {
        data.target = '';
      }
      if (this.folderType === 'template') {
        this.templateService.removeFolder(data).subscribe((res) => {
          this.templateService.loadOwn(true);
          this.dialogRef.close();
        });
      } else {
        this.automationService.removeFolder(data).subscribe((res) => {
          this.automationService.loadOwn(true);
          this.dialogRef.close(res);
        });
      }
    } else {
      data = {
        _ids: this.selectedFolders.map((e) => e._id),
        mode: this.currentOption,
        target:
          this.selectedFolder && this.selectedFolder._id
            ? this.selectedFolder._id
            : null
      };
      if (data.target === 'root') {
        data.target = '';
      }
      if (this.folderType === 'automation') {
        this.automationService
          .removeFolders(data) // answer
          .subscribe((res) => {
            this.automationService.loadOwn(true);
            this.dialogRef.close(res);
          });
      } else if (this.folderType === 'template') {
        this.templateService
          .removeFolders(data) // answer
          .subscribe((res) => {
            this.dialogRef.close({ status: res });
          });
      }
    }
  }
}
