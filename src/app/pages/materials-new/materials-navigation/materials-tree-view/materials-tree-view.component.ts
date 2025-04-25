import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { BehaviorSubject, Observable, Subscription, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CollectionViewer,
  DataSource,
  SelectionChange
} from '@angular/cdk/collections';
import {
  MaterialListType,
  MaterialTreeNode
} from '@app/core/interfaces/resources.interface';
import { MaterialNavigateService } from '@app/services/material-navigate.service';
import { MaterialType } from '@core/enums/resources.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-materials-tree-view',
  templateUrl: './materials-tree-view.component.html',
  styleUrls: ['./materials-tree-view.component.scss']
})
export class MaterialsTreeViewComponent implements OnInit {
  _type: MaterialListType = null;
  @Input() set type(val) {
    if (!['Own', 'Library'].includes(this._type)) {
      this._type = val;
      this.changedType(val);
    }
  }
  @Output() gotoFolder = new EventEmitter();

  dataSource;
  treeControl: NestedTreeControl<MaterialTreeNode>;
  activeFolderIdSubscription: Subscription;
  activeFolder: {
    folderId: string;
    type: MaterialListType;
    teamId?: string;
  } | null | null;

  readonly ResourceType = MaterialType;

  constructor(
    public materialNavigateService: MaterialNavigateService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  changedType(type: MaterialListType) {
    this.treeControl = new NestedTreeControl<MaterialTreeNode>(
      this.getChildren
    );
    this.dataSource = new MaterialListSource(
      this.treeControl,
      this.materialNavigateService,
      type
    );

    this.activeFolderIdSubscription &&
      this.activeFolderIdSubscription.unsubscribe();
    this.activeFolderIdSubscription =
      this.materialNavigateService.activeFolder$.subscribe((_activeFolder) => {
        this.activeFolder = _activeFolder;
        if(this.activeFolder){
          this.gotoFolder.emit();     
        }    
      });
  }

  getChildren = (node: MaterialTreeNode) => node?.children;

  hasChild = (_: number, node: MaterialTreeNode) => {
    return !!node?.hasChild;
  };

  toggleSelectFolder(event: any, node: MaterialTreeNode) {
    event.preventDefault();
    const folderId = node.id;
    const teamId = node?.teamId;
    const role = node.role;
    const param =
      this.activeFolder?.folderId === folderId &&
      this.activeFolder?.type == this._type
        ? null
        : { type: this._type, folderId };

    this.materialNavigateService.selectFolder(param);
    if (!teamId) {
      if (role === 'admin') {
        this.router.navigate(['/materials/library/' + folderId], {
          state: {
            fromTree: true
          }
        });
      } else {
        this.router.navigate(['/materials/own/' + folderId], {
          state: {
            fromTree: true
          }
        });
      }
    } else {
      this.router.navigate(['/materials/library/' + teamId + '/' + folderId], {
        state: {
          fromTree: true
        }
      });
    }
  }
}

export class MaterialListSource extends DataSource<MaterialTreeNode> {
  treeData = new BehaviorSubject<MaterialTreeNode[]>([]);
  treeSubscription: Subscription;
  activeFolderIdSubscription: Subscription;
  activeNode: MaterialTreeNode | null = null;
  activeFolder: {
    folderId: string;
    type: MaterialListType;
    teamId?: string;
  } | null = null;
  expandedNodes: Set<string>;
  isFirstLoading = true;

  get data(): MaterialTreeNode[] {
    return this.treeData.getValue();
  }
  set data(value: MaterialTreeNode[]) {
    this._treeControl.dataNodes = value;
    this.treeData.next(value);
  }

  constructor(
    private _treeControl: NestedTreeControl<MaterialTreeNode>,
    private materialNavigateService: MaterialNavigateService,
    private _type: MaterialListType
  ) {
    super();
    this._init();
  }

