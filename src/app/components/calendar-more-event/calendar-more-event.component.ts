import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppointmentService } from '@services/appointment.service';
import { OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-calendar-more-event',
  templateUrl: './calendar-more-event.component.html',
  styleUrls: ['./calendar-more-event.component.scss']
})
export class CalendarMoreEventComponent implements OnInit {
  @Input('events') events;
  @Output() onClose: EventEmitter<any> = new EventEmitter(null);
  @Output() onShowDetail: EventEmitter<any> = new EventEmitter();

  event: any;
  eventId = '';

  calendars = {};
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  calendarLoadSubscription: Subscription;
  overlayCloseSubscription: Subscription;

  constructor(private appointmentService: AppointmentService) {
    this.appointmentService.loadCalendars(true, false);
  }

  ngOnInit(): void {
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
    this.calendarLoadSubscription =
      this.appointmentService.calendars$.subscribe((data) => {
        this.calendars = {};
        if (data) {
          data.forEach((account) => {
            if (account.data) {
              account.data.forEach((e) => {
                this.calendars[e.id] = e;
              });
            }
          });
        }
      });
  }

  openDetail(event: any, trigger: any): void {
    this.onShowDetail.emit({ event, trigger });
    return;
  }

  closeOverlay(): void {
    this.onClose.emit();
  }
}
