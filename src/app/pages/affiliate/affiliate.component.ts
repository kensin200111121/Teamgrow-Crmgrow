import { SspaService } from '../../services/sspa.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ShareSiteComponent } from '@components/share-site/share-site.component';
import { UserService } from '@services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { validateEmail } from '@app/helper';
import { NotifyComponent } from '@components/notify/notify.component';

@Component({
  selector: 'app-affiliate',
  templateUrl: './affiliate.component.html',
  styleUrls: ['./affiliate.component.scss']
})
export class AffiliateComponent implements OnInit, OnDestroy {
  userCount = 0;
  users: any[] = [];
  userPage = 1;
  loadingMain = false;
  loadingUsers = false;
  creating = false;
  updating = false;

  showDesc = true;
  isWorkflow = '';
  // begin sylla
  firstpromoterURL = 'https://affiliate.crmgrow.com';
  // end sylla
  affiliateCreateSubscription: Subscription;

  affiliate: any = {};
  affiliateInfo: any = {};

  userVersion = 1;

  destroy$: Subject<void> = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private toast: ToastrService,
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    //this.loadMainInfo();
    this.affiliateSetup();
    this.isWorkflow = localStorage.getCrmItem('affiliate_workflow');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  affiliateSetup(): void {
    this.userService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.affiliateInfo = user.affiliate;
          this.userVersion = user.user_version;
        }
      });
  }
  loadUsers(page): void {
    if (this.loadingUsers) {
      return;
    }
    this.loadingUsers = true;
    this.userService
      .loadReferrals(page)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res) => {
          this.loadingUsers = false;
          this.userPage = page;
          const pagination = res['pagination'];
          this.userCount = pagination['total_count'];
          this.userCount = res.data.length;
          this.users = [];
          res.data.forEach((e) => {
            if (e.customer && e.customer.email) {
              this.users.push(e);
            }
          });
        },
        (err) => {
          this.loadingUsers = false;
        }
      );
  }
  loadMainInfo(): void {
    //show affiliate sign up or not
    if (this.loadingMain) {
      return;
    }
    this.loadingMain = true;
    this.userService
      .loadAffiliate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res) => {
          this.loadingMain = false;
          // Load the Main Info
          if (res.data) {
            this.affiliate = res.data;
          }
          if (this.affiliate.id) {
            this.affiliate.share_link = this.affiliate.links[0].url;
            // Load Refered Users
            this.loadUsers(1);
          } else {
            // Create Affiliate if there is no link
            this.creating = true;
            this.affiliateCreateSubscription &&
              this.affiliateCreateSubscription.unsubscribe();
            this.affiliateCreateSubscription = this.userService
              .createAffiliate()
              .subscribe(
                (res) => {
                  if (res.data) {
                    this.affiliate = res.data;
                    this.affiliate.share_link = this.affiliate.links[0].url;
                  }
                  this.creating = false;
                  // Load Refered Users
                  this.loadUsers(1);
                },
                (err) => {
                  this.creating = false;
                }
              );
          }
        },
        (err) => {
          this.loadingMain = false;
        }
      );
  }
  gotoSignUp(): void {
    this.userService.profile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user?._id) {
          window.open(this.firstpromoterURL + '?cust_id=' + user._id);
        }
      });
  }
  closeDesc(): void {
    this.showDesc = false;
  }

  openShare(): void {
    this.dialog
      .open(ShareSiteComponent, {
        width: '96vw',
        maxWidth: '680px',
        disableClose: true,
        data: {
          share_url: this.affiliateInfo.link
        }
      })
      .afterClosed()
      .subscribe((res) => {});
  }

  update(): void {
    if (!validateEmail(this.affiliate.paypal_email)) {
      this.dialog.open(NotifyComponent, {
        maxWidth: '360px',
        width: '96vw',
        data: {
          message: 'Please input valid email address.'
        }
      });
      return;
    }
    this.updating = true;
    this.userService
      .updateAffiliate({ paypal: this.affiliate.paypal_email })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res) => {
          this.updating = false;
          // this.toast.success('Paypal email has been successfully updated.');
        },
        (err) => {
          this.updating = false;
          const errMessage = err.error
            ? err.error.err
            : 'Paypal email update error. Please try agian';
          this.toast.error(errMessage);
        }
      );
  }

  copyLink(): void {
    const url = this.affiliateInfo.link;
    const el = document.createElement('textarea');
    el.value = url;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.toast.success('Copied the link to clipboard');
  }

  getAvatarName(name): any {
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    } else {
      return names[0][0];
    }
  }

  closeWorkflow(): void {
    localStorage.setCrmItem('affiliate_workflow', 'hide');
    this.isWorkflow = 'hide';
  }
}
