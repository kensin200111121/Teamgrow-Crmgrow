import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { TagDeleteComponent } from './tag-delete/tag-delete.component';
import { TagEditComponent } from './tag-edit/tag-edit.component';
import { TagService } from '@services/tag.service';
import { MatDrawer } from '@angular/material/sidenav';
import * as _ from 'lodash';
import { NgForm } from '@angular/forms';
import {
  BulkActions,
  STATUS,
  MIN_ROW_COUNT
} from '@constants/variable.constants';
import { TagMergeComponent } from './tag-merge/tag-merge.component';
import { KEY } from '@constants/key.constant';
import { JSONParser } from '@utils/functions';

@Component({
  selector: 'app-tag-manager',
  templateUrl: './tag-manager.component.html',
  styleUrls: ['./tag-manager.component.scss']
})
export class TagManagerComponent implements OnInit {
  @ViewChild('tdrawer') tdrawer: MatDrawer;

  loadTagSubscription: Subscription;
  saveSubscription: Subscription;
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  NORMAL_COLUMNS = ['contact_name', 'tag_name'];
  DISPLAY_COLUMNS = this.NORMAL_COLUMNS;

  tags = []; // tags list
  pageTags = []; // tags list per page
  newTag = ''; // the tag which is creating
  selectedTag: any; // the tag which is selected to see the contacts list
  selectedTags: string[] = []; // selected tags ids list
  isSavingNewTag = false; // flag
  isLoadingTags = false; // flag

