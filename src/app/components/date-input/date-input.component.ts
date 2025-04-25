import { CdkOverlayOrigin, Overlay, OverlayRef } from '@angular/cdk/overlay';
import {
  NgbDateStruct,
  NgbTimeStruct,
  NgbDatepicker
} from '@ng-bootstrap/ng-bootstrap';
import {
  Component,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  Inject
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { numPad, validateDate } from '@app/helper';
import { DateFormatEnum } from '@utils/enum';
import { formatDate } from '@utils/functions';
import { Subscription, fromEvent } from 'rxjs';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss']
})
export class DateInputComponent implements OnInit {
  @Input() placeholder = 'Select Date';
  @Input() format = DateFormatEnum.MMDDYYYY;
  @Input() outFormat = '';
  @Input() required = true;
  @Input() clearable = false;
  @Input()
  public set value(val: any) {
    if (val) {
      if (val instanceof Date) {
        const _val = val;
        this.dateObj = {
          day: _val.getDate(),
          month: _val.getMonth() + 1,
          year: _val.getFullYear()
        };
      } else if (typeof val === 'string') {
        this.dateObj = {
          day: new Date(val).getDate(),
          month: new Date(val).getMonth() + 1,
          year: new Date(val).getFullYear()
        };
      } else {
        this.dateObj = {
          day: parseInt(val['day']),
          month: parseInt(val['month']),
          year: parseInt(val['year'])
        };
      }
      if (this.dateObj) {
        this.dateString = formatDate(
          this.dateObj.day,
          this.dateObj.month,
          this.dateObj.year,
          this.format
        );
      }
      if (this.hasTime) {
        this.timeObj.hour = parseInt(val['hour']);
        this.timeObj.minute = parseInt(val['minute']);
        this.timeObj.second = 0;
        const formattedDate = formatDate(
          this.dateObj.day,
          this.dateObj.month,
          this.dateObj.year,
          this.format
        );
        this.dateString =
          formattedDate +
          ' ' +
          (this.timeObj.hour <= 12
            ? numPad(this.timeObj.hour)
            : numPad(this.timeObj.hour % 12)) +
          ':' +
          numPad(this.timeObj.minute) +
          ' ' +
          (this.timeObj.hour < 12 ? 'AM' : 'PM');
      }
    } else {
      this.dateObj = null;
      this.dateString = '';
    }
  }
  @Output() valueChange = new EventEmitter();
  _minDate = { year: 1970, month: 1, day: 1 };
  _maxDate = { year: 2050, month: 12, day: 31 };
  @Input() set minDate(value: any) {
    if (value) {
      this._minDate = value;
    }
  }
  @Input() set maxDate(value: any) {
    if (value) {
      this._maxDate = value;
    }
  }
  @Input() type = '';
  @Input() uiType = 'default';
  @Input() title = '';
  @Input() hasTime = false;
  @Input('markToday') markToday = false;
  isOpen = false;
  private _overlayRef: OverlayRef;
  dateInput: UntypedFormControl = new UntypedFormControl();
  @ViewChild('trigger') triggerElement: CdkOverlayOrigin;
  @ViewChild('dp') dp: NgbDatepicker;

  dateObj: NgbDateStruct;
  timeObj: NgbTimeStruct = {
    hour: 9,
    minute: 0,
    second: 0
  };
  dateString;
  scrollSubscription: Subscription;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit(): void {
    this.format = this.format || DateFormatEnum.MMDDYYYY;
    this.scrollSubscription = fromEvent(
      this.document.querySelector('app-root'),
      'scroll'
    ).subscribe(() => {
      this.close();
    });
    if (this.document.querySelector('#calender_content')) {
      fromEvent(
        this.document.querySelector('#calender_content'),
        'scroll'
      ).subscribe(() => {
        this.close();
      });
    }
  }

  close(): void {
    this.isOpen = false;
  }

  closeOverlay(event: MouseEvent): void {
    const target = <HTMLInputElement>event.target;
    const triggerEl = <HTMLInputElement>(
      this.triggerElement.elementRef.nativeElement
    );
    if (target === triggerEl) {
      return;
    }
    this.isOpen = false;
    return;
  }

  openOverlay(): void {
    this.isOpen = !this.isOpen;
    const triggerEl = <HTMLInputElement>(
      this.triggerElement.elementRef.nativeElement
    );
    triggerEl.blur();
    setTimeout(() => {
      this.dp.focusDate(this.dateObj);
    }, 200);
  }

  changeDate(): void {
    if (this.dateObj) {
      this.dateString = formatDate(
        this.dateObj.day,
        this.dateObj.month,
        this.dateObj.year,
        this.format
      );
    } else {
      this.dateString = '';
    }
    if (this.outFormat === 'date') {
      this.valueChange.emit(
        new Date(
          this.dateObj.year + '-' + this.dateObj.month + '-' + this.dateObj.day
        )
      );
    } else {
      this.valueChange.emit(this.dateObj);
    }
    this.isOpen = false;
  }

  changeDateTime(close = true): void {
    if (this.dateObj) {
      if (!this.hasTime) {
        this.dateString = formatDate(
          this.dateObj.day,
          this.dateObj.month,
          this.dateObj.year,
          this.format
        );
      } else {
        const formattedDate = formatDate(
          this.dateObj.day,
          this.dateObj.month,
          this.dateObj.year,
          this.format
        );
        this.dateString =
          formattedDate +
          ' ' +
          (this.timeObj.hour <= 12
            ? numPad(this.timeObj.hour)
            : numPad(this.timeObj.hour % 12)) +
          ':' +
          numPad(this.timeObj.minute) +
          ' ' +
          (this.timeObj.hour < 12 ? 'AM' : 'PM');
      }
    } else {
      this.dateString = '';
    }
    if (this.outFormat === 'date') {
      this.valueChange.emit(
        new Date(
          this.dateObj.year +
            '-' +
            this.dateObj.month +
            '-' +
            this.dateObj.day +
            ' ' +
            this.timeObj.hour +
            ':' +
            this.timeObj.minute +
            ':' +
            this.timeObj.second
        )
      );
    } else {
      this.valueChange.emit({ ...this.dateObj, ...this.timeObj });
    }

    if (close) {
      this.isOpen = false;
    }
  }

  dateFormat(): string {
    if (this.dateObj) {
      if (!this.hasTime) {
        return (
          this.MONTHS[this.dateObj.month - 1] +
          ' ' +
          this.dateObj.day +
          ' ' +
          this.dateObj.year
        );
      } else {
        return (
          this.MONTHS[this.dateObj.month - 1] +
          ' ' +
          this.dateObj.day +
          ' ' +
          this.dateObj.year +
          ' ' +
          (this.timeObj.hour <= 12
            ? numPad(this.timeObj.hour)
            : numPad(this.timeObj.hour % 12)) +
          ':' +
          numPad(this.timeObj.minute) +
          ' ' +
          (this.timeObj.hour < 12 ? 'AM' : 'PM')
        );
      }
    } else {
      return 'Select date';
    }
  }

  clearDate(): void {
    this.dateString = '';
    this.dateObj = null;
    this.valueChange.emit(null);
  }

  MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
}
