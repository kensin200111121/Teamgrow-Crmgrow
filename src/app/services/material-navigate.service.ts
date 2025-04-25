import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ErrorService } from './error.service';
import { HttpClient } from '@angular/common/http';
import { MATERIAL } from '@app/constants/api.constant';
import { BehaviorSubject, Observable, catchError, map } from 'rxjs';
import {
  APIFolderItem,
  APIFolderTreeResponse,
  MaterialListType,
  MaterialTreeNode
} from '@app/core/interfaces/resources.interface';

@Injectable({
  providedIn: 'root'
})
export class MaterialNavigateService extends HttpService {
  folderTree: {
    [key in MaterialListType]: BehaviorSubject<Array<MaterialTreeNode>>;
  } = {
    Library: new BehaviorSubject([]),
    Own: new BehaviorSubject([])
  };

  folderTree$ = {
    Library: this.folderTree.Library.asObservable(),
    Own: this.folderTree.Own.asObservable()
  };

  activeFolder: BehaviorSubject<{
    folderId: string;
    type: MaterialListType;
    teamId?: string;
  } | null> = new BehaviorSubject(null);

  activeFolder$ = this.activeFolder.asObservable();

  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  selectFolder(
    param: {
      folderId: string;
      type: MaterialListType;
      teamId?: string;
    } | null
  ) {
    this.activeFolder.next(param);
  }

  /**
   * fetch child folder tree list about selected folder
   * @param type navigatorType
   * @param param? {folder? : string} parent folder id
   * @returns MaterialTreeNode
   */
  loadFolderList(
    type: MaterialListType,
    param?: { folder?: string; team?: string }
  ) {
    this.loadFolderListImpl(type, param).subscribe((res) => {
      if (res) {
        const response = res.data as APIFolderTreeResponse;
        const { currentFolder, results: folderList } = response;

        if (currentFolder?.rootFolder) {
          this.folderTree[type].next(this.convertAPIDataToTree(folderList));
        } else {
          const originList = this.folderTree[type].getValue();
          const list = this.getUpdatedAPIFolderTreeList(
            originList,
            currentFolder,
            folderList
          );
          this.folderTree[type].next(list);
        }
      }
    });
  }

  /**
   * fetch child folder tree list about selected folder
   *  @param type navigatorType
   * @param param? {folder? : string} parent folder id
   * @returns APIFolderTreeResponse
   */
  loadFolderListImpl(
    type: MaterialListType,
    param?: { folder?: string; team?: string }
  ) {
    if (type === 'Library') {
      return this.httpClient
        .post(this.server + MATERIAL.LOAD_LIBRARY_FOLDER_LIST, param)
        .pipe(
          map((res) => {
            const results = res['data'].results || [];
            for (let i = 0; i < results.length; i++) {
              if (!results[i]?.team && param?.team) {
                results[i].team = { _id: param.team };
              }
            }
            res['data'].results = results;
            return res;
          }),
          catchError(this.handleError('Load Own Folder List', null))
        );
    } else {
      const paramStr = param?.folder
        ? `type=material&folder=${param.folder}`
        : `type=material`;
      return this.httpClient
        .get(this.server + 'material/folders' + '?' + `${paramStr}`)
        .pipe(
          map((res) => res),
          catchError(this.handleError('LOAD FOLDER LIST', null))
        );
    }
  }

  convertAPIDataToTree(
    folders: APIFolderItem[],
    parentId?: string
  ): MaterialTreeNode[] {
    return folders.map((folder) => {
      const { _id, rootFolder, folders, role } = folder;
      return {
        id: _id,
        name: rootFolder ? 'root folder' : folder.title ?? '',
        hasChild: folders.length > 0,
        parentId,
        teamId: folder.team?._id,
        role: role
      };
    });
  }

  getUpdatedAPIFolderTreeList(
    originList: MaterialTreeNode[],
    parentNode: APIFolderItem,
    child: APIFolderItem[]
  ): MaterialTreeNode[] {
    const updatedValue = originList.map((rootNode) => {
      const updatedRoot = this.updateNodeById(
        rootNode,
        parentNode._id,
        this.convertAPIDataToTree(child, parentNode._id)
      );

      return updatedRoot ?? rootNode;
    });
    return updatedValue;
  }

  private updateNodeById(
    root: MaterialTreeNode,
    id: string,
    children: MaterialTreeNode[]
  ): MaterialTreeNode | null {
    // Base case: if the root is null or if the current root node has the desired id
    if (!root) {
      return null; // Node not found
    }
    if (root.id === id) {
      return children.length === 0
        ? { ...root, hasChild: false, isLoading: false } // handle exception
        : { ...root, children, isLoading: false }; // Update the name of the node
    }

    // Recursive case: search through the children of the current node
    if (root.children) {
      for (let i = 0; i < root.children.length; i++) {
        const updatedChild = this.updateNodeById(
          root.children[i],
          id,
          children
        );
        if (updatedChild !== null) {
          // If the child node was found and updated, return the updated tree
          return {
            ...root,
            isLoading: false,
            children: [
              ...root.children.slice(0, i),
              updatedChild,
              ...root.children.slice(i + 1)
            ]
          };
        }
      }
    }

    return null; // Node not found
  }
}
