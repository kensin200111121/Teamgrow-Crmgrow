import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DIAL_LEVEL } from '@constants/variable.constants';
import { User } from '@models/user.model';
import { IntegrationService } from '@services/integration.service';
import { UserService } from '@services/user.service';
import { init } from '@wavv/dialer';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-dial-plan',
  templateUrl: './dial-plan.component.html',
  styleUrls: ['./dial-plan.component.scss']
})
export class DialPlanComponent implements OnInit {
  currentPackage = DIAL_LEVEL.pro;
  selectedPackage = DIAL_LEVEL.pro;
  litePackage = DIAL_LEVEL.lite;
  proPackage = DIAL_LEVEL.pro;
  elitePackage = DIAL_LEVEL.elite;
  connecting = false;
  constructor(
    private integrationService: IntegrationService,
    private dialogRef: MatDialogRef<DialPlanComponent>,
    private userService: UserService,
    private toast: ToastrService,
    private dialog: MatDialog,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {}

  clickPackage(level): void {
    this.selectedPackage = level;
  }

  planButtonLabel(level): string {
    if (level === this.currentPackage.package) {
      return 'Your Plan';
    } else {
      if (level === DIAL_LEVEL.lite.package) {
        return 'Downgrade';
      } else if (level === DIAL_LEVEL.pro.package) {
        if (this.currentPackage.package === DIAL_LEVEL.lite.package) {
          return 'Get Pro';
        } else {
          return 'Downgrade';
        }
      } else if (level === DIAL_LEVEL.elite.package) {
        return 'Get Elite';
      }
    }
  }

  selectPlan(level): void {
    for (const item in DIAL_LEVEL) {
      if (DIAL_LEVEL[item].package === level) {
        this.currentPackage = DIAL_LEVEL[item];
      }
    }
    this.buyDialer();
  }

  buyDialer(): void {
    this.connecting = true;
    this.integrationService
      .buyDialer(this.currentPackage.level)
      .subscribe((_res) => {
        this.userService.loadProfile().subscribe((res) => {
          const userInfo = new User().deserialize(res);
          if (res['dialer_token']) {
            userInfo.dialer_info.is_enabled = true;
            this.userService.profile.next(userInfo);
            init({ token: res['dialer_token'] })
              .then(() => {
                this.connecting = false;
                if (_res && _res['status']) {
                  this.dialogRef.close();
                }
              })
              .catch((err) => {
                this.toast.error(err.message || err, 'Init Wavv Call');
                userInfo.dialer_info.is_enabled = false;
              });
          } else {
            if (userInfo.dialer_info) {
              userInfo.dialer_info.is_enabled = false;
            }
            this.connecting = false;
            if (_res && _res['status']) {
              this.dialogRef.close();
            }
          }
        });
      });
  }
}
