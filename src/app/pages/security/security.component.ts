import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent implements OnInit {
  old_password = '';
  new_password = '';
  confirm_password = '';

  saving = false;
  saveSubscription: Subscription;

  constructor(public userService: UserService, private toast: ToastrService) {}

  ngOnInit(): void {}

  saveChange(form): void {
    const hasPassword = this.userService.profile.getValue().hasPassword;
    if (hasPassword) {
      this.saving = true;
      this.saveSubscription && this.saveSubscription.unsubscribe();
      this.userService
        .updatePassword(this.old_password, this.new_password)
        .subscribe((res) => {
          this.saving = false;
          if (res?.status && res?.data?.token) {
            this.old_password = '';
            this.new_password = '';
            this.confirm_password = '';
            form.resetForm();
            this.userService.setToken(res?.data?.token);
            // this.toast.success('', 'Password reset was successful!', {
            //   closeButton: true
            // });
          }
        });
    } else {
      this.saving = true;
      this.saveSubscription && this.saveSubscription.unsubscribe();
      this.userService.createPassword(this.new_password).subscribe((status) => {
        this.saving = false;
        if (status) {
          this.old_password = '';
          this.new_password = '';
          this.confirm_password = '';
          form.resetForm();
          this.userService.updateProfileImpl({ hasPassword: true });
          // this.toast.success('', 'Password create was successful!', {
          //   closeButton: true
          // });
        }
      });
    }
  }
}
