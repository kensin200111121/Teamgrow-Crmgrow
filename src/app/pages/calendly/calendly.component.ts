import { Component, OnInit, OnDestroy } from '@angular/core';
import { TabItem } from '@utils/data.types';
import { UserService } from '@services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ScheduleService } from '@services/schedule.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '@components/confirm/confirm.component';
import { DialogSettings } from '@constants/variable.constants';
import { ConnectNewCalendarComponent } from '@components/connect-new-calendar/connect-new-calendar.component';
import { AppointmentService } from '@app/services/appointment.service';
@Component({
  selector: 'app-calendly',
  templateUrl: './calendly.component.html',
  styleUrls: ['./calendly.component.scss']
})
export class CalendlyComponent implements OnInit, OnDestroy {
  tabs: TabItem[] = [
    { label: 'Event Types', id: 'types', icon: '' },
    { label: 'Scheduled Events', id: 'schedules', icon: '' },
    { label: 'Integrated Calendars', id: 'calendars', icon: '' },
    { label: 'My Link', id: 'link', icon: '' }
  ];
  selectedTab: TabItem = this.tabs[0];
  routeSubscription: Subscription;
  isChecked = false;
  constructor(
    private location: Location,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastrService,
    public scheduleService: ScheduleService,
    public appointmentService: AppointmentService,
    private dialog: MatDialog
  ) {
    this.userService.profile$.subscribe((profile) => {
      if (profile.scheduler_info && !profile.scheduler_info.is_enabled) {
        this.router.navigate(['/home']);
      }
    });
    this.appointmentService.loadCalendars(true, false);
  }

  ngOnInit(): void {
    this.routeSubscription && this.routeSubscription.unsubscribe();
    this.routeSubscription = this.route.params.subscribe((params) => {
      if (params['tab']) {
        this.selectedTab =
          this.tabs.filter((e) => e.id === params['tab'])[0] || this.tabs[0];
      } else {
        this.selectedTab = this.tabs[0];
      }
    });
    this.checkCalenderInfo();
  }

  ngOnDestroy(): void {}
  checkCalenderInfo() {
    this.appointmentService.calendars$.subscribe((data) => {
      const allCalendars = [];
      if (data) {
        data.forEach((account, index) => {
          if (account.data) {
            account.data.forEach((e, key) => {
              allCalendars.push(e.id);
            });
          }
        });
      }
      // Profile Load Subscription
      this.userService.profile$.subscribe((profile) => {
        let calendarToAdd = profile.scheduler_info?.calendar_id;
        const calendarEmail = profile.scheduler_info?.connected_email || '';
        const calendarList = profile.calendar_list;

        if (!calendarToAdd || !allCalendars.includes(calendarToAdd)) {
          calendarToAdd = allCalendars.length ? allCalendars[0] : '';
        }
        if (!calendarEmail && calendarList?.length) {
          const calendar = calendarList[0];
          const scheduler_info = {
            ...profile.scheduler_info,
            connected_email: calendar.connected_email
          };
          this.userService
            .updateProfile({ scheduler_info })
            .subscribe((res) => {
              this.userService.setProfile(res);
              this.isChecked = true;
            });
        } else {
          this.isChecked = true;
        }
      });
    });
  }

  /**
   * Change the Tab -> This will change the view
   * @param tab : TabItem for the Task and Activity
   */
  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    if (tab.id == 'types') {
      this.location.replaceState('/lead-hub/scheduler/types');
    } else if (tab.id == 'schedules') {
      this.location.replaceState('/lead-hub/scheduler/schedules');
    } else if (tab.id == 'calendars') {
      this.location.replaceState('/lead-hub/scheduler/calendars');
    } else if (tab.id == 'link') {
      this.location.replaceState('/lead-hub/scheduler/link');
    }
  }

  createEventType(): void {}

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
      this.dialog
        .open(ConfirmComponent, {
          ...DialogSettings.CONFIRM,
          data: {
            title: 'Connect calendar',
            message: 'Calendar is not connected. Please connect the calendar.',
            label: 'Calendar'
          }
        })
        .afterClosed()
        .subscribe((status) => {
          if (status) {
            this.addCalendar();
          }
        });
    }
  }
  addCalendar(): void {
    this.dialog.open(ConnectNewCalendarComponent, {
      width: '98vw',
      maxWidth: '420px'
    });
  }
}
