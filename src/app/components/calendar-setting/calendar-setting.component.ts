import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HOURS } from '@constants/variable.constants';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-calendar-setting',
  templateUrl: './calendar-setting.component.html',
  styleUrls: ['./calendar-setting.component.scss']
})
export class CalendarSettingComponent implements OnInit {
  submitted = false;
  is_enabled = false;
  start_time = '09:00:00.000';
  end_time = '18:00:00.000';
  times = HOURS;
  startIndex = 0;

  garbageSubscription: Subscription;
  garbage: Garbage = new Garbage();

  saving = false;

  constructor(
    private dialogRef: MatDialogRef<CalendarSettingComponent>,
    private userService: UserService,
    private toast: ToastrService
  ) {
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
      if (this.garbage.calendar_info) {
        this.is_enabled = this.garbage.calendar_info.is_enabled;
        if (this.is_enabled) {
          this.start_time = this.garbage.calendar_info.start_time;
          this.end_time = this.garbage.calendar_info.end_time;
        }
        this.changeStart();
      }
    });
  }

  ngOnInit(): void {}

  changeStart(): void {
    this.startIndex = this.times.findIndex((e) => e.id == this.start_time);
  }

  changeState(evt: any): void {
    this.is_enabled = evt;
  }

  setSetting(): void {
    if (this.is_enabled) {
      this.garbage.calendar_info = {
        is_enabled: this.is_enabled,
        start_time: this.start_time,
        end_time: this.end_time
      };
    } else {
      this.garbage.calendar_info = {
        is_enabled: this.is_enabled,
        start_time: '',
        end_time: ''
      };
    }
    this.saving = true;
    this.userService
      .updateGarbage({ calendar_info: this.garbage.calendar_info })
      .subscribe((res) => {
        this.saving = false;
        if (res) {
          this.userService.updateGarbageImpl({
            calendar_info: this.garbage.calendar_info
          });
          this.dialogRef.close(true);
        }
      });
  }
}
