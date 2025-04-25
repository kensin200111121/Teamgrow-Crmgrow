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
import { Subject, ReplaySubject } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  map,
  distinctUntilChanged
} from 'rxjs/operators';
import { FilterService } from '@services/filter.service';
import * as _ from 'lodash';
import { searchReg } from '@app/helper';

@Component({
  selector: 'app-filter-input',
  templateUrl: './filter-input.component.html',
  styleUrls: ['./filter-input.component.scss']
})
export class FilterInputComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Select Filter';
  @Input('formPlaceholder') formPlaceholder = 'Search filter options';
  @Input()
  public set filter(val: string) {
    if (!val) {
      this.formControl.setValue(null, { emitEvent: false });
    }
  }
  @Output() onSelect = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  search = '';
  searching = false;
  filteredResults: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

  constructor(public filterService: FilterService) {
    this.filterService.loadAll();
    this.filterService.filters$.subscribe((filters) => {
      this.filteredResults.next(filters);
    });
  }

  ngOnInit(): void {
    this.inputControl.valueChanges
      .pipe(
        filter((search) => true),
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        map((search) => {
          this.search = search;
          return this.filterService.filters$;
        })
      )
      .subscribe(
        (data) => {
          data.subscribe((filters) => {
            if (this.search) {
              const res = _.filter(filters, (e) => {
                return searchReg(e.title, this.search);
              });
              this.filteredResults.next(res);
            } else {
              this.filteredResults.next(filters);
            }
            this.searching = false;
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
  }
}
