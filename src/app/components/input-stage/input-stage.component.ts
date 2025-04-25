import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MatAutocompleteSelectedEvent,
  MatAutocompleteActivatedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { UntypedFormControl } from '@angular/forms';
import {
  filter,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  map
} from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';
import * as _ from 'lodash';
import { DealsService } from '@services/deals.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { searchReg } from '@app/helper';
import { DealStage } from '@models/deal-stage.model';
import { PipelineWithStages } from '@models/pipeline.model';

interface Stage {
  _id: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-input-stage',
  templateUrl: './input-stage.component.html',
  styleUrls: ['./input-stage.component.scss']
})
export class InputStageComponent implements OnInit, OnChanges {
  protected _onDestroy = new Subject<void>();
  readonly separatorKeyCodes: number[] = [ENTER, COMMA];
  private _keyword = '';
  private _optionsFocused = false;
  private _initialized = false;
  STAGE_DICTIONARY: Record<string, DealStage> = {};

  pipelines: PipelineWithStages[] = []; // All Pipelines
  selectedPipeline: PipelineWithStages; // selected pipeline (includes the stages as well)

  @Input('placeholder') placeholder = 'Add Stages';
  @Input('selectedStages') selectedStages: string[] = [];
  @Output() onSelect = new EventEmitter();

  formControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild(MatAutocompleteTrigger) inputField: MatAutocompleteTrigger;
  @ViewChild('inputField') inputFieldRef: ElementRef;
  filteredResults: ReplaySubject<Stage[]> = new ReplaySubject<Stage[]>(1);

  constructor(public dealsService: DealsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedStages'] && !this._initialized) {
      this._initPipelines();
    }
  }

  private _initPipelines() {
    this._initialized = true;
    this.dealsService.pipelineStages$.subscribe((_pipelines) => {
      if (!_pipelines?.length) {
        return;
      }
      this.pipelines = _pipelines;
      this.STAGE_DICTIONARY = {};

      let selectedStageId;
      if (this.selectedStages[0]) {
        selectedStageId = this.selectedStages[0];
      }

      _pipelines.forEach((_pipeline) => {
        (_pipeline.stages || []).forEach((e) => {
          this.STAGE_DICTIONARY[e._id] = e;
          if (selectedStageId === e._id) {
            this.selectedPipeline = _pipeline;
          }
        });
      });

      if (!this.selectedPipeline) {
        this.selectedPipeline = _pipelines[0];
      }
      this.filteredResults.next(this.selectedPipeline.stages);
    });
  }

  ngOnInit(): void {
    this.formControl.valueChanges
      .pipe(
        filter(() => true),
        takeUntil(this._onDestroy),
        debounceTime(200),
        distinctUntilChanged(),
        map((search) => {
          this._keyword = search;
          return this.selectedPipeline.stages;
        })
      )
      .subscribe((stages) => {
        const selectedStages = [];
        this.selectedStages.forEach((e) => {
          selectedStages.push({ _id: e });
        });
        const remained = _.difference(stages, this.selectedStages);
        const res = _.filter(remained, (e) => {
          if (e._id != -1) {
            return searchReg(e.title, this._keyword);
          }
        });
        this.filteredResults.next(res || []);
      });
  }

  remove(stage: string): void {
    _.remove(this.selectedStages, (e) => {
      return e === stage;
    });
    this.onSelect.emit();
  }

  /**
   * Select the option from the autocomplete list
   * @param evt : MatAutoCompleteSelectedEvent
   */
  onSelectOption(evt: MatAutocompleteSelectedEvent): void {
    const stage: Stage = evt.option.value;
    const index = _.findIndex(this.selectedStages, function (e) {
      return e === stage._id;
    });
    if (index === -1) {
      this.selectedStages.push(stage._id);
    }
    this._optionsFocused = false;
    this._keyword = '';
    this.inputFieldRef.nativeElement.value = '';
    this.formControl.setValue(null);
    this.onSelect.emit();
  }

  onActiveOption(event: MatAutocompleteActivatedEvent): void {
    if (event && event.option) {
      this._optionsFocused = true;
    } else {
      this._optionsFocused = false;
    }
  }
  onAdd(event: MatChipInputEvent): void {
    if (this._optionsFocused || !event.value) {
      return;
    }
    const stage: Stage = { _id: event.value };
    const index = _.findIndex(this.selectedStages, function (e) {
      return e === stage;
    });
    if (index === -1) {
      this.selectedStages.push(stage._id);
    }
    this.inputField.closePanel();
    this.inputFieldRef.nativeElement.value = '';
    this._optionsFocused = false;
    this._keyword = '';
    this.formControl.setValue(null);
    this.onSelect.emit();
  }

  onSelectPipeLine(pipeline): void {
    this.selectedPipeline = pipeline;
    this.filteredResults.next(this.selectedPipeline.stages || []);

    _.remove(this.selectedStages, () => true);
    this.onSelect.emit();
  }
}
