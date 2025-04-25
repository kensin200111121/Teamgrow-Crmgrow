import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { UserService } from '@services/user.service';
import { STATUS } from '@constants/variable.constants';
import { AppointmentService } from '@services/appointment.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConnectNewCalendarComponent } from '@components/connect-new-calendar/connect-new-calendar.component';
@Component({
  selector: 'app-integrated-calendars',
  templateUrl: './integrated-calendars.component.html',
  styleUrls: ['./integrated-calendars.component.scss']
})
export class IntegratedCalendarsComponent implements OnInit, OnDestroy {
  STATUS = STATUS;
  public user: any = {};

  calendars = {};

  calendarLoadSubscription: Subscription;
  profileSubscription: Subscription;

  calendarToAdd: any;
  calendarList = [];

  updating = false;

  calendarEmail = '';
  constructor(
    public userService: UserService,
    private toast: ToastrService,
    public appointmentService: AppointmentService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initSubscriptions();
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
  }

  initSubscriptions(): void {
    // Load Calendars
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
    this.calendarLoadSubscription =
      this.appointmentService.calendars$.subscribe((data) => {
        this.calendars = {};
        const allCalendars = [];
        if (data) {
          data.forEach((account, index) => {
            if (account.data) {
              const calendarList = [];
              account.data.forEach((e, key) => {
                allCalendars.push(e.id);
                calendarList.push({ ...e, email: account.email });
              });
              this.calendars[account.email] = calendarList;
            }
          });
        }
        // Profile Load Subscription
        this.profileSubscription && this.profileSubscription.unsubscribe();
        this.profileSubscription = this.userService.profile$.subscribe(
          (profile) => {
            this.user = profile;
            this.calendarToAdd = profile.scheduler_info?.calendar_id;
            this.calendarEmail = profile.scheduler_info?.connected_email || '';
            this.calendarList = profile.calendar_list;

            if (
              !this.calendarToAdd ||
              !allCalendars.includes(this.calendarToAdd)
            ) {
              this.calendarToAdd = allCalendars.length ? allCalendars[0] : '';
            }
          }
        );

        //Update profile if scheduler_info has not calendar email
        if (!this.calendarEmail && this.calendarList?.length) {
          const calendar = this.calendarList[0];
          this.changeCalendarToAdd(calendar);
        }
      });
  }

  changeCalendarToAdd(calendar): void {
    const profile = this.userService.profile.getValue();
    if (profile) {
      this.calendarToAdd = calendar.id;
      const scheduler_info = {
        ...profile.scheduler_info,
        connected_email: calendar.email,
        calendar_id: calendar.id
      };
      this.updating = true;
      this.userService.updateProfile({ scheduler_info }).subscribe((res) => {
        if (res) {
          this.updating = false;
          this.userService.setProfile(res);
          // this.toast.success(
          //   'Calendar to add new events is updated successfully.'
          // );
        }
      });
    }
  }

  changeCalendarsForConflicts(event, index, item) {
    const checked = event.target.checked;
    this.calendarList[index] = { ...item, check_conflict_scheduler: checked };

    this.updating = true;
    this.userService
      .updateProfile({ calendar_list: this.calendarList })
      .subscribe((res) => {
        if (res) {
          this.updating = false;
          this.userService.setProfile(res);
          // this.toast.success(
          //   'Calendar(s) to check conflicts is updated successfully.'
          // );
        }
      });
  }
  addCalendar(): void {
    this.dialog.open(ConnectNewCalendarComponent, {
      width: '98vw',
      maxWidth: '420px'
    });
  }
}