  PAGE_COUNTS = [
    { id: 5, label: '5' },
    { id: 10, label: '10' },
    { id: 20, label: '20' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[2]; // current page type object
  page = 1; // current page

  actions = [];
  disabledActions = [];

  constructor(private dialog: MatDialog, private tagService: TagService) {
    const page = localStorage.getCrmItem(KEY.TAG_MANAGER.PAGE);
    const pageSize = localStorage.getCrmItem(KEY.TAG_MANAGER.PAGE_SIZE);
    if (page) {
      this.page = parseInt(page);
    }
    if (pageSize) {
      const parsedPageSize = JSONParser(pageSize);
      if (parsedPageSize) {
        this.pageSize = parsedPageSize;
      }
    }

    this.actions = BulkActions.TagManager;
    this.tagService.getAllTags();
  }

  ngOnInit(): void {
    this.isLoadingTags = true;
    this.tagService.tags$.subscribe((res) => {
      this.tags = res;
      this.loadPageTags();
    });

    this.tagService.loadStatus$.subscribe((status) => {
      this.isLoadingTags = status === STATUS.REQUEST;
    });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('overflow-hidden');
  }

  loadPageTags(): void {
    this.selectedTags = [];
    const length = this.tags.length;
    const startIndex = (this.page - 1) * this.pageSize.id;
    const endIndex =
      this.page * this.pageSize.id > length
        ? length
        : this.page * this.pageSize.id;
    this.pageTags = this.tags.slice(startIndex, endIndex);
  }

  onChangePage($event: number): void {
    this.page = $event;
    this.loadPageTags();
    localStorage.setCrmItem(KEY.TAG_MANAGER.PAGE, this.page + '');
  }

  onChangePageSize($event: any): void {
    if ($event.id === this.pageSize.id) return;
    this.page = 1;
    this.pageSize = $event;
    this.loadPageTags();
    localStorage.setCrmItem(KEY.TAG_MANAGER.PAGE, this.page + '');
    localStorage.setCrmItem(
      KEY.TAG_MANAGER.PAGE_SIZE,
      JSON.stringify(this.pageSize)
    );
  }

  isAllSelected(): boolean {
    for (const tag of this.pageTags) {
      if (!this.selectedTags.includes(tag._id)) return false;
    }
    return true;
  }

  isPartialSelected(): boolean {
    return this.selectedTags.length > 0;
  }

  isSelected(tag: any): boolean {
    return this.selectedTags.includes(tag._id);
  }

  onSelect(tag: any): void {
    const index = this.selectedTags.indexOf(tag._id);
    if (index === -1) {
      this.selectedTags.push(tag._id);
    } else {
      this.selectedTags.splice(index, 1);
    }
    this.updateActionButton();
  }

  onSelectAll(): void {
    const isAllSelected = this.isAllSelected();
    if (isAllSelected) {
      this.selectedTags = [];
    } else {
      this.pageTags.map((tag) => {
        if (!this.selectedTags.includes(tag._id)) {
          this.selectedTags.push(tag._id);
        }
      });
    }
    this.updateActionButton();
  }

  updateActionButton(): void {
    this.disabledActions = [];
    const isAllSelected = this.isAllSelected();
    if (isAllSelected) {
      this.disabledActions.push({
        spliter: true,
        label: 'Select all',
        type: 'button',
        command: 'select',
        loading: false
      });
    }
    if (this.selectedTags.length === 0) {
      this.disabledActions.push({
        label: 'Deselect',
        type: 'button',
        command: 'deselect',
        loading: false
      });
    }
    if (this.selectedTags.length > 1) {
      this.disabledActions.push({
        spliter: true,
        label: 'Edit',
        type: 'button',
        icon: 'i-edit',
        command: 'edit',
        loading: false
      });
    } else {
      this.disabledActions.push({
        spliter: true,
        label: 'Merge',
        type: 'button',
        icon: 'i-merge',
        command: 'merge',
        loading: false
      });
    }
  }

  onCreateNewTag(form: NgForm): void {
    if (this.newTag.replace(/\s/g, '').length == 0) {
      this.newTag = '';
      return;
    }
    this.newTag = this.newTag.toLowerCase();
    this.isSavingNewTag = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    this.saveSubscription = this.tagService
      .createTag(this.newTag)
      .subscribe((res) => {
        if (res && res.status) {
          this.isSavingNewTag = false;
          const newTag = {
            _id: this.newTag,
            count: 0
          };
          this.tags.push(newTag);
          this.tagService.tags.next(this.tags);
          this.loadPageTags();
          this.newTag = '';
          form.resetForm();
        } else {
          this.isSavingNewTag = false;
        }
      });
  }

  onAction($event: any): void {
    if ($event.command === 'deselect') {
      this.selectedTags = [];
    } else if ($event.command === 'select') {
      this.onSelectAll();
    } else if ($event.command === 'edit') {
      const tag = this.pageTags.filter(
        (tag) => tag._id === this.selectedTags[0]
      )[0];
      this.onEditTag(tag);
    } else if ($event.command === 'delete') {
      this.onDeleteTag(this.selectedTags);
    } else if ($event.command === 'merge') {
      this.onMergeTags();
    }
  }

  onEditTag(tag: any): void {
    const oldTag = tag;
    this.dialog
      .open(TagEditComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          tagName: tag._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const oldIndex = this.tags.indexOf(oldTag);
          const newIndex = this.tags.findIndex((tag) => tag._id === res);
          if (newIndex > -1) {
            const existTag = this.tags[newIndex];
            existTag.count += oldTag.count;
            this.tags[newIndex] = existTag;

            this.tags.splice(oldIndex, 1);
          } else {
            oldTag._id = res;
            this.tags[oldIndex] = oldTag;
          }
          this.tagService.tags.next(this.tags);
          this.loadPageTags();
        }
      });
  }

  onDeleteTag(tags: any[]): void {
    this.dialog
      .open(TagDeleteComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          tags: tags,
          type: 'all'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res && res.length) {
          const remain = this.tags.filter(
            (tag) => tag._id === 'lead capture' || !tags.includes(tag._id)
          );
          this.tags = remain;
          this.tagService.tags.next(this.tags);
          this.loadPageTags();
        }
      });
  }

  onMergeTag(tag: any): void {
    const mergeList = this.tags.filter((_tag) => _tag._id !== tag._id);
    this.dialog
      .open(TagMergeComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          mergeList: mergeList.map((item) => item._id).concat(),
          mergeTags: [tag._id]
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.tagService.getAllTags();
        }
      });
  }

  onMergeTags(): void {
    this.dialog
      .open(TagMergeComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '400px',
        data: {
          mergeList: this.selectedTags,
          mergeTags: this.selectedTags
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.selectedTags = [];
          this.tagService.getAllTags();
        }
      });
  }

  toggleBody(event: any): void {
    if (event) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }

  onShowTagContacts(tag: any): void {
    this.selectedTag = tag;
    this.tdrawer.open();
  }
}