  connect(collectionViewer: CollectionViewer): Observable<MaterialTreeNode[]> {
    this._treeControl.expansionModel.changed.subscribe((change) => {
      if (
        (change as SelectionChange<MaterialTreeNode>).added ||
        (change as SelectionChange<MaterialTreeNode>).removed
      ) {
        this.handleTreeControl(change as SelectionChange<MaterialTreeNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.treeData).pipe(
      map(() => {
        return this.data;
      })
    );
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  private _init() {
    this.treeSubscription?.unsubscribe();
    this.treeSubscription = this.materialNavigateService.folderTree$[
      this._type
    ].subscribe((data) => {
      this.isFirstLoading = false;
      // Preserve expansion state recursively
      const expandedNodes = this._getExpandedNodesRecursively(
        this._treeControl.dataNodes ?? []
      );
      // Update tree data
      this.data = data;
      // Restore expansion state recursively
      this._restoreExpandedNodesRecursively(
        this._treeControl.dataNodes ?? [],
        expandedNodes
      );
    });
    this.activeFolderIdSubscription?.unsubscribe();
    this.activeFolderIdSubscription =
      this.materialNavigateService.activeFolder$.subscribe((_activeFolder) => {
        if (_activeFolder) {
          const existsActiveNode = this.getNodeByFolderID(
            _activeFolder.folderId,
            this.treeData.getValue()
          );

          if (!existsActiveNode && this.activeFolder) {
            const expandNode = this.getNodeByFolderID(
              this.activeFolder.folderId,
              this.treeData.getValue()
            );

            if (expandNode && expandNode.hasChild) {
              this.fetchChildNode(expandNode);
              this._treeControl.expand(expandNode);
            }
          } else {
            this.fetchChildNode(existsActiveNode);
            this._treeControl.expand(existsActiveNode);
          }
        }
        this.activeFolder = _activeFolder;
      });
    this.isFirstLoading = true;
    this.materialNavigateService.loadFolderList(this._type);
  }

  /** Handle expand/collapse behaviors */
  private handleTreeControl(change: SelectionChange<MaterialTreeNode>) {
    if (change.added) {
      change.added.forEach((node) => this.fetchChildNode(node));
    }
  }

  /**
   * Toggle the node, remove from display list
   */
  private fetchChildNode(node: MaterialTreeNode) {
    if (!node?.hasChild || (!!node?.hasChild && node?.children?.length > 0)) {
      return;
    }
    node.isLoading = true;
    this.activeNode = node;
    this.materialNavigateService.loadFolderList(this._type, {
      folder: node.id,
      team: node.teamId
    });
  }

  /**
   * Function to preserve expansion state recursively
   */
  private _getExpandedNodesRecursively(nodes: MaterialTreeNode[]): Set<string> {
    const expandedNodes = new Set<string>();
    nodes.forEach((node) => {
      if (this._treeControl.isExpanded(node)) {
        expandedNodes.add(node.name);
      }
      if (node?.children?.length > 0) {
        const newSet = this._getExpandedNodesRecursively(node.children);
        newSet.forEach((item) => expandedNodes.add(item));
      }
    });
    return expandedNodes;
  }

  /**
   * Function to restore expansion state recursively
   */
  private _restoreExpandedNodesRecursively(
    nodes: MaterialTreeNode[],
    expandedNodes: Set<string>
  ) {
    nodes.forEach((node) => {
      if (expandedNodes.has(node.name)) {
        this._treeControl.expand(node);
        node.isLoading = false;
      }
      if (node?.children?.length > 0) {
        this._restoreExpandedNodesRecursively(node.children, expandedNodes);
      }
    });
  }

  private getNodeByFolderID(
    folderId: string,
    nodeList: MaterialTreeNode[]
  ): MaterialTreeNode | null {
    for (const node of nodeList) {
      if (node.id === folderId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const childNode = this.getNodeByFolderID(folderId, node.children);
        if (childNode) {
          return childNode;
        }
      }
    }

    return null;
  }
}
