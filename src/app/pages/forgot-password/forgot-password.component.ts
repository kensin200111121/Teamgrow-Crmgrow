import { SspaService } from '../../services/sspa.service';
import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { UserService } from '@services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit {
  loading = false;
  resetEmail = '';
  submitted = false;
  submitting = false;

  constructor(
    private elRef: ElementRef,
    private userService: UserService,
    private router: Router,
    public sspaService: SspaService
  ) {}

  
  ngOnInit(): void {}
  
  ngAfterViewInit(): void {
    let element = <HTMLElement>this.elRef.nativeElement.querySelector('[name="email"]');
    element && element.focus();
  }

  sendResetCode(): void {
    this.loading = true;
    this.submitting = true;
    this.userService
      .requestResetPassword(this.resetEmail)
      .subscribe((status) => {
        this.loading = false;
        this.submitting = false;
        if (status) {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.resetEmail }
          });
        }
      });
  }
}
