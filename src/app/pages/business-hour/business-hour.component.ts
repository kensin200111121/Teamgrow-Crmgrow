import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { UserService } from '@services/user.service';
import { HOURS } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-business-hour',
  templateUrl: './business-hour.component.html',
  styleUrls: ['./business-hour.component.scss']
})
export class BusinessHourComponent implements OnInit, OnDestroy {
  readonly isSspa = environment.isSspa;
  // Constant Variables
  times = HOURS;

  isBusiness = true;
  startTime = HOURS[0].id;
  endTime = HOURS[23].id;

  // Form Variables
  saving = false;
  saveSubscription: Subscription;
  garbageSubscription: Subscription;
  WeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  businessDay = {
    sun: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true
  };
  userTimezone: string;

  constructor(
    private userService: UserService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        if (_garbage.business_time) {
          this.isBusiness = _garbage.business_time.is_enabled;
          if (this.isBusiness) {
            this.startTime =
              _garbage.business_time.start_time || '08:00:00.000';
            this.endTime = _garbage.business_time.end_time || '20:00:00.000';
          }
        }
        if (_garbage.business_day) {
          const availableDays = Object.values(_garbage.business_day).filter(
            (item) => item
          );
          if (availableDays.length > 0) {
            this.businessDay = _garbage.business_day;
          }
        }
        if (_garbage._id) {
          this.userTimezone =
            this.userService.profile.getValue().time_zone_info;
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.saveSubscription && this.saveSubscription.unsubscribe();
  }

  /**
   * Save the setting
   */
  saveSetting(): void {
    const availableDays = Object.values(this.businessDay).filter(
      (item) => item
    );
    if (availableDays.length === 0) {
      this.toastr.error('Please select one or more business days.');
      return;
    }

    const data = {};
    if (this.isBusiness) {
      data['business_time'] = {
        is_enabled: true,
        start_time: this.startTime,
        end_time: this.endTime
      };
      data['business_day'] = { ...this.businessDay };
    } else {
      data['business_time'] = {
        is_enabled: false
      };
    }
    this.saving = true;
    const garbageUpdateCall = this.userService.updateGarbage(data);
    const userUpdateCall = this.userService.updateProfile({
      time_zone_info: this.userTimezone
    });
    this.saveSubscription = forkJoin(
      this.isSspa ? [garbageUpdateCall, userUpdateCall] : [garbageUpdateCall]
    ).subscribe((res) => {
      this.saving = false;
      if (res.length > 1) {
        this.userService.updateProfileImpl({
          time_zone_info: this.userTimezone
        });
      }
      this.userService.updateGarbageImpl(data);
    });
  }
}
