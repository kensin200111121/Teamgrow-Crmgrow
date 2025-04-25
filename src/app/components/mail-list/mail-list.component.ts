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
import { Subject, ReplaySubject, Subscription } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import {
  filter,
  tap,
  takeUntil,
  debounceTime,
  map,
  distinctUntilChanged
} from 'rxjs/operators';
import { MailList } from '@models/maillist.model';
import { MailListService } from '@services/maillist.service';
import * as _ from 'lodash';
import { searchReg } from '@app/helper';

@Component({
  selector: 'app-mail-list',
  templateUrl: './mail-list.component.html',
  styleUrls: ['./mail-list.component.scss']
})
export class MailListComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input('resultItem') resultItemTemplate: TemplateRef<HTMLElement>;
  @Input('placeholder') placeholder = 'Search mail list';
  @Input('formPlaceholder') formPlaceholder = 'Search mail list';
  @Output() onSelect = new EventEmitter();

  @Input() id: string = '';
  @Output() idChange = new EventEmitter<string>();
  @Input() maillist: MailList;
  @Output() maillistChange = new EventEmitter<MailList>();

  formControl: UntypedFormControl = new UntypedFormControl();
  inputControl: UntypedFormControl = new UntypedFormControl();
  @ViewChild('inputField') inputField: ElementRef;
  @ViewChild('selector') selector: MatSelect;

  protected _onDestroy = new Subject<void>();
  searching = false;
  search = '';
  filteredResults: ReplaySubject<MailList[]> = new ReplaySubject<MailList[]>(1);

  apiSubscription: Subscription;

  constructor(private mailListService: MailListService) {}

  ngOnInit(): void {
    this.mailListService.loadAll();
    this.inputControl.valueChanges
      .pipe(
        filter((search) => !!search),
        takeUntil(this._onDestroy),
        debounceTime(50),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        map((search) => {
          this.search = search;
          return this.mailListService.mailLists$;
        })
      )
      .subscribe(
        (api) => {
          this.apiSubscription && this.apiSubscription.unsubscribe();
          this.apiSubscription = api.subscribe((mailLists) => {
            const res = _.filter(mailLists, (e) => {
              if (searchReg(e.title, this.search)) {
                return true;
              }
            });
            this.searching = false;
            this.filteredResults.next(res);
          });
        },
        () => {
          this.searching = false;
        }
      );
    this.formControl.valueChanges.subscribe((val) => {
      if (val && val._id !== this.id) {
        this.maillistChange.emit(val);
        this.idChange.emit(val._id);
      }
    });

    // Init the Form Control with Two-bind Modal
    if (this.maillist) {
      this.formControl.setValue(this.maillist);
    }
    this.mailListService.mailLists$.subscribe((mailLists) => {
      this.filteredResults.next(mailLists);
      if (this.id) {
        const mailList = _.find(mailLists, (e) => {
          return this.id === e._id;
        });
        mailList && this.formControl.setValue(mailList);
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

  ngOnDestroy(): void {}
}
