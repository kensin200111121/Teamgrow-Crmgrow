import {
  Component,
  OnInit,
  Input,
  ViewChild,
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
import { EventType } from '@models/eventType.model';
import * as _ from 'lodash';
import { searchReg } from '@app/helper';
import { ScheduleService } from '@services/schedule.service';
import { STATUS } from '@constants/variable.constants';

@Component({
  selector: 'app-input-event-type',
  templateUrl: './input-event-type.component.html',
  styleUrls: ['./input-event-type.component.scss']
})
export class InputEventTypeComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;

  @Input() id: string = '';
  @Input() eventType: EventType;
  @Output() eventTypeChange = new EventEmitter<EventType>();

  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  search = '';
  searching = false;
  filteredResults: ReplaySubject<EventType[]> = new ReplaySubject<EventType[]>(
    1
  );

  constructor(public scheduleService: ScheduleService) {}

  ngOnInit(): void {
    if (
      this.scheduleService.loadStatus.getValue() == STATUS.NONE ||
      this.scheduleService.loadStatus.getValue() == STATUS.FAILURE
    ) {
      this.scheduleService.getEventTypes();
    }
    this.inputControl.valueChanges
      .pipe(
        filter(() => true),
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        map((search) => {
          this.search = search;
          return this.scheduleService.eventTypes$;
        })
      )
      .subscribe(
        (data) => {
          data.subscribe((eventTypes) => {
            if (eventTypes && eventTypes.length > 0) {
              const resultEventTypes = [...eventTypes];

              const res = _.filter(resultEventTypes, (e) => {
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
        this.eventTypeChange.emit(val);
      }
    });

    this.scheduleService.eventTypes$.subscribe((eventTypes) => {
      this.filteredResults.next(eventTypes);
      if (this.id) {
        const filterEventType = _.find(eventTypes, (e) => {
          return this.id === e._id;
        });
        if (filterEventType) {
          this.formControl.setValue(filterEventType);
        }
      }
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

  ngOnChanges(changes): void {
    if (changes.automation) {
      this.formControl.setValue(changes.automation.currentValue);
    }
  }

  ngOnDestroy(): void {}
}
