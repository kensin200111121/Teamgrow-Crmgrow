import {
  Component,
  OnInit,
  OnDestroy,
  QueryList,
  ViewChildren
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastrService } from 'ngx-toastr';

import { UserService } from '@services/user.service';
import { ScheduleService } from '@services/schedule.service';
import { STATUS } from '@constants/variable.constants';
import { EventType } from '@models/eventType.model';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { environment } from '@environments/environment';
import { EventTypeAutomationComponent } from '@components/event-type-automation/event-type-automation.component';
import { EventTypeTagsComponent } from '@components/event-type-tags/event-type-tags.component';
import { NotifyComponent } from '@components/notify/notify.component';

@Component({
  selector: 'app-schedule-types',
  templateUrl: './schedule-types.component.html',
  styleUrls: ['./schedule-types.component.scss']
})
export class ScheduleTypesComponent implements OnInit, OnDestroy {
  STATUS = STATUS;
  labelColors = [
    'bgc-orange',
    'bgc-pink-red',
    'bgc-azure',
    'bgc-blue-grey',
    'bgc-blue-green',
    'bgc-teal',
    'bgc-leafy-green',
    'bgc-accept',
    'bgc-pale',
    'bgc-image',
    'bgc-email',
    'bgc-note',
    'bgc-appointment',
    'bgc-silver',
    'bgc-orange-light'
  ];

  @ViewChildren('mainDrop') dropdowns: QueryList<NgbDropdown>;

  constructor(
    private dialog: MatDialog,
    public userService: UserService,
    public scheduleService: ScheduleService,
    private clipboard: Clipboard,
    private toast: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.scheduleService.getEventTypes(true);
  }

  ngOnDestroy(): void {}

  addNewEventType(type): void {
    const profile = this.userService.profile.getValue();
    if (!profile) {
      return;
    }
    if (
      profile.scheduler_info['is_limit'] &&
      profile.scheduler_info['max_count'] &&
      profile.scheduler_info['max_count'] <=
        this.scheduleService.eventTypes.getValue().length
    ) {
      this.toast.error(
        'You reach out max scheduler count',
        'SCHEDULE EVENT TYPE CREATE'
      );
      return;
    }
    if (profile && profile.calendar_connected) {
      this.router.navigate(['/lead-hub/scheduler/event-type/create-' + type]);
    } else {
      this.toast.error(
        'Calendar is not connected. Please connect the calendar.'
      );
    }
  }

  editEventType(eventType: EventType): void {
    this.router.navigate([`/lead-hub/scheduler/event-type/${eventType._id}`]);
  }

  deleteEventType(eventType: EventType): void {
    this.dialog
      .open(ConfirmComponent, {
        position: { top: '100px' },
        data: {
          title: 'Delete Event Type',
          message: 'Are you sure you want to delete this event type?',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          mode: 'warning'
        }
      })
      .afterClosed()
      .subscribe((answer) => {
        if (answer) {
          const garbage = this.userService.garbage.getValue();
          if (!garbage) {
            return;
          }
          this.scheduleService
            .deleteEventType(eventType._id)
            .subscribe((res) => {
              if (res) {
                this.scheduleService.getEventTypes(true);
              }
            });
        }
      });
  }

  copyLink(eventType: EventType): void {
    this.clipboard.copy(this.updateLinkByVortex(eventType.link));
    this.toast.success('Copied the link to clipboard');
  }

  assignAutomation(eventType: EventType): void {
    this.dialog
      .open(EventTypeAutomationComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: eventType
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const {
            auto_trigger_duration,
            auto_trigger_time,
            auto_trigger_type,
            automation
          } = res;
          this.scheduleService
            .updateEventType(eventType._id, {
              auto_trigger_duration,
              auto_trigger_time,
              auto_trigger_type,
              automation
            })
            .subscribe((res) => {
              if (res) {
                this.scheduleService.getEventTypes(true);
              }
            });
        }
      });
  }

  assignTags(eventType: EventType): void {
    this.dialog
      .open(EventTypeTagsComponent, {
        position: { top: '100px' },
        width: '100vw',
        maxWidth: '600px',
        disableClose: true,
        data: JSON.parse(JSON.stringify(eventType))
      })
      .afterClosed()
      .subscribe((tags) => {
        if (tags) {
          this.scheduleService
            .updateEventType(eventType._id, { tags })
            .subscribe((res) => {
              if (res) {
                this.scheduleService.getEventTypes(true);
              }
            });
        }
      });
  }

  viewBookingPage(url) {
    window.open(this.updateLinkByVortex(url), '_blank');
  }
  updateLinkByVortex = (link: string): string => {
    if (environment.isSspa) {
      if (link.indexOf(environment.domain.scheduler) > -1) {
        return link.replace(
          environment.domain.scheduler,
          environment.Vortex_Scheduler
        );
      }
      if (link.indexOf(environment.Vortex_Scheduler) == -1) {
        return `https://${environment.Vortex_Scheduler}` + link;
      }
      return link;
    } else {
      if (link.indexOf(environment.Vortex_Scheduler) > -1) {
        return link.replace(
          environment.Vortex_Scheduler,
          environment.domain.scheduler
        );
      }
      if (link.indexOf(environment.domain.scheduler) == -1) {
        return `https://${environment.domain.scheduler}` + link;
      }
      return link;
    }
  };
}
