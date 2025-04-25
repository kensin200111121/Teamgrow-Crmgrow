import { Component, Input, OnInit } from '@angular/core';
import { FolderService } from '@app/services/folder.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const DisplayDepth = 4;
@Component({
  selector: 'app-folder-tree',
  templateUrl: './folder-tree.component.html',
  styleUrls: ['./folder-tree.component.scss']
})
export class FolderTreeComponent implements OnInit {
  folderId = '';
  folderTree = [];
  rootFolder = null;
  shouldShowDropdown = false;
  @Input('baseRoute') baseRoute = '';

  @Input('teamId') teamId = '';
  curFolderName = '';

  @Input()
  public set setFolder(id: string) {
    if (this.folderId === id) {
      return;
    }

    this.folderId = id;
    this.getAllParents();
  }

  constructor(protected service: FolderService, private router: Router) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.router.url.includes('root')) {
          this.initRoot();
          return;
        }
        const navigation = this.router.getCurrentNavigation();
        const state = navigation.extras.state;
        if (state) {
          if (state.fromTree) {
            return;
          }
          if (this.teamId && state.isOwn) {
            return;
          }
          if (this.rootFolder) {
            this.folderTree.push({
              folderId: this.folderId,
              folderName: this.curFolderName
            });
          } else {
            this.rootFolder = {
              folderId: 'root'
            };
          }

          this.folderId = state.folderId;
          this.curFolderName = state.folderName;
          this.shouldShowDropdown = this.folderTree.length >= DisplayDepth;
        }
      });
  }

  initRoot(): void {
    this.folderTree = [];
    this.rootFolder = null;
    this.curFolderName = '';
    this.shouldShowDropdown = false;
  }

  getAllParents(): void {
    if (!this.folderId) {
      this.initRoot();
      return;
    }

    const index = this.folderTree.findIndex(
      (e) => e.folderId === this.folderId
    );

    if (index >= 0) {
      this.curFolderName = this.folderTree[index].folderName;
      this.folderTree = this.folderTree.slice(0, index);
      this.shouldShowDropdown = this.folderTree.length > DisplayDepth;
      return;
    }

    this.service
      .getParentFolders({ folder: this.folderId, team_id: this.teamId })
      .subscribe((res) => {
        if (res) {
          this.folderTree = res.data?.folderTree || [];

          this.curFolderName = res.data?.currentFolder || '';
          this.rootFolder = this.folderTree[0];
          if (this.teamId) {
            if (!this.rootFolder) {
              this.rootFolder = {
                folderId: 'root'
              };
            }
          } else {
            this.folderTree.shift();
          }
          this.shouldShowDropdown = this.folderTree.length >= DisplayDepth;
        }
      });
  }

  getBaseRoute(): string {
    if (this.baseRoute.includes('community')) {
      return this.baseRoute.toLowerCase();
    }
    return `${this.baseRoute}/${
      this.teamId ? `${this.teamId}/` : ''
    }`.toLowerCase();
  }

  getPrevRoute(): string {
    const prevFolder = this.folderTree[this.folderTree.length - 1];
    return prevFolder
      ? `${this.getBaseRoute()}/${prevFolder.folderId}`.toLowerCase()
      : `${this.baseRoute}/root`.toLowerCase();
  }
}
