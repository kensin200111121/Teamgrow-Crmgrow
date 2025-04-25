import { Injectable } from '@angular/core';
import { ContactListBaseService } from './contact-list-base.service';
import { ErrorService } from '../error.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class MovePendingContactsService extends ContactListBaseService {
  protected endpoint = 'contact/move-pending/';
  protected KEY_PAGE = 'contact.move_pending.page';
  protected KEY_PAGE_SIZE = 'contact.move_pending.page_size';

  constructor(errorService: ErrorService, httpClient: HttpClient) {
    super(errorService, httpClient);
    const page = localStorage.getCrmItem(this.KEY_PAGE);
    const pageSize = localStorage.getCrmItem(this.KEY_PAGE_SIZE);
    if (page) {
      this.contactPage.next(parseInt(page));
    }
    if (pageSize) {
      this.pageSize.next(parseInt(pageSize));
    }

    this.contactPage$.subscribe((value) => {
      localStorage.setCrmItem(this.KEY_PAGE, value + '');
    });
    this.pageSize$.subscribe((value) => {
      localStorage.setCrmItem(this.KEY_PAGE_SIZE, value + '');
    });
  }
}
