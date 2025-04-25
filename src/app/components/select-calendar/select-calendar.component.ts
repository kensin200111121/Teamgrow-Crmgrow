import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AppointmentService } from '@services/appointment.service';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-select-calendar',
  templateUrl: './select-calendar.component.html',
  styleUrls: ['./select-calendar.component.scss']
})
export class SelectCalendarComponent implements OnInit, OnDestroy {
  @Input() calendar;
  @Output() calendarChange: EventEmitter<any> = new EventEmitter();
  @ViewChild(NgbDropdown) ngbDropdown: NgbDropdown;
  accounts: any[] = [];
  loadSubscription: Subscription;

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.appointmentService.loadCalendars(true, true);
    this.loadSubscription = this.appointmentService.calendars$.subscribe(
      (data) => {
        this.accounts = [];
        data.forEach((account) => {
          const acc = { email: account.email };
          if (account.data) {
            const calendars = [];
            account.data.forEach((e) => {
              const calendar = { ...e, account: account.email };
              calendars.push(calendar);
            });
            acc['calendars'] = calendars;
            this.accounts.push(acc);
          }
        });
      }
    );
  }

  closePopups(): void {
    if (this.ngbDropdown.isOpen()) {
      this.ngbDropdown.close();
    }
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }

  selectCalendar(calendar): void {
    this.calendar = calendar;
    this.calendarChange.emit(this.calendar);
  }
}
