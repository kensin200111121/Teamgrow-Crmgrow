import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { SCHEDULE_DEMO } from '@constants/variable.constants';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  redirectUrl = SCHEDULE_DEMO;
  isSaving = false;

  constructor(
    private userService: UserService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  schedule(): void {
    this.isSaving = true;
    this.userService.scheduleDemo().subscribe((res) => {
      if (res) {
        this.isSaving = false;
        location.href = this.redirectUrl;
      } else {
        this.isSaving = false;
      }
    });
  }
}
