import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  AfterViewInit,
  TemplateRef
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ContactService } from '@services/contact.service';
import { Subject, ReplaySubject, Subscription } from 'rxjs';
import { Contact } from '@models/contact.model';
import { MatSelect } from '@angular/material/select';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  map,
  distinctUntilChanged
} from 'rxjs/operators';
import { validateEmail } from '@utils/functions';
import * as _ from 'lodash';
import { Deal } from '@models/deal.model';
import { DealsService } from '@services/deals.service';
import { DealStage } from '@models/deal-stage.model';
@Component({
  selector: 'app-select-deal',
  templateUrl: './select-deal.component.html',
  styleUrls: ['./select-deal.component.scss']
})
export class SelectDealComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Search deal';
  @Input('formPlaceholder') formPlaceholder = 'Search deals';
  @Input('mustField') mustField = '';
  @Input('fromSearch') fromSearch = true;
  @Input('deals') deals: Deal[] = [];
  @Output() onSelect = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  searching = false;
  keyword = '';
  filteredResults: ReplaySubject<Deal[]> = new ReplaySubject<Deal[]>(1);

  searchSubscription: Subscription;
  getCurrentSubscription: Subscription;

  constructor(private dealsService: DealsService) {}

  ngOnInit(): void {
    this.inputControl.valueChanges
      .pipe(
        filter((search) => !!search),
        takeUntil(this._onDestroy),
        debounceTime(500),
        distinctUntilChanged(),
        tap((search) => {
          this.searching = true;
          this.keyword = search;
        }),
        map((search) => {
          return this.dealsService.searchDeals({ searchStr: search });
        })
      )
      .subscribe(
        (api) => {
          this.searchSubscription && this.searchSubscription.unsubscribe();
          this.searchSubscription = api.subscribe((deals) => {
            this.searching = false;
            this.filteredResults.next(deals);
          });
        },
        () => {
          this.searching = false;
        }
      );
    this.formControl.valueChanges.subscribe((val) => {
      this.onSelect.emit(val);
    });
  }

  ngAfterViewInit(): void {
    this.selector._positions = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
      }
    ];
  }

  ngOnDestroy(): void {}

  cancelSelect(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.onSelect.emit(null);
  }

  clear(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.filteredResults.next([]);
  }

  getStageTitle(deal): any {
    if (deal) {
      return deal.pipe_line?.['title'] + ' / ' + deal.deal_stage?.['title'];
    }
    return '';
  }
}
