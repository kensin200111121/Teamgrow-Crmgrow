import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';
import { DetailErrorComponent } from '@components/detail-error/detail-error.component';
import { Strings } from '@constants/strings.constant';
import { Cookie } from '@utils/cookie';
import { SyncService } from './sync.service';
import { SmsSubscribeComponent } from '@app/components/sms-subscribe/sms-subscribe.component';
import { StoreService } from './store.service';
import { environment } from '@environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorSubject: BehaviorSubject<any[]> = new BehaviorSubject([]);
  public errors$ = this.errorSubject.asObservable();
  isSspa = false;

  lastError = {
    operation: 'Ready',
    message: 'Unknown Error',
    detail: '',
    statusText: '',
    status: 200
  };
  lastTime = new Date().getTime();

  constructor(
    private router: Router,
    private toast: ToastrService,
    private dialog: MatDialog,
    private syncService: SyncService,
    private storeService: StoreService
  ) {
    this.isSspa = environment.isSspa;
  }
  addError(operation: string, error: any) {
    const errorObj = {
      operation,
      message: (error.error && error.error.error) || 'Unknown Error',
      detail: error.message,
      statusText: error.statusText,
      status: error.status
    };

    // if (!operation) {
    //   return;
    // }

    // const diffTime = new Date().getTime() - this.lastTime;
    // if (
    //   errorObj.status === 402 ||
    //   errorObj.status === 403 ||
    //   errorObj.status === 406
    // ) {
    //   if (this.lastError.status === errorObj.status) {
    //     return;
    //   }
    // }
    // if (
    //   this.lastError.operation === errorObj.operation &&
    //   this.lastError.status === errorObj.status &&
    //   this.lastError.detail === errorObj.detail &&
    //   diffTime < 2000
    // ) {
    //   return;
    // }
    // if (
    //   this.lastError.status === 0 &&
    //   errorObj.status === 0 &&
    //   diffTime < 3000
    // ) {
    //   return;
    // }
    if (operation === 'GET CONVERT STATUS') {
      return;
    }
    const detail_error_config = {
      panelClass: 'detail-error',
      backdropClass: 'cdk-send-email'
    };
    switch (error.status) {
      case 0:
        // Network Error
        if (
          !document.querySelector('.toast-top-center div') &&
          operation !== 'GET NOTIFICATION DELIVERY STATUS'
        ) {
          // this.toast.error(
          //   Strings.NETWORK_ERROR_CONTENT,
          //   Strings.NETWORK_ERROR_TITLE,
          //   {
          //     positionClass: 'toast-top-center',
          //     timeOut: 360000
          //   }
          // );
        }
        break;
      case 401:
        // Authorization Error (Auth Page & Invalid Token)
        if (this.router.url.indexOf('/login') === 0) {
          if (!this.isSspa) {
            this.toast.error(errorObj.message, Strings.LOGIN, {
              closeButton: true
            });
          }
        } else {
          if (!this.isSspa) {
            this.toast.error(errorObj.message, Strings.AUTHENTICATION, {
              closeButton: true
            });
          }
          this.clearData();
          this.router.navigate(['/']);
        }
        break;
      case 402:
        {
          if (!this.isSspa) {
            this.dialog.closeAll();
          }
          const errorDialog = this.dialog.open(DetailErrorComponent, {
            width: '98vw',
            maxWidth: '420px',
            disableClose: true,
            ...detail_error_config,
            data: {
              errorCode: 402
            }
          });
          errorDialog['_ref']['overlayRef']['_host'].classList.add(
            'error-dialog'
          );
        }
        break;
      case 403:
        {
          this.dialog.closeAll();
          const errorDialog = this.dialog.open(DetailErrorComponent, {
            width: '98vw',
            maxWidth: '420px',
            ...detail_error_config,
            data: {
              errorCode: 403
            }
          });
          errorDialog['_ref']['overlayRef']['_host'].classList.add(
            'error-dialog'
          );
        }
        break;
      case 405:
        {
          if (!this.isSspa) {
            this.dialog.closeAll();
          }
          let connectErrors = [];
          const errors = error.error;
          if (errors.error && errors.error.length > 0) {
            connectErrors = errors.error.filter((e) => {
              if (
                e.error &&
                e.error.search('Invalid login: 535 Authentication failed') !== -1
              ) {
                return true;
              }
            });
          }
          if (connectErrors.length > 0) {
            const connectEmailDialog = this.dialog.open(DetailErrorComponent, {
              width: '98vw',
              maxWidth: '420px',
              ...detail_error_config,
              data: {
                errorCode: 406
              }
            });
            connectEmailDialog['_ref']['overlayRef']['_host'].classList.add(
              'error-dialog'
            );
            connectEmailDialog.afterClosed().subscribe((res) => {
              if (res && res.email_type === 'smtp') {
                this.syncService.smtpConnectRequired.next('Yes');
              }
            });
          } else {
            this.dialog.open(DetailErrorComponent, {
              width: '98vw',
              maxWidth: '420px',
              ...detail_error_config,
              data: {
                errorCode: 405,
                operation: operation,
                error: error.error
              }
            });
          }
        }
        break;
      case 406:
        {
          if (!this.isSspa) {
            this.dialog.closeAll();
          }
          const connectEmailDialog = this.dialog.open(DetailErrorComponent, {
            width: '98vw',
            maxWidth: '420px',
            data: {
              errorCode: 406
            }
          });
          connectEmailDialog['_ref']['overlayRef']['_host'].classList.add(
            'error-dialog'
          );
          connectEmailDialog.afterClosed().subscribe((res) => {
            if (res && res.email_type === 'smtp') {
              this.syncService.smtpConnectRequired.next('Yes');
            }
          });
        }
        break;
      case 427:
        this.dialog.closeAll();
        this.dialog.open(DetailErrorComponent, {
          width: '98vw',
          maxWidth: '420px',
          ...detail_error_config,
          data: {
            errorCode: 427
          }
        });
        break;
      case 408:
        this.dialog.closeAll();
        this.dialog.open(SmsSubscribeComponent, {
          width: '90vw',
          maxWidth: '720px',
          disableClose: true
        });
        break;
      case 409:
        this.dialog.closeAll();

        const profile = this.storeService.profileInfo.getValue();

        if (profile?.source === 'vortex') {
          if (profile?.twilio_number) {
            //To Do - Case of Twilio Number and Vortex User.
          } else if (profile?.wavv_number) {
            //To Do - Case of Wavv Number and Vortex User.
            this.toast.error(errorObj.message, errorObj.operation, {
              closeButton: true
            });
          }
        } else {
          if (profile?.twilio_number || profile?.wavv_number) {
            this.dialog.open(DetailErrorComponent, {
              position: { top: '100px' },
              width: '100vw',
              maxWidth: '650px',
              disableClose: true,
              ...detail_error_config,
              data: {
                errorCode: 409
              }
            });
          } else {
            this.dialog.open(SmsSubscribeComponent, {
              width: '90vw',
              maxWidth: '720px',
              disableClose: true
            });
          }
        }

        break;
      case 410:
        this.dialog.closeAll();

        this.dialog.open(DetailErrorComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '450px',
          disableClose: true,
          ...detail_error_config,
          data: {
            errorCode: 410,
            errorMessage: errorObj.message
          }
        });
        break;
      case 413:
        this.dialog.closeAll();

        this.dialog.open(DetailErrorComponent, {
          position: { top: '100px' },
          width: '100vw',
          maxWidth: '450px',
          disableClose: true,
          ...detail_error_config,
          data: {
            errorCode: 413,
            errorObj: error.error
          }
        });
        break;
      default:
        if (Array.isArray(errorObj.message)) {
          errorObj.message.forEach((message) => {
            this.toast.error(message, errorObj.operation, {
              closeButton: true
            });
          });
        } else {
          this.toast.error(errorObj.message, errorObj.operation, {
            closeButton: true
          });
        }
        this.errorSubject.next([errorObj, ...this.errorSubject.getValue()]);
    }

    this.lastError = errorObj;
    this.lastTime = new Date().getTime();
  }

  showSuccess(message): void {
    this.toast.success('', message, { closeButton: true });
  }

  clearData(): void {
    localStorage.removeCrmItem('token');
    Cookie.setLogout();
  }

  clear$(): void {
    this.errorSubject.next([]);
  }
}
