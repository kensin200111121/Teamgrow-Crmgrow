import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwPush } from '@angular/service-worker';
import { Garbage } from '@models/garbage.model';
import { UserService } from '@services/user.service';
import { environment } from '@environments/environment';
import { REMINDER } from '@constants/variable.constants';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  types = [
    {
      label: 'material viewed',
      id: 'material'
    },
    // {
    //   label: 'email opened',
    //   id: 'email'
    // },
    // {
    //   label: 'email link clicked',
    //   id: 'link_clicked'
    // },
    {
      label: 'text replied',
      id: 'text_replied'
    },
    {
      label: 'task',
      id: 'follow_up'
    },
    {
      label: 'lead Form',
      id: 'lead_capture'
    },
    {
      label: 'unsubscribe',
      id: 'unsubscription'
    },
    {
      label: 'schedule',
      id: 'reminder_scheduler'
    }
  ];
  reminders = REMINDER;
  garbage: Garbage = new Garbage();

  pushInited = false;
  pushSubscription;

  profileSubscription: Subscription;
  isPackageText = true;

  constructor(
    public userService: UserService,
    private swPush: SwPush,
    private snackBar: MatSnackBar,
    private toast: ToastrService
  ) {
    this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
    });
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.isPackageText = res.text_info?.is_enabled;
      if (this.isPackageText === false) {
        const index = this.types.findIndex(
          (item) => item.id === 'text_replied'
        );
        if (index >= 0) {
          this.types.splice(index, 1);
        }
      }

      if (res.scheduler_info?.is_enabled) {
        if (!this.types.find((e) => e.id === 'reminder_scheduler')) {
          this.types.push({
            label: 'schedule',
            id: 'reminder_scheduler'
          });
        }
      } else {
        this.types = this.types.filter((e) => e.id != 'reminder_scheduler');
      }
    });
  }

  ngOnInit(): void {}

  /**
   * Toggle Notification Setting
   * @param notification_type: Email | Text | Desktop
   * @param event: HTML Event
   * @param trigger: Material | Follow up etc
   */
  toggleNotification(
    notification_type: string,
    event: Event,
    trigger = ''
  ): void {
    if (trigger) {
      this.garbage[notification_type][trigger] =
        !this.garbage[notification_type][trigger];
    } else {
      if (this.garbage['entire_' + notification_type] === 1) {
        this.garbage.notification_fields.forEach((e) => {
          this.garbage[notification_type][e] = false;
        });
      } else {
        this.garbage.notification_fields.forEach((e) => {
          this.garbage[notification_type][e] = true;
        });
      }
    }
    this.saveReminder(notification_type);
  }

  toggleDesktopNotification(event: Event, trigger = ''): void {
    if (trigger) {
      if (this.garbage.desktop_notification[trigger]) {
        // disable
        this.garbage.desktop_notification[trigger] = false;
        this.saveReminder('desktop');
      } else {
        this.garbage.desktop_notification[trigger] = true;
        this.saveReminder('desktop');
      }
    } else {
      if (this.garbage.entire_desktop_notification === 1) {
        // disable all desktop notification
        this.garbage.notification_fields.forEach((e) => {
          this.garbage.desktop_notification[e] = false;
        });
        this.saveReminder('desktop');
      } else {
        this.garbage.notification_fields.forEach((e) => {
          this.garbage.desktop_notification[e] = true;
        });
        this.saveReminder('desktop');
      }
    }
  }

  saveReminder(type: string): void {
    if (this.pushInited) {
      this.savePushSubscription()
        .then(() => {
          this.saveAnotherNotifications(type);
        })
        .catch(() => {
          this.saveAnotherNotifications(type);
        });
    } else {
      this.saveAnotherNotifications(type);
    }
  }

  subscribeToPushNotification(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.swPush
        .requestSubscription({
          serverPublicKey: environment.API_KEY.Notification
        })
        .then((subscription) => {
          this.pushInited = true;
          this.pushSubscription = subscription;
          resolve(null);
        })
        .catch((err) => {
          console.log(`Could not subscribe due to:`, err.message);
          this.snackBar.open(
            `Could not subscribe due to ` + err.message,
            'OK',
            {
              verticalPosition: 'bottom',
              horizontalPosition: 'left',
              duration: 5000
            }
          );
          reject();
        });
    });
  }

  savePushSubscription(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.userService
        .enableDesktopNotification(
          this.pushSubscription,
          this.garbage.desktop_notification
        )
        .subscribe((status) => {
          if (status) {
            resolve(null);
          } else {
            reject();
          }
        });
    });
  }

  saveAnotherNotifications(type: string): void {
    let data;
    switch (type) {
      case 'desktop':
        data = {
          desktop_notification: this.garbage.desktop_notification
        };
        break;
      case 'text_notification':
        data = {
          text_notification: this.garbage.text_notification
        };
        break;
      case 'email_notification':
        data = {
          email_notification: this.garbage.email_notification
        };
        break;
      case 'reminder':
        data = {
          reminder_before: this.garbage.reminder_before
        };
        break;
      case 'reminder_scheduler':
        data = {
          reminder_scheduler: this.garbage.reminder_scheduler
        };
        break;
    }
    this.userService.updateGarbage(data).subscribe(() => {
      // this.toast.success('Notification setting is updated successfully.');
      this.userService.updateGarbageImpl(data);
    });
  }
}
