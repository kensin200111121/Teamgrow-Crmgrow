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
  TemplateRef,
  OnChanges
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
import { Automation } from '@models/automation.model';
import * as _ from 'lodash';
import { searchReg } from '@app/helper';
import { StoreService } from '@services/store.service';
import { DealsService } from '@services/deals.service';
import { DealStage } from '@models/deal-stage.model';

@Component({
  selector: 'app-input-deal-stage',
  templateUrl: './input-deal-stage.component.html',
  styleUrls: ['./input-deal-stage.component.scss']
})
export class InputDealStageComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Search automation';
  @Input('formPlaceholder') formPlaceholder = 'Search automations';

  @Input() id: string = '';
  @Input() dealStage: DealStage;
  @Output() onChange = new EventEmitter<DealStage>();
  

  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  search = '';
  searching = false;
  filteredResults: ReplaySubject<Automation[]> = new ReplaySubject<
    Automation[]
  >(1);

  constructor(
    private dealService: DealsService,
    public storeService: StoreService
  ) {
  }

  ngOnInit(): void {
    this.inputControl.valueChanges
      .pipe(
        filter(() => true),
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        map((search) => {
          this.search = search;
          return this.dealService.stages$;
        })
      )
      .subscribe(
        (data) => {
          data.subscribe((stages) => {
            if (stages && stages.length > 0) {
              const resultStages = [...stages];
              
              const res = _.filter(resultStages, (e) => {
                return searchReg(e.title, this.search);
              });
              this.searching = false;
              this.filteredResults.next(res);
            }
          });
        },
        () => {
          this.searching = false;
        }
      );

    this.formControl.valueChanges.subscribe((val) => {
      if (val && val._id !== this.id) {
        this.onChange.emit(val);
      }
    });

    this.dealService.stages$.subscribe((stages) => {
      const filtered = _.filter(stages, (e) => {
        return e && e._id;
      });

      this.filteredResults.next(filtered);

      if (this.id) {
        const filterStages = _.find(stages, (e) => {
          return this.id === e._id;
        });
        if (filterStages) {
          this.formControl.setValue(filterStages);
          this.onChange.emit(filterStages);
        }
      }
    });

    // Init the Form Control with Two-bind Modal
    if (this.dealStage) {
      this.formControl.setValue(this.dealStage);
    }
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

  ngOnChanges(changes): void {
    if (changes.dealStage) {
      this.formControl.setValue(changes.dealStage.currentValue);
    }
  }

  ngOnDestroy(): void {}

  remove(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.onChange.emit(null);
  }
}
