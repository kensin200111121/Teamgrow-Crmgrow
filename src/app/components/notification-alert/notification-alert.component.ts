import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-notification-alert',
  templateUrl: './notification-alert.component.html',
  styleUrls: ['./notification-alert.component.scss']
})
export class NotificationAlertComponent implements OnInit {
  is_read = true;
  closing = false;
  closeSubscription: Subscription;
  @ViewChild('content') modalContent: ElementRef;

  notification;

  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<NotificationAlertComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.notification = this.data.notification;
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const vDom = document.createElement('div');
    vDom.innerHTML = this.notification?.description || '';
    const vStyle = vDom.querySelector('style');
    if (this.modalContent && this.modalContent.nativeElement) {
      const modalContentDom = <HTMLDivElement>this.modalContent.nativeElement;
      modalContentDom.prepend(vStyle);
    }
  }

  toggleIsRead(): void {
    this.is_read = !this.is_read;
  }

  save(): void {
    if (!this.is_read) {
      this.dialogRef.close();
      return;
    }
    this.closing = true;
    this.closeSubscription = this.userService
      .updateGarbage({ is_read: true })
      .subscribe((res) => {
        this.closing = false;
        if (res) {
          this.userService.updateGarbageImpl({ is_read: true });
        }
        this.dialogRef.close();
      });
  }

  close(): void {
    this.dialogRef.close();
  }

  downloadApp(): void {
    const dom = document.createElement('a');
    if (window.navigator.userAgent.indexOf('Win') !== -1) {
      dom.href =
        'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/CRMRecord.exe';
      dom.click();
    } else {
      dom.href =
        'https://teamgrow.s3.us-east-2.amazonaws.com/recorder/CRMRecord.dmg';
      dom.click();
    }
  }
}
