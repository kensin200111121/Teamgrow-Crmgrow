import { SspaService } from '../../services/sspa.service';
import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Strings } from '@constants/strings.constant';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  newData = {
    email: '',
    code: '',
    password: ''
  };

  confirm_password = '';

  loading = false;

  submitted = false;

  constructor(
    private elRef: ElementRef,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private toast: ToastrService,
    public sspaService: SspaService
  ) {}

  
  ngOnInit(): void {
    this.newData.email = this.route.snapshot.queryParams['email'];
  }

  ngAfterViewInit(): void {
    let element = <HTMLElement>this.elRef.nativeElement.querySelector('[name="email"]');
    element && element.focus();
  }

  resetPassword(): void {
    this.loading = true;
    const code = this.newData.code.trim();
    this.userService
      .resetPassword({ ...this.newData, code })
      .subscribe((status) => {
        this.loading = false;
        if (status) {
          // this.toast.success('', Strings.RESET_PASSWORD_SUCCESS, {
          //   closeButton: true
          // });
          this.router.navigate(['/login']);
        }
      });
  }
}
