import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { environment } from '@environments/environment';
import { SearchOption } from '@models/searchOption.model';
import { NotifyComponent } from '../notify/notify.component';
import { MatDialog } from '@angular/material/dialog';
import {
  CONTACT_LIST_TYPE,
  DialogSettings
} from '@constants/variable.constants';
import { FilterAddComponent } from '../filter-add/filter-add.component';
import { FilterService } from '@app/services/filter.service';
import { ConfirmComponent } from '../confirm/confirm.component';
import { Subject, Subscription, takeUntil } from 'rxjs';
import * as _ from 'lodash';
import { ContactService } from '@app/services/contact.service';
import { UserService } from '@services/user.service';
import { SspaService } from '@app/services/sspa.service';

@Component({
  selector: 'app-filter-options-list',
  templateUrl: './filter-options-list.component.html',
  styleUrls: ['./filter-options-list.component.scss']
})
export class FilterOptionsListComponent implements OnInit {
  readonly isSspa = environment.isSspa;

  @Input() searchOption: SearchOption = new SearchOption();
  @Input() userId = '';
  @Input() currentFilterId = 'own';
  @Input() viewMode = '';
  @Output() changeCurrentFilter = new EventEmitter();

  savedFilters = [];
  originContactListType = CONTACT_LIST_TYPE.filter(
    (type) => type._id === 'own'
  );

  private destroy$ = new Subject();
  private removeSubscription: Subscription;
  private filterSubscription: Subscription;
  private profileSubscription: Subscription;
  pendingContactsCount = 0;

  constructor(
    private dialog: MatDialog,
    public filterService: FilterService,
    public contactService: ContactService,
    public sspaService: SspaService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const additionalTypes = [];
    const order = ['own', 'team', 'assigned', 'prospect', 'private', 'pending'];

    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      if (user._id) {
        const teamAccount = user.organization;

        if (teamAccount) {
          additionalTypes.push(
            ...CONTACT_LIST_TYPE.filter(
              (type) => type._id === 'team' || type._id === 'assigned'
            )
          );
        }

        if (this.isSspa) {
          additionalTypes.push(
            ...CONTACT_LIST_TYPE.filter((type) => type._id === 'prospect')
          );
        } else if (teamAccount) {
          additionalTypes.push(
            ...CONTACT_LIST_TYPE.filter((type) => type._id === 'private')
          );
        }
        this.contactService
          .getPendingContactsCount()
          .pipe(takeUntil(this.destroy$))
          .subscribe((count) => {
            this.pendingContactsCount = count.total;
            if (!this.isSspa && count.total > 0) {
              additionalTypes.push(
                ...CONTACT_LIST_TYPE.filter((type) => type._id === 'pending')
              );
            }
            additionalTypes.sort((a, b) => {
              return order.indexOf(a._id) - order.indexOf(b._id);
            });
            const filtedAdditionalTypes = additionalTypes.filter(
              (type) =>
                !this.originContactListType.some(
                  (origin) => origin._id === type._id
                )
            );

            this.originContactListType = [
              ...this.originContactListType,
              ...filtedAdditionalTypes
            ];
          });
      }
    });

    this.getSavedFilters();

    this.filterSubscription && this.filterSubscription.unsubscribe();
    this.filterSubscription = this.filterService.filters$.subscribe(
      (filters) => {
        this.savedFilters = [];
        filters.forEach((e) => {
          const savedFilter = {
            _id: e._id,
            title: e.title,
            description: e?.description ?? '',
            content: e.content,
            user: e.user
          };
          this.savedFilters.push(savedFilter);
        });
      }
    );
  }

  ngOnDestroy() {
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  applyFilter(event: Event, filter: any) {
    event?.preventDefault();
    event?.stopPropagation();
    this.changeCurrentFilter.emit(filter);
  }

  saveFilter(event: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialog
      .open(FilterAddComponent, {
        position: { top: '100px' },
        width: '90%',
        maxWidth: '480px',
        data: {
          searchOption: this.searchOption,
          saveOption: 'save_as'
        }
      })
      .afterClosed()
      .subscribe((res) => {
        res && this.getSavedFilters();
      });
  }

  removeSavedFilter(event: Event, filter: any): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (filter && filter._id) {
      this.dialog
        .open(ConfirmComponent, {
          width: '90%',
          maxWidth: '400px',
          data: {
            title: 'Delete filter',
            message: 'Are you sure to delete the filter?',
            cancelLabel: 'No',
            confirmLabel: 'Delete',
            mode: 'warning'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.removeSubscription && this.removeSubscription.unsubscribe();
            this.removeSubscription = this.filterService
              .remove(filter._id)
              .subscribe((status) => {
                if (status) {
                  // Remove from Service Subject
                  this.filterService.remove$(filter._id);
                  this.savedFilters = this.savedFilters.filter(
                    (e) => e._id !== filter._id
                  );
                }
              });
          }
        });
    }
  }

  private getSavedFilters(): void {
    this.filterService.loadAll();
  }
}
