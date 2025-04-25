import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  id = '';
  userInfoSubscription: Subscription;
  verifying = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params) {
        this.id = params['id'];
        if (this.id) {
          this.verifying = true;
          this.userInfoSubscription && this.userInfoSubscription.unsubscribe();
          this.userInfoSubscription = this.userService
            .getUserInfo(this.id)
            .subscribe((res) => {
              if (res && res.status) {
                const email = res['data']['email'];
                this.userService.profile$.subscribe((user) => {
                  if (user && user.email === email) {
                    user.email_verified = true;
                    this.userService
                      .updateProfile(user)
                      .subscribe((profile) => {
                        this.verifying = false;
                        if (profile) {
                          // this.toast.success('Your email is verified.');
                          this.router.navigate(['/home']);
                        }
                      });
                  } else {
                    this.verifying = false;
                    this.toast.error(
                      'Your email is not verified. Please contact us with Support Team'
                    );
                    this.router.navigate(['/']);
                  }
                });
              } else {
                this.verifying = false;
                this.toast.error(
                  'Your email is not verified. Please contact us with Support Team'
                );
                this.router.navigate(['/']);
              }
            });
        }
      }
    });
  }
}
