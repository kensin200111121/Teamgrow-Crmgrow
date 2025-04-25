import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  NgbDateStruct,
  NgbCalendar,
  NgbTimeStruct,
  NgbDatepicker
} from '@ng-bootstrap/ng-bootstrap';
import {
  Component,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { numPad } from '@app/helper';
// import { MONTH, YEAR } from '@constants/variable.constants';

@Component({
  selector: 'app-date-custom-input',
  templateUrl: './date-custom-input.component.html',
  styleUrls: ['./date-custom-input.component.scss']
})
export class DateCustomInputComponent implements OnInit {
  @Input() placeholder = 'Select Date';
  @Input() required = true;
  @Input() clearable = false;
  @Input()
  public set value(val: Date) {
    if (val) {
      this.dateObj = {
        year: val.getFullYear(),
        month: val.getMonth() + 1,
        day: val.getDate()
      };
      this.dateString =
        this.dateObj.month + '-' + this.dateObj.day + '-' + this.dateObj.year;
      if (this.hasTime) {
        this.timeObj.hour = parseInt(val['hour']);
        this.timeObj.minute = parseInt(val['minute']);
        this.timeObj.second = 0;
        this.dateString =
          this.dateObj.year +
          '-' +
          this.dateObj.month +
          '-' +
          this.dateObj.day +
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
  @Output() setValue = new EventEmitter();
  @Input() minDate = null;
  @Input() type = '';
  @Input() uiType = 'mode1';
  @Input() title = '';
  @Input() hasTime = false;
  @Input() dayStatus = [];
  @Input('markToday') markToday = false;
  selectedDate = '';
  dateInput: UntypedFormControl = new UntypedFormControl();
  @ViewChild('trigger') triggerElement: CdkOverlayOrigin;
  @ViewChild('dp') dp: NgbDatepicker;
  updateTimer;
  dateObj: NgbDateStruct;
  timeObj: NgbTimeStruct = {
    hour: 9,
    minute: 0,
    second: 0
  };
  dateString;
  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.setEventStatus();
  }

  setEventStatus(): void {
    const elements = document.getElementsByClassName('ngb-dp-day');
    Array.from(elements).forEach((element) => {
      const curDate = new Date(element.getAttribute('aria-label'));
      const index = this.dayStatus.findIndex((item) => {
        return item.curDate.setHours(0, 0, 0, 0) === curDate.getTime();
      });
      const curElement = element.querySelector('.btn-light');
      if (index >= 0) {
        curElement.classList.add('red-status');
      } else {
        if (curElement.classList.contains('red-status')) {
          curElement.classList.remove('red-status');
        }
      }
    });
  }
  onChange($event): void {
    this.setEventStatus();
  }
  onDateSelect($event): void {
    this.setEventStatus();
    this.updateTimer = setInterval(() => {
      this.setEventStatus();
      clearInterval(this.updateTimer);
    }, 1000);
    if (this.dateObj) {
      this.dateString =
        this.dateObj.year + '-' + this.dateObj.month + '-' + this.dateObj.day;
    } else {
      this.dateString = '';
    }
    this.valueChange.emit(this.dateObj);
  }
  setDate(): void {
    if (this.dateObj) {
      this.dateString =
        this.dateObj.year + '-' + this.dateObj.month + '-' + this.dateObj.day;
    } else {
      this.dateString = '';
    }
    this.setValue.emit(this.dateObj);
  }
  clearDate(): void {
    this.dateString = '';
    this.dateObj = null;
    this.valueChange.emit(null);
  }
}
