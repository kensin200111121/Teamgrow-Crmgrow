import { Component, Input, OnInit } from '@angular/core';
import { Contact } from '@models/contact.model';
import { Label } from '@models/label.model';
import { LabelService } from '@services/label.service';

@Component({
  selector: 'app-label-contacts-list',
  templateUrl: './label-contacts-list.component.html',
  styleUrls: ['./label-contacts-list.component.scss']
})
export class LabelContactsListComponent implements OnInit {

  @Input('label') label: Label;

  NORMAL_COLUMNS = ['contact_name', 'label_name'];
  DISPLAY_COLUMNS = this.NORMAL_COLUMNS;

  labelContacts: Contact[] = []; // loaded contacts list by page & search
  length: number = 0; // total length of the contacts

  searchStr: string = ''; // search query
  
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[2];
  page: number = 1;

  isLoading: boolean = false;

  constructor(
    private labelService: LabelService,
  ) { 
  }

  ngOnInit(): void {
    this.loadContacts();
  }

  ngOnChanges(changes: any): void {
    if (changes.label) {
      this.loadContacts();
    }
  }

  loadContacts(): void {
    this.isLoading = true;    
    this.labelContacts = [];
    this.labelService
      .loadLabelContacts(this.label._id, this.page, this.pageSize.id, this.searchStr)
      .subscribe((res) => {
        const contacts = [];
        res['data'].forEach((e) => {
          contacts.push(new Contact().deserialize(e));
        });
        this.labelContacts = contacts;
        this.length = res['total'];
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
