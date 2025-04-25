import { Component, Input, OnInit } from '@angular/core';
import { STATUS, MIN_ROW_COUNT } from '@constants/variable.constants';
import { Contact } from '@models/contact.model';
import { TagService } from '@services/tag.service';

@Component({
  selector: 'app-tag-contacts-list',
  templateUrl: './tag-contacts-list.component.html',
  styleUrls: ['./tag-contacts-list.component.scss']
})
export class TagContactsListComponent implements OnInit {
  @Input('tag') tag = '';

  tagContacts: Contact[] = []; // loaded contacts list by page & search
  length = 0; // total length of the contacts

  searchStr = ''; // search query
  MIN_ROW_COUNT = MIN_ROW_COUNT;
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[2];
  page = 1;

  isLoading = false;

  constructor(private tagService: TagService) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  ngOnChanges(changes: any): void {
    this.page = 1;
    if (changes.tag) {
      this.loadContacts();
    }
  }

  loadContacts(): void {
    this.isLoading = true;
    this.tagContacts = [];
    this.tagService
      .loadTagContacts(this.tag, this.page, this.pageSize.id, this.searchStr)
      .subscribe((res) => {
        const contacts = [];
        res['data'].forEach((e) => {
          contacts.push(new Contact().deserialize(e));
        });
        this.tagContacts = contacts;
        this.length = res['total'] ?? 0;
        this.isLoading = false;
      });
  }

  changeSearchStr(): void {
    this.page = 1;
    this.loadContacts();
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }

  changePageSize(type: any): void {
    this.pageSize = type;
    this.page = 1;
    this.loadContacts();
  }

  changePage(page: number): void {
    this.page = page;
    this.loadContacts();
  }

  pageChanged($event: number): void {
    this.changePage($event);
  }
}
