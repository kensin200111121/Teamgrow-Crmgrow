import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { STATUS } from '@constants/variable.constants';
import { ContactActivity } from '@models/contact.model';
import { ContactService } from '@services/contact.service';
import { HandlerService } from '@services/handler.service';
import { StoreService } from '@services/store.service';
import { DateRange } from '@utils/data.types';
import { FieldTypeEnum } from '@utils/enum';
import { formatDate } from '@utils/functions';
import { RouterService } from '@app/services/router.service';

@Component({
  selector: 'app-custom-field-contacts-list',
  templateUrl: './custom-field-contacts-list.component.html',
  styleUrls: ['./custom-field-contacts-list.component.scss']
})
export class CustomFieldContactsListComponent implements OnInit {
  @Input('customField') customField: any;

  selectedField = {
    id: '',
    name: '',
    placeholder: '',
    options: [],
    type: '',
    status: false
  };

  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 25, label: '25' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[2];
  page = 1;
  searchStr: string = '';
  isSearchByCustom: boolean = false;
  showStartDate = false;
  showEndDate = false;
  dateRange: DateRange;
  dateFilterValue: { startDate?: NgbDateStruct; endDate?: NgbDateStruct } = {
    startDate: null,
    endDate: null
  };

  sortType: any;
  selectedDropdown = {
    label: 'Select ALL',
    value: 'all'
  };
  initDropdownValue = {
    label: 'Select ALL',
    value: 'all'
  };

  NORMAL_COLUMNS = ['contact_name', 'custom_field'];
  SORTED_COLUMNS = ['contact_name', 'contact_label', 'contact_email'];
  DISPLAY_COLUMNS = this.NORMAL_COLUMNS;
  FieldTypeEnum = FieldTypeEnum;

  contacts: ContactActivity[] = [];
  length: number = 0;

  isLoading: boolean = false;

  userId: string = '';
  constructor(
    private storeService: StoreService,
    private contactService: ContactService,
    private routerService: RouterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContacts();

    this.storeService.pageContacts$.subscribe((res) => {
      this.contacts = res;
    });

    this.contactService.total$.subscribe((res) => {
      this.length = res;
    });

    this.contactService.loading$.subscribe((res) => {
      this.isLoading = res === STATUS.REQUEST;
    });
  }

  ngOnChanges(changes): void {
    if (changes.customField) {
      this.customField = changes.customField.currentValue;
      if (this.customField.type === 'dropdown') {
        this.selectedField.options = [this.initDropdownValue].concat(
          this.customField.options
        );
        if (this.customField.options.length > 0) {
          this.sortType = this.customField.options[0];
        }
      } else if (this.customField.type === 'date') {
        this.dateRange = {
          startDate: null,
          endDate: null
        };
        this.dateFilterValue = {
          startDate: null,
          endDate: null
        };
        this.showStartDate = false;
        this.showEndDate = false;
      }
      this.loadContacts();
    }
  }

  ngAfterViewInit(): void {
    if (this.routerService.previousUrl) {
      const urlArr = this.routerService.previousUrl.split('/');
      if (urlArr[1] == 'contacts') {
        const page = this.storeService.contactPage.getValue();
        this.changePage(page);
      }
    }
  }

  loadContacts(): void {
    this.contacts = [];
    this.selectedField = { ...this.customField };
    if (this.customField.type === 'date') {
      this.isSearchByCustom = true;
      this.contactService.customFieldSearch(
        this.page,
        this.customField.name,
        this.searchStr,
        '',
        this.dateRange
      );
    } else if (this.customField.type === 'dropdown') {
      this.isSearchByCustom = true;
      this.contactService.customFieldSearch(
        this.page,
        this.customField.name,
        this.searchStr,
        this.selectedDropdown.value
      );
    } else {
      this.isSearchByCustom = true;
      this.contactService.customFieldSearch(
        this.page,
        this.customField.name,
        this.searchStr
      );
    }
  }

  toggleDateFilter(checked: boolean, target: string): void {
    if (target === 'start') {
      this.showStartDate = checked;
    } else if (target === 'end') {
      this.showEndDate = checked;
    }
  }

  onChangeDateValue(): void {
    this.dateRange = {
      startDate: null,
      endDate: null
    };
    if (this.dateFilterValue.startDate) {
      const value = this.dateFilterValue.startDate;
      this.dateRange.startDate = new Date(
        value.year,
        value.month - 1,
        value.day
      );
    }
    if (this.dateFilterValue.endDate) {
      const value = this.dateFilterValue.endDate;
      this.dateRange.endDate = new Date(value.year, value.month - 1, value.day);
    }
    this.page = 1;
    this.loadContacts();
  }

  changeOption(option: any): void {
    this.sortType = option;
    this.selectedDropdown = option;
    this.page = 1;
    this.loadContacts();
  }

  /**
   * Load the contacts: Advanced Search, Normal Search, API Call
   */
  load(): void {
    this.page = 1;
  }
  /**
   * Load the page contacts
   * @param page : Page Number to load
   */
  changePage(page: number): void {
    this.page = page;
    this.storeService.contactPage.next(page);
    this.loadContacts();
  }
  /**
   * Change the Page Size
   * @param type : Page size information element ({id: size of page, label: label to show UI})
   */
  changePageSize(type: any): void {
    const currentSize = this.pageSize.id;
    this.pageSize = type;
    this.contactService.pageSize.next(this.pageSize.id);
    // Check with the Prev Page Size
    if (currentSize < this.pageSize.id) {
      // If page size get bigger
      const loaded = this.page * currentSize;
      let newPage = Math.floor(loaded / this.pageSize.id);
      newPage = newPage > 0 ? newPage : 1;
      this.changePage(newPage);
    } else {
      this.changePage(this.page);
    }
  }

  /**
   * Change the search str
   */
  changeSearchStr(): void {
    this.loadContacts();
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.loadContacts();
  }

  openContact(contact: ContactActivity): void {
    this.router.navigate([`contacts/${contact._id}`]);
  }

  getFormattedDateValue(value: string): string {
    const date = new Date(value);
    return formatDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
  }
}
