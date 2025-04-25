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
  ChangeDetectorRef
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Subject, Subscription, take, takeUntil } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import * as _ from 'lodash';
import { StoreService } from '@services/store.service';
import { AutomationService } from '@services/automation.service';
import { AutomationType } from '@core/enums/resources.enum';
import {
  AutomationItem,
  FilterParam,
  ResourceListItem
} from '@core/interfaces/resources.interface';

@Component({
  selector: 'app-input-automation',
  templateUrl: './input-automation.component.html',
  styleUrls: ['./input-automation.component.scss']
})
export class InputAutomationComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Search automation';
  @Input('formPlaceholder') formPlaceholder = 'Search automations';
  @Input()
  public set emptyInput(val: boolean) {
    if (val) {
      this.formControl.setValue(null, { emitEvent: false });
    }
  }
  @Input() nullable = false;
  _automation: string;

  @Input() set automation(val) {
    if (!val) {
      this._automation = val;
      this.removeDefaultValue();
    } else if (this._automation !== val) {
      this._automation = val;
      this.changeDefaultValue();
    }
  }

  @Input() excepted: AutomationItem[];
  @Output() automationChange = new EventEmitter<AutomationItem>();
  @Input() type = 'contact';
  @Input() excludeId = '';
  @Input() hasSharedAutomations = false;

  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  search = '';
  searching = false;
  isLoading = false;

  currentFolder = null;
  rootFolder = null;
  allList = [];
  filteredResults = [];
  hidedResults = [];
  automationSubscription: Subscription;

  private readonly _inputControlSubscription = new Subscription();
  private readonly _formControlSubscription = new Subscription();
  private readonly _serviceSubscription = new Subscription();

  constructor(
    private service: AutomationService,
    public storeService: StoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    if (this._inputControlSubscription) {
      this._inputControlSubscription.unsubscribe();
    }
    if (this._formControlSubscription) {
      this._formControlSubscription.unsubscribe();
    }
    if (this._serviceSubscription) {
      this._serviceSubscription.unsubscribe();
    }

    this.inputControl.valueChanges.subscribe(() => {
      this.search = this.inputControl.value;
      if (this.search) {
        this.hidedResults = _.filter(this.allList, (e) => {
          return e.title?.toLowerCase().includes(this.search.toLowerCase());
        });
        this.sort();
        this.cdr.detectChanges();
      } else {
        this.load();
      }
    });

    this.formControl.valueChanges.subscribe((val) => {
      if (!val) {
        this.automationChange.emit(null);
      } else if (val._id !== this._automation) {
        this.automationChange.emit(val);
      }
    });
    this.service.loadOwn(true, this.hasSharedAutomations);
    const otherType = this.type === 'contact' ? 'deal' : 'contact';
    this.service.automations$.subscribe((res) => {
      this.allList = _.filter(res, (e) => {
        return (
          (e.item_type === 'folder' ||
            this.type == 'any' ||
            (this.type != 'any' && e.type != otherType)) &&
          e._id != this.excludeId
        );
      });
      this.rootFolder = _.find(res, (e) => {
        return e.item_type === 'folder' && e.rootFolder === true;
      });
      if (this._automation) {
        this.preLoad();
      } else {
        this.load();
      }
    });
  }

  load(): void {
    let rootFolder;
    if (this.currentFolder) {
      rootFolder = this.currentFolder;
    } else {
      rootFolder = this.rootFolder;
    }
    const Results = _.filter(this.allList, (e) => {
      return (
        rootFolder?.folders.includes(e._id) ||
        rootFolder?.automations.includes(e._id) ||
        e.shared
      );
    });
    this.hidedResults = _.filter(Results, (e) => {
      return e.title?.toLowerCase().includes(this.search.toLowerCase());
    });
    this.sort();
  }

  goToFolder(e: any, folder?: any): void {
    e.stopPropagation();
    this.currentFolder = folder;
    this.load();
  }

  goToParentFolder(): void {
    this.currentFolder = this.getParentFolder(this.currentFolder);
    this.load();
  }

  getCurrentFolder(child: any): any {
    return _.find(this.allList, (e) => {
      if (e.item_type === 'folder') {
        return e.automations.includes(child?._id);
      }
    });
  }

  getParentFolder(child: any): any {
    return _.find(this.allList, (e) => {
      if (e.item_type === 'folder') {
        return e.folders.includes(child?._id);
      }
    });
  }

  preLoad(): void {
    const automation = _.find(this.allList, (e) => {
      return this._automation === e._id;
    });
    const currentFolder = this.getCurrentFolder(automation);
    if (!currentFolder) {
      this.currentFolder = this.rootFolder;
    } else {
      this.currentFolder = currentFolder;
    }
    this.hidedResults = _.filter(this.allList, (e) => {
      return (
        this.currentFolder?.folders.includes(e._id) ||
        this.currentFolder?.automations.includes(e._id)
      );
    });
    this.sort();
    this.formControl.setValue(automation);
  }

  changeDefaultValue() {
    const automation = _.find(this.allList, (e) => {
      return this._automation === e._id;
    });
    this.formControl.setValue(automation);
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

  sort(): void {
    const folders = this.hidedResults.filter((e) => e.item_type === 'folder');
    const autos = this.hidedResults.filter((e) => e.item_type !== 'folder');
    folders.sort((a, b) => (a.title > b.title ? 1 : -1));
    autos.sort((a, b) => (a.title > b.title ? 1 : -1));
    this.filteredResults = [...folders, ...autos];
  }

  remove(): void {
    this.formControl.setValue(null, { emitEvent: false });
    this.automationChange.emit(null);
  }

  removeDefaultValue(): void {
    this.formControl.setValue(null, { emitEvent: false });
  }

  getLabel(automation): any {
    if (automation.label === 'deal') {
      return 'Pipeline Deal';
    } else if (automation.label === 'deal stage') {
      return 'Pipeline Stage';
    }
    return automation.label;
  }
  hideOption(id): boolean {
    return this.filteredResults.filter((it) => it._id === id).length == 0;
  }

  closePopups() {
    if (this.selector) {
      this.selector.close();
    }
  }
}
