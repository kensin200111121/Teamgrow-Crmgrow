import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-scheduled-one',
  templateUrl: './scheduled-one.component.html',
  styleUrls: ['./scheduled-one.component.scss']
})
export class ScheduledOneComponent implements OnInit {
  verifying = false;
  constructor(
    private userService: UserService,
    private router: Router,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.verifying = true;
    this.userService.scheduled().subscribe((res) => {
      if (res) {
        this.verifying = false;
        // this.toast.success('Notification setting is updated successfully');
        this.router.navigate(['/']);
      } else {
        this.verifying = false;
        this.toast.error('Notification setting is failed');
        this.router.navigate(['/']);
      }
    });
  }
}
